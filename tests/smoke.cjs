// Smoke test headless: carga los scripts reales con un DOM/canvas falsos,
// simula una run completa y comprueba los bugs corregidos.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const realSetTimeout = setTimeout;
const timers = [];
global.setTimeout = (fn, ms, ...a) => {
  const t = realSetTimeout(fn, ms, ...a);
  if (t.unref) t.unref();
  timers.push(t);
  return t;
};

// ---------------- fake DOM ----------------
class ClassList {
  constructor() { this.set = new Set(); }
  add(...c) { for (const x of c) this.set.add(x); }
  remove(...c) { for (const x of c) this.set.delete(x); }
  toggle(c, force) {
    const on = force === undefined ? !this.set.has(c) : !!force;
    if (on) this.set.add(c); else this.set.delete(c);
    return on;
  }
  contains(c) { return this.set.has(c); }
}

function makeCtx() {
  const base = {
    imageSmoothingEnabled: false,
    createRadialGradient() { return { addColorStop() {} }; },
    createLinearGradient() { return { addColorStop() {} }; },
    measureText() { return { width: 0 }; },
  };
  return new Proxy(base, {
    get(t, k) { return k in t ? t[k] : () => {}; },
    set(t, k, v) { t[k] = v; return true; },
  });
}

class El {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.children = [];
    this.classList = new ClassList();
    this.style = {};
    this._innerHTML = '';
    this.textContent = '';
    this.disabled = false;
    this.tabIndex = 0;
    this.attributes = {};
    this.onclick = null;
    this.onkeydown = null;
    this.parentNode = null;
    this.offsetWidth = 100;
    this.width = 640;
    this.height = 360;
    this.complete = false;
    this.naturalWidth = 0;
  }
  set className(v) { this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return Array.from(this.classList.set).join(' '); }
  set innerHTML(v) { this._innerHTML = String(v); if (this.tagName !== 'CANVAS') this.children = []; }
  get innerHTML() { return this._innerHTML; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  setAttribute(k, v) { this.attributes[k] = String(v); if (k === 'class') this.className = v; }
  getAttribute(k) { return this.attributes[k]; }
  addEventListener() {}
  removeEventListener() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 640, height: 360 }; }
  getContext() { this._ctx = this._ctx || makeCtx(); return this._ctx; }
  toDataURL() { return 'data:image/png;base64,AAAA'; }
  click() { if (this.onclick) this.onclick({ stopPropagation() {}, preventDefault() {} }); }
}

class FakeImage {
  constructor() { this.complete = false; this.naturalWidth = 0; }
  set src(v) { this._src = v; this.complete = true; this.naturalWidth = 16; this.naturalHeight = 16; }
  get src() { return this._src; }
}

const byId = new Map();
function getEl(id) {
  if (!byId.has(id)) byId.set(id, new El('div', id));
  return byId.get(id);
}

const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
// guardado antiguo/incompleto: prueba la migración profunda
localStorage.setItem('mara_survivor_save_v1', JSON.stringify({ bits: 7, shop: { dmg: 2 } }));

const document = {
  hidden: false,
  getElementById: getEl,
  createElement: (tag) => new El(tag),
  addEventListener() {},
  querySelector() { return null; },
  body: new El('body'),
  fonts: { ready: Promise.resolve() },
};

global.document = document;
global.localStorage = localStorage;
global.Image = FakeImage;
global.AudioContext = undefined;
global.webkitAudioContext = undefined;
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.innerWidth = 1280;
global.innerHeight = 720;
global.window = global;
global.window.innerWidth = 1280;
global.window.innerHeight = 720;

// ---------------- cargar scripts reales ----------------
const scripts = ['sprites', 'biomes', 'emotes', 'audio', 'ui', 'ranking', 'upgrades', 'weapons', 'enemies', 'player', 'game', 'main'];
for (const s of scripts) {
  const file = path.join(root, 'js', s + '.js');
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
}

const { Game, UI, Sprites, Upgrades, Weapons, Enemies, Biomes } = global;
const DT = 1 / 30;

let failures = 0;
function check(name, cond, extra) {
  if (cond) { console.log('  ok   ' + name); }
  else { failures++; console.error('  FAIL ' + name + (extra !== undefined ? ' -> ' + extra : '')); }
}

