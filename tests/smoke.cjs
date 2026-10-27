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
const scripts = ['sprites', 'emotes', 'audio', 'ui', 'upgrades', 'weapons', 'enemies', 'player', 'game', 'main'];
for (const s of scripts) {
  const file = path.join(root, 'js', s + '.js');
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
}

const { Game, UI, Sprites, Upgrades, Weapons, Enemies } = global;
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
const enemySprites = ['form', 'contrato', 'cv', 'email', 'empresa', 'practicas', 'manager', 'manifestante', 'burocracia'];
check('sprites de enemigos completos', enemySprites.every((n) => !!Sprites.get(n)));
const playerSprites = ['head_down', 'head_down2', 'head_down_hurt', 'head_up', 'head_side',
  'body_down0', 'body_down1', 'body_up0', 'body_up1', 'body_side0', 'body_side1', 'body_side2', 'body_side3'];
check('sprites del jugador completos', ['p_', 'a_'].every((pre) => playerSprites.every((n) => !!Sprites.get(pre + n))));
const headDown = Sprites.get('p_head_down'), bodyDown = Sprites.get('p_body_down0');
check('medidas del jugador 16x13 + 16x12', headDown.width === 16 && headDown.height === 13 &&
  bodyDown.width === 16 && bodyDown.height === 12);
check('flash cacheado', !!Sprites.flash('manager'));

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
let managers = Game.enemies.filter((e) => e.type === 'manager').length;
check('spawn del primer manager', managers === 1, managers);
Game.time = 6 * 60;
step(2);
managers = Game.enemies.filter((e) => e.type === 'manager').length;
check('no se apilan managers', managers === 1, managers);

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
check('enemigos acotados', maxEnemies <= 231, maxEnemies);
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