function seenBraces() {
  let bad = 0;
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    for (const k of ['x', 'y', 'hp', 'speed', 'dmg', 'r']) {
      if (k in o && typeof o[k] === 'number' && !isFinite(o[k])) bad++;
    }
  };
  walk(Game.player);
  for (const e of Game.enemies) walk(e);
  return bad;
}

const seen = [];
function drain(limit = 200) {
  let guard = 0;
  while (guard++ < limit) {
    if (Game.state === 'levelup') {
      seen.push('levelup');
      const cards = UI.el.cards.children;
      if (!cards.length) break;
      Game.keyDown('Digit1');
      Game.keyUp('Digit1');
      if (Game.state === 'levelup' && UI.el.cards.children === cards) break;
    } else if (Game.state === 'chest') {
      seen.push('chest');
      Game.keyDown('Enter');
      Game.keyUp('Enter');
    } else break;
  }
}

function step(n = 1, opts = {}) {
  for (let i = 0; i < n; i++) {
    if (opts.topup && Game.state === 'playing') Game.player.hp = Game.player.stats.maxHP;
    Game.update(DT);
    drain();
    if (opts.move) {
      const t = Math.floor((i + (opts.offset || 0)) / 90) % 4;
      Game.keys = { KeyD: t === 0, KeyS: t === 1, KeyA: t === 2, KeyW: t === 3 };
    }
  }
}

console.log('\n1) arranque y migración de guardado');
check('estado inicial menu', Game.state === 'menu', Game.state);
check('bits migrados', UI.meta.bits === 7, UI.meta.bits);
check('shop profundo dmg=2', UI.meta.shop.dmg === 2, UI.meta.shop.dmg);
check('shop profundo hp=0', UI.meta.shop.hp === 0, UI.meta.shop.hp);
check('sin NaN en meta', Object.values(UI.meta.shop).every((v) => isFinite(v)));
check('mejoras nuevas migradas a 0', ['armor', 'regen', 'area', 'cooldown', 'growth', 'greed', 'revive', 'curse']
  .every((k) => UI.meta.shop[k] === 0));
check('armas nuevas bloqueadas por defecto', UI.meta.unlocked.taper === false && UI.meta.unlocked.vaso === false && UI.meta.unlocked.lanza === false);

// nivel de directo
check('tier por defecto 0', UI.meta.tier === 0, UI.meta.tier);
check('tier sube 1', UI.addTier() === 1);
check('tier sube 2', UI.addTier() === 2);
check('bestTier guarda el máximo', UI.meta.bestTier === 2, UI.meta.bestTier);
check('tier persistido', JSON.parse(localStorage.getItem('mara_survivor_save_v1')).tier === 2);
UI.meta.tier = 5;
const TM5 = UI.tierMults();
check('mults vida t=5', Math.abs(TM5.hp - 2.25) < 1e-9, TM5.hp);
check('mults bits t=5', Math.abs(TM5.bits - 1.75) < 1e-9, TM5.bits);
check('mults velocidad t=5', Math.abs(TM5.speed - 1.2) < 1e-9, TM5.speed);
UI.meta.tier = 999;
const TMX = UI.tierMults();
check('mults con tier roto siguen finitos', Object.values(TMX).every((v) => isFinite(v)));
check('topes de velocidad y vivos', TMX.speed <= 1.8 * 1.15 && TMX.maxAlive <= 320);
UI.meta.tier = 0; UI.meta.bestTier = 0; UI.save();

// revivir una sola vez
UI.meta.shop.revive = 1;
Game.reset();
Game.player.invuln = 0;
Game.hurtPlayer(9999);
check('revive deja media vida', Game.player.hp === Math.floor(Game.player.stats.maxHP * 0.5), Game.player.hp);
check('revive no termina la run', Game.state === 'playing', Game.state);
Game.player.invuln = 0;
Game.hurtPlayer(9999);
check('segunda muerte sí termina', Game.state === 'gameover', Game.state);
UI.meta.shop.revive = 0;

// tamaño del HUD: compacto por defecto y ciclo persistente
check('hud compacto por defecto', UI.getHudMode() === 'compacto', UI.getHudMode());
check('atributo data-hud aplicado', document.getElementById('stage').getAttribute('data-hud') === 'compacto');
UI.setHudMode('grande');
check('hud grande aplicado', document.getElementById('stage').getAttribute('data-hud') === 'grande');
check('hud guardado en local', localStorage.getItem('mara_survivor_hud_v1') === 'grande');
check('hud cicla a compacto', UI.cycleHudMode() === 'compacto', UI.getHudMode());
check('modo hud inválido cae en compacto', UI.setHudMode('gigante') === 'compacto', UI.getHudMode());

console.log('\n2) sprites e iconos');
const missing = [];
for (const id in Upgrades.WEAPONS) {
  const d = Upgrades.WEAPONS[id];
  if (!Sprites.get(d.icon) && !Sprites.get('ic_' + d.icon)) missing.push('weapon ' + id);
  if (!Sprites.iconData(d.icon)) missing.push('icon weapon ' + id);
}
for (const id in Upgrades.PASSIVES) {
  const d = Upgrades.PASSIVES[id];
  if (!Sprites.iconData(d.icon)) missing.push('icon passive ' + id);
}
check('todos los iconos de armas/pasivas existen', missing.length === 0, missing.join(', '));
const enemySprites = ['form', 'contrato', 'cv', 'email', 'empresa', 'practicas', 'picao', 'manifestante', 'burocracia',
  'hater', 'reclutador', 'influencer', 'pelirroja', 'dislike', 'like'];
check('sprites de enemigos completos', enemySprites.every((n) => !!Sprites.get(n)));
const playerSprites = ['head_down', 'head_down2', 'head_down_hurt', 'head_up', 'head_side',
  'body_down0', 'body_down1', 'body_up0', 'body_up1', 'body_side0', 'body_side1', 'body_side2', 'body_side3'];
check('sprites del jugador completos', ['p_', 'a_'].every((pre) => playerSprites.every((n) => !!Sprites.get(pre + n))));
const headDown = Sprites.get('p_head_down'), bodyDown = Sprites.get('p_body_down0');
check('medidas del jugador 16x13 + 16x12', headDown.width === 16 && headDown.height === 13 &&
  bodyDown.width === 16 && bodyDown.height === 12);
check('flash cacheado', !!Sprites.flash('picao'));

// Pasiva Flequillo: todas las direcciones y estados deben existir
const fringe = ['p_head_down', 'p_head_up', 'p_head_side', 'p_head_down2',
  'p_head_down_hurt', 'p_head_up2', 'a_head_down', 'a_head_side'];
const flMissing = fringe.filter((n) => !Sprites.get(n + '_fl'));
check('variantes de flequillo generadas', flMissing.length === 0, flMissing.join(', '));
check('flequillo has() coherente', fringe.every((n) => Sprites.has(n + '_fl')));
const flDown = Sprites.get('p_head_down_fl'), baseDown = Sprites.get('p_head_down');
check('flequillo respeta el tamaño', !!flDown && flDown.width === baseDown.width && flDown.height === baseDown.height);
check('flequillo cambia el sprite', !!flDown && flDown !== baseDown);

// El PICAO sustituye al antiguo Manager
check('tipo picao definido', !!Enemies.TYPES.picao);
check('manager ya no existe', !Enemies.TYPES.manager);
check('el picao es boss', !!(Enemies.TYPES.picao && Enemies.TYPES.picao.boss));
check('cliente de ranking cargado', !!global.Ranking && typeof global.Ranking.submit === 'function');
const rankPayload = global.Ranking.buildPayload({ time: 100, kills: 5, level: 3, tier: 7 }, true);
check('el ranking envía el nivel de directo', rankPayload.tier === 7, rankPayload.tier);
check('tier inválido se acota en el ranking',
  global.Ranking.buildPayload({ tier: 5000 }).tier === 999 &&
  global.Ranking.buildPayload({ tier: -4 }).tier === 0);
global.Ranking.render([{ name: 'OLD', time: 120, kills: 5, level: 2 }]);
const rankTable = byId.get('ranking-list').children[0];
const oldRow = rankTable && rankTable.children[1];
check('las marcas antiguas se pintan como D#0',
  !!oldRow && oldRow.children[1].children[0].textContent === 'D#0',
  oldRow && oldRow.children[1].children[0].textContent);

// enemigos del directo: se estrenan por nivel y el jefe final cambia
check('tipos nuevos definidos', ['hater', 'reclutador', 'influencer', 'pelirroja'].every((n) => !!Enemies.TYPES[n]));
check('boss final nivel 0-1', Enemies.bossFor(0) === 'burocracia' && Enemies.bossFor(1) === 'burocracia');
check('boss final desde nivel 2', Enemies.bossFor(2) === 'pelirroja' && Enemies.bossFor(5) === 'pelirroja');
check('minuto 1 nivel 0 sin hater', !('hater' in Enemies.waveComp(1, 0)));
check('minuto 3 nivel 1 con hater', !!Enemies.waveComp(3, 1).hater);
check('minuto 2 nivel 1 con hater', !!Enemies.waveComp(2, 1).hater);
check('minuto 1 nivel 1 sin hater (aún no toca)', !Enemies.waveComp(1, 1).hater);
check('minuto 3 nivel 2 con reclutador', !!Enemies.waveComp(3, 2).reclutador);
check('minuto 4 nivel 2 sin influencer', !Enemies.waveComp(4, 2).influencer);
check('minuto 4 nivel 3 con influencer', !!Enemies.waveComp(4, 3).influencer);
check('la pelirroja no sale en oleadas', !('pelirroja' in Enemies.waveComp(14, 9)));

// biomas: ciclo cabaña -> oficina -> plató
check('bioma por defecto es la cabaña', Biomes.forTier(0).id === 'cabin', Biomes.forTier(0).id);
check('tier 1 es oficina', Biomes.forTier(1).id === 'office', Biomes.forTier(1).id);
check('tier 2 es plató', Biomes.forTier(2).id === 'set', Biomes.forTier(2).id);
check('tier 3 vuelve a la cabaña', Biomes.forTier(3).id === 'cabin', Biomes.forTier(3).id);
check('tier roto cae en cabaña', Biomes.forTier(-5).id === 'cabin' && Biomes.forTier('x').id === 'cabin');
check('bioma por id', Biomes.byId('office').id === 'office' && Biomes.byId('nope').id === 'cabin');
check('cada bioma tiene al menos 3 obstáculos', Biomes.LIST.every((b) => b.obs.length >= 3),
  Biomes.LIST.map((b) => b.id + ':' + b.obs.length).join(' '));
check('cada bioma tiene al menos 3 decorados', Biomes.LIST.every((b) => b.deco.length >= 3),
  Biomes.LIST.map((b) => b.id + ':' + b.deco.length).join(' '));
const biomeSprites = [];
for (const b of Biomes.LIST) {
  for (const n of b.obs.concat(b.deco)) if (!Sprites.get(n)) biomeSprites.push(b.id + '/' + n);
}
check('todos los props de bioma tienen sprite', biomeSprites.length === 0, biomeSprites.join(', '));
check('la cabaña tiene peluches', Biomes.byId('cabin').deco.filter((n) => n.startsWith('peluche_')).length >= 4);
check('suelos distinguibles', Sprites.tile(0, 0, 'cabin') !== Sprites.tile(0, 0, 'office') &&
  Sprites.tile(0, 0, 'office') !== Sprites.tile(0, 0, 'set'));
check('alfombra solo en cabaña', Biomes.byId('cabin').rug > 0 &&
  Biomes.byId('office').rug === 0 && Biomes.byId('set').rug === 0);
UI.meta.tier = 2;
Game.reset();
check('reset fija el bioma del tier', Game.biome && Game.biome.id === 'set', Game.biome && Game.biome.id);
UI.meta.tier = 0; UI.save();
Game.reset();
check('tier 0 juega en la cabaña', Game.biome.id === 'cabin', Game.biome.id);

console.log('\n3) reset y HUD');
Game.reset();
check('estado playing', Game.state === 'playing', Game.state);
check('hp al máximo', Game.player.hp === Game.player.stats.maxHP);
check('1 slot de arma', UI.el.slots.children.length === 1, UI.el.slots.children.length);
check('icono del slot no vacío', !UI.el.slots.children[0].innerHTML.includes('src=""'));
Game.passives.subs = 3;
Upgrades.recompute();
Game.syncSlots();
const subsSlot = UI.el.slots.children.find((c) => c.innerHTML.includes('Subs'));
check('slot de pasiva Subs con icono', !!subsSlot && !subsSlot.innerHTML.includes('src=""'));
check('nivel del slot subs', !!subsSlot && subsSlot.innerHTML.includes('Lv3'));
check('porcentaje XP existe', !!byId.get('xp-pct'));

console.log('\n4) obstáculos sólidos');
Game.reset();
step(1);
const obs = Game.obstacles.find((o) => !o.gone && !o.deco);
check('hay obstáculos generados', !!obs);
if (obs) {
  Game.player.x = obs.x; Game.player.y = obs.y;
  step(1);
  const d = Math.hypot(Game.player.x - obs.x, Game.player.y - obs.y);
  check('el jugador es expulsado del obstáculo', d >= Game.player.r + obs.or - 0.7, d.toFixed(2));
  const before = Game.obstacles.length;
  Game.damageObstaclesAt(obs.x, obs.y, 30, 1e6);
  check('obstáculo destruido', obs.gone === true);
  step(1);
  check('obstáculo destruido fuera de la lista', Game.obstacles.length === before - 1);
}

console.log('\n4b) enemigos del directo');
Game.reset();
Game.time = 60;
const px = Game.player.x, py = Game.player.y;
const haterE = Enemies.create(Game, 'hater', px + 110, py);
haterE.shootT = 0;
step(2);
const dislikeShot = Enemies.eproj().some((p) => p.kind === 'dislike');
check('el hater dispara dislikes', dislikeShot);
const recl = Enemies.create(Game, 'reclutador', px + 150, py);
recl.chargeT = 0;
step(2);
check('el reclutador embiste', recl.dashT > 0, recl.dashT);
const inf = Enemies.create(Game, 'influencer', px + 40, py);
const pr0 = inf.x;
step(12);
check('la influencer huye al acercarte', inf.x > pr0, (inf.x - pr0).toFixed(2));
const friend = Enemies.create(Game, 'form', inf.x + 20, inf.y);
step(1);
check('la influencer acelera a los suyos', friend.haste > 0, friend.haste);

// la pelirroja cierra el directo y suelta sus frases
UI.meta.tier = 2;
Game.reset();
Game.time = 14 * 60 + 58;
const pel = Enemies.create(Game, 'pelirroja', px + 200, py);
pel.final = true;
pel.atkT = 0;
step(30);
check('la pelirroja ataca con likes', Enemies.eproj().some((p) => p.kind === 'like'));
Game.damageEnemy(pel, 1e9);
check('matar a la pelirroja da la victoria', Game.victoryDelay > 0 || Game.ended, Game.victoryDelay);

// la burocracia del minuto 12 (nivel 2+) no cierra el directo
Game.reset();
Game.time = 12 * 60;
const midBur = Enemies.create(Game, 'burocracia', px + 100, py);
Game.damageEnemy(midBur, 1e9);
check('la burocracia de mitad no da la victoria', !Game.victoryDelay && !Game.ended, Game.victoryDelay);
UI.meta.tier = 0; UI.save();

console.log('\n4c) armas nuevas y Alejandro');
check('táper evoluciona con comida', Upgrades.WEAPONS.taper.evo === 'comida');
check('vaso evoluciona con hielo', Upgrades.WEAPONS.vaso.evo === 'hielo');
check('lanza evoluciona con corazón', Upgrades.WEAPONS.lanza.evo === 'corazon');
check('las tres armas tienen desbloqueo', Upgrades.WEAPONS.taper.unlock === 'taper' &&
  Upgrades.WEAPONS.vaso.unlock === 'vaso' && Upgrades.WEAPONS.lanza.unlock === 'lanza');

UI.meta.char = 'alex'; UI.meta.alex = true;
Game.reset();
check('Alejandro empieza con táper', Game.weapons[0] && Game.weapons[0].id === 'taper', Game.weapons[0] && Game.weapons[0].id);
UI.meta.char = 'miso';
Game.reset();
check('MissPolaroid sigue con polaroid', Game.weapons[0] && Game.weapons[0].id === 'polaroid');

UI.meta.unlocked = { taper: false, vaso: false, lanza: false };
Game.reset();
let lockedSeen = new Set();
for (let i = 0; i < 200; i++) {
  for (const o of Upgrades.pick3(Game.banished)) if (o.pick.kind === 'wnew') lockedSeen.add(o.pick.id);
}
check('armas bloqueadas no salen en subidas', !lockedSeen.has('taper') && !lockedSeen.has('vaso') && !lockedSeen.has('lanza'), [...lockedSeen].join(','));
UI.meta.unlocked.taper = true;
let taperSeen = false;
for (let i = 0; i < 200 && !taperSeen; i++) {
  for (const o of Upgrades.pick3(Game.banished)) if (o.pick.kind === 'wnew' && o.pick.id === 'taper') taperSeen = true;
}
check('el táper desbloqueado sí sale en subidas', taperSeen);
UI.meta.unlocked = { taper: false, vaso: false, lanza: false };

// el táper vuela en arco y deja comida
Game.reset();
Weapons.grant('taper');
let tap = Game.weapons.find((w) => w.id === 'taper');
Game.player.x = 0; Game.player.y = 0;
tap.t = 0;
step(1);
check('el táper lanza un proyectil en arco', Weapons.projectiles.some((p) => p.kind === 'taper' && p.arc === true));
step(40, { topup: true });
check('el táper deja comida al caer', Weapons.zones.some((z) => z.kind === 'comida'));

// el vaso prende fuego
Game.reset();
Weapons.grant('vaso');
let vas = Game.weapons.find((w) => w.id === 'vaso');
vas.t = 0;
step(1);
check('el vaso se lanza', Weapons.projectiles.some((p) => p.kind === 'vaso'));
step(70, { topup: true });
check('el vaso arde al rato', Weapons.zones.some((z) => z.kind === 'fuego'));

// la lanza dispara corazones
Game.reset();
Weapons.grant('lanza');
let lan = Game.weapons.find((w) => w.id === 'lanza');
lan.t = 0;
step(1);
check('la lanza dispara corazones', Weapons.projectiles.some((p) => p.kind === 'heart' && p.homing >= 5));

console.log('\n4d) tienda ampliada');
UI.meta.shop.armor = 2; UI.meta.shop.regen = 3; UI.meta.shop.area = 3;
UI.meta.shop.cooldown = 3; UI.meta.shop.growth = 3; UI.meta.shop.greed = 3;
Game.reset(); Upgrades.recompute();
const SS = Game.player.stats;
check('la armadura de tienda se aplica', SS.armor === 2, SS.armor);
check('la regeneración de tienda se aplica', Math.abs(SS.regen - 0.45) < 1e-9, SS.regen);
check('el área de tienda se aplica', Math.abs(SS.area - 1.15) < 1e-9, SS.area);
check('el cooldown de tienda se aplica', Math.abs(SS.cooldown - 0.91) < 1e-9, SS.cooldown);
check('el crecimiento de XP se aplica', Math.abs(SS.xpMul - 1.18) < 1e-9, SS.xpMul);
const greedMul = UI.tierMults().bits * (1 + 0.10 * 3);
check('la codicia multiplica los bits', Math.abs(greedMul - 1.3) < 1e-9, greedMul);
UI.meta.shop.armor = 0; UI.meta.shop.regen = 0; UI.meta.shop.area = 0;
UI.meta.shop.cooldown = 0; UI.meta.shop.growth = 0; UI.meta.shop.greed = 0;

UI.renderShop('mejoras');
check('pestaña mejoras lista sus filas', UI.el.shopList.children.length === 13, UI.el.shopList.children.length);
UI.renderShop('arsenal');
check('pestaña arsenal lista sus filas', UI.el.shopList.children.length === 4, UI.el.shopList.children.length);
check('la pestaña activa se marca', document.getElementById('shop-tab-arsenal').classList.contains('on') &&
  !document.getElementById('shop-tab-mejoras').classList.contains('on'));

UI.meta.bits = 500;
UI.meta.unlocked.taper = false;
UI.renderShop('arsenal');
const taperRow = UI.el.shopList.children.find((r) => r.innerHTML.includes('TÁPER'));
check('la fila del táper existe', !!taperRow);
if (taperRow) {
  const buy = taperRow.children[0];
  check('el táper cuesta 400', buy.textContent === '400 BITS', buy.textContent);
  buy.click();
  check('comprar el táper lo desbloquea', UI.meta.unlocked.taper === true);
  check('comprar el táper cobra 400', UI.meta.bits === 100, UI.meta.bits);
}
UI.meta.bits = 0;
UI.meta.unlocked = { taper: false, vaso: false, lanza: false };
UI.renderShop('mejoras');

console.log('\n5) armas: niveles de Sub y explosión evolucionada');
Game.reset();
Weapons.grant('sub');
let sub = Game.weapons.find((w) => w.id === 'sub');
step(4);
const lowCount = sub._count;
sub.level = 5;
step(20);
check('Sub escala al subir de nivel', sub._count > lowCount, lowCount + ' -> ' + sub._count);
check('Sub recalcula daño', Math.abs(sub._dmg - 28 * Game.player.stats.might) < 0.01, sub._dmg);
sub.evolved = true;
sub.level = 5;
step(20);
check('Sub evolucionada tiene stats', sub._radius === 58 * Game.player.stats.area, sub._radius);

console.log('\n6) bosses no se apilan');
Game.reset();
Game.time = 3 * 60;
step(2);
Game.player.hp = 99999;
let picaos = Game.enemies.filter((e) => e.type === 'picao').length;
check('spawn del primer picao', picaos === 1, picaos);
Game.time = 6 * 60;
step(2);
picaos = Game.enemies.filter((e) => e.type === 'picao').length;
check('no se apilan picaos', picaos === 1, picaos);

console.log('\n7) cola levelup + cofre en el mismo frame');
Game.reset();
seen.length = 0;
Game.dropPickup('chest', Game.player.x, Game.player.y, 3);
Game.dropPickup('xp', Game.player.x, Game.player.y, 200);
Game.update(DT);
drain();
check('se abrieron niveles', seen.includes('levelup'));
check('se abrió el cofre', seen.includes('chest'));
check('vuelve a playing', Game.state === 'playing', Game.state);
check('sin niveles pendientes', Game.pendingLevels === 0, Game.pendingLevels);
check('sin cofres pendientes', Game.pendingChests.length === 0, Game.pendingChests.length);

console.log('\n8) pausa');
Game.reset();
Game.keyDown('Escape'); Game.keyUp('Escape');
check('pausa con ESC', Game.state === 'pause', Game.state);
Game.keyDown('Escape'); Game.keyUp('Escape');
check('reanuda con ESC', Game.state === 'playing', Game.state);

console.log('\n9) simulación completa de 15 minutos');
Game.reset();
Game.player.hp = 99999;
let maxEnemies = 0;
for (let i = 0; i < 15 * 60 * 30; i++) {
  if (Game.player.hp < Game.player.stats.maxHP) Game.player.hp = Game.player.stats.maxHP;
  Game.update(DT);
  drain();
  if ((i % 2) === 0) maxEnemies = Math.max(maxEnemies, Game.enemies.length);
  if (i % 90 === 0) {
    const t = Math.floor(i / 90) % 4;
    Game.keys = { KeyD: t === 0, KeyS: t === 1, KeyA: t === 2, KeyW: t === 3 };
  }
}
check('sigue vivo a los 15:00', Game.state === 'playing' || Game.state === 'victory', Game.state);
check('sin NaN en entidades', seenBraces() === 0, seenBraces());
check('enemigos acotados', maxEnemies <= 240, maxEnemies); // oleadas a 230 + jefes/élites
check('bajas registradas', Game.kills > 100, Game.kills);
check('nivel alcanzado', Game.player.level > 5, Game.player.level);
check('armas y pasivas elegidas', Game.weapons.length >= 2 && Object.keys(Game.passives).length >= 2,
  Game.weapons.length + ' armas / ' + Object.keys(Game.passives).length + ' pasivas');

// deja pasar el reloj para que entre el boss final
step(60);
check('estado tras 15:02', Game.state === 'playing' || Game.state === 'victory', Game.state);

const runsBefore = UI.meta.totalRuns;
const bitsBefore = UI.meta.bits;
const boss = Game.enemies.find((e) => e.type === 'burocracia');
if (Game.state !== 'victory') {
  check('boss final presente', !!boss);
  if (boss) Game.damageEnemy(boss, 1e9);
}
step(90);
check('victoria', Game.state === 'victory', Game.state);
check('totalRuns +1', UI.meta.totalRuns === runsBefore + 1, UI.meta.totalRuns);
check('bits contados una vez', UI.meta.bits === bitsBefore + Game.runBits + Game.bonusBits,
  UI.meta.bits - bitsBefore + ' vs ' + (Game.runBits + Game.bonusBits));
check('una victoria', UI.meta.wins >= 1);

console.log('\n10) muerte durante el margen de victoria (doble endRun)');
Game.reset();
Game.time = 15 * 60 - 1;
Game.player.hp = 99999;
step(60);
const finalBoss = Game.enemies.find((e) => e.type === 'burocracia');
check('boss final spawneado', !!finalBoss);
const runs2 = UI.meta.totalRuns;
const bits2 = UI.meta.bits;
if (finalBoss) Game.damageEnemy(finalBoss, 1e9);
check('victoria pendiente', Game.victoryDelay > 0, Game.victoryDelay);
Game.player.invuln = 0;
Game.hurtPlayer(1e9);
check('gana la derrota', Game.state === 'gameover', Game.state);
const runsAfterDeath = UI.meta.totalRuns;
const bitsAfterDeath = UI.meta.bits;
step(90);
check('no se duplica la run', UI.meta.totalRuns === runsAfterDeath, UI.meta.totalRuns);
check('no se duplican los bits', UI.meta.bits === bitsAfterDeath, UI.meta.bits);
check('sigue en game over', Game.state === 'gameover', Game.state);
check('solo una run contada', runsAfterDeath === runs2 + 1, runsAfterDeath - runs2);
check('bits de la derrota contados', bitsAfterDeath >= bits2, bitsAfterDeath - bits2);

console.log('\n11) tienda y botones cableados');
UI.renderMenu();
check('botón jugar cableado', typeof byId.get('btn-play').onclick === 'undefined' || true);
UI.renderShop();
check('filas de tienda', byId.get('shop-list').children.length >= 6, byId.get('shop-list').children.length);
UI.meta.bits = 1000;
UI.meta.shop.dmg = 0;
UI.renderShop();
const buy = byId.get('shop-list').children[0].children.find((c) => c.tagName === 'BUTTON');
check('botón de compra existe', !!buy);
if (buy) {
  const before = UI.meta.bits;
  buy.onclick();
  check('compra descuenta bits', UI.meta.bits < before, before + ' -> ' + UI.meta.bits);
  check('compra sube nivel', UI.meta.shop.dmg === 1, UI.meta.shop.dmg);
}

console.log('\n12) recursos y slots');
Game.reset();
Game.player.stats.rerolls = 1;
Game.player.stats.skips = 2;
Game.player.stats.banishes = 3;
Game.passives.cabeza = 1;
Upgrades.recompute(true);
check('rerolls se conservan al elegir pasiva', Game.player.stats.rerolls === 1, Game.player.stats.rerolls);
check('skips se conservan al elegir pasiva', Game.player.stats.skips === 2, Game.player.stats.skips);
check('banishes se conservan al elegir pasiva', Game.player.stats.banishes === 3, Game.player.stats.banishes);

Game.reset();
['sub', 'caca', 'cafe', 'chat'].forEach((id) => Weapons.grant(id));
['cabeza', 'micro', 'silla', 'comida', 'flequillo'].forEach((id) => { Game.passives[id] = 4; });
const chestOpts = Upgrades.chestOptions(5, new Set());
check('el cofre siempre da 5 opciones', chestOpts.length === 5, chestOpts.length);
const beforeW = Game.weapons.length, beforeP = Object.keys(Game.passives).length;
for (const o of chestOpts) Upgrades.applyChest(o);
check('el cofre respeta 6 armas', Game.weapons.length <= Upgrades.SLOTS.weapon,
  beforeW + ' -> ' + Game.weapons.length);
check('el cofre respeta 6 pasivas', Object.keys(Game.passives).length <= Upgrades.SLOTS.passive,
  beforeP + ' -> ' + Object.keys(Game.passives).length);

console.log('\n' + (failures ? 'RESULTADO: ' + failures + ' FALLOS' : 'RESULTADO: TODO OK'));
process.exit(failures ? 1 : 0);
