// Prueba visual real: sirve el juego, abre Chrome headless por CDP,
// recorre las pantallas, guarda capturas y recoge errores de consola.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const PORT = 8123;
const DBG = 9223;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png',
  '.ico': 'image/x-icon', '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { console.log('  404 ' + url); res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

const profile = path.join(process.env.TEMP || '.', 'mara-chrome-' + Date.now());
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
  '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=' + DBG,
  '--user-data-dir=' + profile,
  '--window-size=1280,720',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJSON(pathname) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: DBG, path: pathname }, (res) => {
      let s = '';
      res.on('data', (d) => { s += d; });
      res.on('end', () => { try { resolve(JSON.parse(s)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

function putJSON(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: DBG, path: pathname, method: 'PUT' }, (res) => {
      let s = '';
      res.on('data', (d) => { s += d; });
      res.on('end', () => { try { resolve(JSON.parse(s)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.end();
  });
}

const errors = [];
const logs = [];
let ws;
let msgId = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, (m) => (m.error ? reject(new Error(method + ': ' + JSON.stringify(m.error))) : resolve(m.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression, awaitPromise = false) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
  if (r.exceptionDetails) {
    const d = r.exceptionDetails;
    throw new Error('evaluate: ' + (d.exception && d.exception.description || d.text) + ' :: ' + expression);
  }
  return r.result.value;
}

async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const file = path.join(OUT, name + '.png');
  fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  console.log('  captura ' + path.relative(ROOT, file));
}

const checks = [];
function check(name, cond, extra) {
  checks.push({ name, ok: !!cond, extra });
  console.log((cond ? '  ok   ' : '  FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + extra));
}

async function main() {
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  console.log('servidor http en ' + PORT);

  let version = null;
  for (let i = 0; i < 80; i++) {
    try { version = await getJSON('/json/version'); break; } catch (e) { await sleep(150); }
  }
  if (!version) throw new Error('Chrome no ha abierto el puerto de depuración');

  const target = await putJSON('/json/new?http://127.0.0.1:' + PORT + '/index.html');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const cb = pending.get(m.id); pending.delete(m.id); cb(m); return; }
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      errors.push((d.exception && d.exception.description) || d.text);
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      errors.push(m.params.args.map((a) => a.value || a.description || '').join(' '));
    } else if (m.method === 'Log.entryAdded') {
      const e = m.params.entry;
      logs.push(e.level + ': ' + e.text);
      if (e.level === 'error' && !/favicon\.ico/i.test(e.text)) errors.push(e.text);
    }
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/index.html' });
  await sleep(1200);

  // guardado corrupto: debe sanearse sin romper la tienda ni los contadores
  await evaluate(`localStorage.setItem('mara_survivor_save_v1', JSON.stringify({
    bits: 'x', char: 'alex', alex: false,
    shop: { dmg: -3, hp: 99, magnet: 1.5, reroll: 'a', luck: 2 },
    totalRuns: -2, wins: 'y', bestTime: Infinity,
  }))`);
  await send('Page.reload');
  await sleep(1000);
  const clean = await evaluate('JSON.parse(JSON.stringify(UI.meta))');
  check('guardado corrupto saneado', clean.bits === 0 && clean.char === 'miso' && clean.alex === false &&
    clean.shop.dmg === 0 && clean.shop.hp === 5 && clean.shop.magnet === 1 && clean.shop.reroll === 0 &&
    clean.shop.luck === 2 && clean.totalRuns === 0 && clean.wins === 0 && clean.bestTime === 0,
    JSON.stringify(clean));

  const ready = await evaluate('typeof Game !== "undefined" && typeof UI !== "undefined" && !!Game.player || Game.state === "menu"');
  check('scripts cargados', ready);
  check('estado menú', await evaluate('Game.state') === 'menu');

  const geom = await evaluate(`(() => {
    const s = document.getElementById('stage').getBoundingClientRect();
    const c = document.getElementById('clock').getBoundingClientRect();
    const b = document.getElementById('boss-hud').getBoundingClientRect();
    return { sw: s.width, sh: s.height, sl: s.left, st: s.top, cw: c.width, bh: b.height,
             overflowX: document.documentElement.scrollWidth, overflowY: document.documentElement.scrollHeight };
  })()`);
  check('stage 1280x720', Math.abs(geom.sw - 1280) < 1 && Math.abs(geom.sh - 720) < 1, JSON.stringify(geom));
  check('sin overflow', geom.overflowX <= 1280 && geom.overflowY <= 720, JSON.stringify(geom));
  await shot('01-menu');

  // tienda y cómo se juega
  await evaluate("document.getElementById('btn-shop').click()");
  await sleep(250);
  check('tienda visible', await evaluate("!document.getElementById('shop').classList.contains('hidden')"));
  const shopFit = await evaluate(`(() => {
    const p = document.querySelector('#shop .panel').getBoundingClientRect();
    const items = [...document.querySelectorAll('#shop-list .shop-item')];
    return { n: items.length, inside: p.bottom <= 720 && p.right <= 1280 };
  })()`);
  check('13 filas de mejoras dentro del panel', shopFit.n === 13 && shopFit.inside, JSON.stringify(shopFit));
  await evaluate("document.getElementById('shop-tab-arsenal').click()");
  await sleep(150);
  const arsenal = await evaluate("document.querySelectorAll('#shop-list .shop-item').length");
  check('arsenal con 4 filas', arsenal === 4, arsenal);
  check('pestaña arsenal activa', await evaluate("document.getElementById('shop-tab-arsenal').classList.contains('on')"));
  await shot('02-shop');
  await evaluate("document.getElementById('shop-tab-mejoras').click()");
  await sleep(120);
  await evaluate("document.getElementById('btn-shop-back').click()");
  await sleep(150);
  await evaluate("document.getElementById('btn-how').click()");
  await sleep(250);
  await shot('03-howto');
  await evaluate("document.getElementById('btn-how-back').click()");
  await sleep(150);

  // partida
  await evaluate("document.getElementById('btn-play').click()");
  await sleep(1300);
  check('en partida', await evaluate('Game.state') === 'playing');
  check('HUD visible', await evaluate("!document.getElementById('hud').classList.contains('hidden')"));
  check('HUD compacto por defecto', await evaluate("document.getElementById('stage').getAttribute('data-hud')") === 'compacto');
  check('botón de tamaño de HUD', await evaluate("!!document.getElementById('btn-hud')"));
  check('la primera partida es en la cabaña', await evaluate('Game.biome && Game.biome.id') === 'cabin');
  check('suelos de los tres biomas existen', await evaluate(
    "['cabin','office','set'].every((b) => !!Sprites.tile(0, 0, b)) && !!Sprites.get('peluche_oso')"));
  const anim = await evaluate('({ t: Game.player.animT, blink: Game.player.blinkT, hurt: Game.player.hurtT })');
  check('animación idle activa', anim.t > 0 && typeof anim.blink === 'number' && anim.hurt === 0, JSON.stringify(anim));
  await shot('04-juego');

  // subida de nivel
  await evaluate('Game.addXP(60)');
  await sleep(300);
  check('pantalla de nivel', await evaluate('Game.state') === 'levelup');
  const cards = await evaluate("document.querySelectorAll('#cards .card').length");
  check('3 tarjetas', cards === 3, cards);
  check('teclas 1/2/3 visibles', await evaluate("!!document.querySelector('#cards .card .key')"));
  await shot('05-levelup');

  // elegir con teclado todas las pendientes
  for (let i = 0; i < 20; i++) {
    if (await evaluate('Game.state') !== 'levelup') break;
    await evaluate("Game.keyDown('Digit1'); Game.keyUp('Digit1')");
    await sleep(60);
  }
  check('vuelve a jugar tras elegir', await evaluate('Game.state') === 'playing', await evaluate('Game.state'));

  // build completa para el HUD
  await evaluate(`(() => {
    const ids = Object.keys(window.Upgrades.WEAPONS);
    for (const id of ids) {
      if (Game.weapons.length >= 6) break;
      if (!Game.weapons.some(w => w.id === id)) window.Weapons.grant(id);
    }
    Game.weapons.length = 6;
    Game.passives = { cabeza: 3, llorona: 1, comida: 5, micro: 4, silla: 5, cafe: 3 };
    window.Upgrades.recompute();
    Game.syncSlots();
    Game.player.hp = Game.player.stats.maxHP;
    Game.player.stats.rerolls = 1; Game.player.stats.skips = 1; Game.player.stats.banishes = 1;
  })()`);
  await sleep(400);
  const slotCount = await evaluate("document.querySelectorAll('#weapon-slots .ws').length");
  check('12 slots de build', slotCount === 12, slotCount);
  check('contadores R/S/B sin glifos rotos', await evaluate("document.getElementById('reroll-hud').textContent") === 'R1 S1 B1',
    await evaluate("document.getElementById('reroll-hud').textContent"));
  await shot('06-hud-completo');

  await evaluate("Game.weapons.push({ id: 'pedo', level: 1, evolved: false, t: 0.3 }); Game.syncSlots();");
  const dense = await evaluate(`(() => {
    const s = document.getElementById('stage').getBoundingClientRect();
    const last = [...document.querySelectorAll('#weapon-slots .ws')].pop().getBoundingClientRect();
    return { dense: document.getElementById('weapon-slots').classList.contains('dense'), bottom: last.bottom, stage: s.bottom };
  })()`);
  check('slots densos no rebosan', dense.dense && dense.bottom <= dense.stage, JSON.stringify(dense));
  await evaluate("Game.weapons.pop(); Game.syncSlots();");

  // cofre
  await evaluate("Game.dropPickup('chest', Game.player.x, Game.player.y, 5)");
  await sleep(500);
  check('pantalla de cofre', await evaluate('Game.state') === 'chest', await evaluate('Game.state'));
  await shot('07-cofre');
  await evaluate("Game.keyDown('Enter'); Game.keyUp('Enter')");
  await sleep(300);
  check('cofre cerrado', await evaluate('Game.state') === 'playing', await evaluate('Game.state'));

  // jefe final + vida baja
  await evaluate(`(() => {
    Game.player.stats.maxHP = 5000; Game.player.hp = 5000;
    Game.time = 15 * 60;
  })()`);
  await sleep(900);
  check('barra de jefe visible', await evaluate("!document.getElementById('boss-hud').classList.contains('hidden')"));
  await shot('08-boss');
  await evaluate('Game.player.hp = Game.player.stats.maxHP * 0.15');
  await sleep(300);
  check('viñeta de vida baja', await evaluate("document.getElementById('vignette').classList.contains('low')"));
  await shot('09-vida-baja');

  // game over
  await evaluate('Game.player.invuln = 0; Game.hurtPlayer(999999)');
  await sleep(400);
  check('pantalla game over', await evaluate('Game.state') === 'gameover', await evaluate('Game.state'));
  await shot('10-gameover');

  // victoria en una run nueva
  await evaluate("document.getElementById('btn-retry').click()");
  await sleep(300);
  await evaluate(`(() => {
    Game.player.hp = 99999;
    Game.time = 15 * 60;
  })()`);
  await sleep(700);
  const hasBoss = await evaluate("Game.enemies.some(e => e.type === 'burocracia')");
  check('burocracia spawneada', hasBoss);
  if (hasBoss) await evaluate("(() => { const b = Game.enemies.find(e => e.type === 'burocracia'); Game.damageEnemy(b, 1e9); })()");
  await sleep(1800);
  check('pantalla de victoria', await evaluate('Game.state') === 'victory', await evaluate('Game.state'));
  await shot('11-victoria');

  // pausa
  await evaluate("document.getElementById('btn-vic-retry').click()");
  await sleep(300);
  await evaluate("Game.keyDown('Escape'); Game.keyUp('Escape')");
  await sleep(200);
  check('pausa', await evaluate('Game.state') === 'pause', await evaluate('Game.state'));
  check('la pausa tiene botón de HUD', await evaluate("!!document.getElementById('btn-hud-pause')"));
  const hudBefore = await evaluate("document.getElementById('stage').getAttribute('data-hud')");
  await evaluate("document.getElementById('btn-hud-pause').click()");
  await sleep(120);
  const hudAfter = await evaluate("document.getElementById('stage').getAttribute('data-hud')");
  check('el botón de pausa cambia el HUD', hudBefore === 'compacto' && hudAfter === 'normal',
    hudBefore + ' -> ' + hudAfter);
  check('la pausa muestra el modo nuevo',
    await evaluate("document.getElementById('hud-name-pause').textContent") === 'NORMAL');
  check('sigue en pausa tras cambiar el HUD', await evaluate('Game.state') === 'pause');
  await evaluate("document.getElementById('btn-hud-pause').click()");
  await sleep(120);
  check('la pausa cicla otra vez', await evaluate("document.getElementById('stage').getAttribute('data-hud')") === 'grande');
  await evaluate("document.getElementById('btn-hud-pause').click()");
  await sleep(120);
  await shot('12-pausa');

  check('sprites nuevos del jugador', await evaluate(`(() => {
    const h = Sprites.get('p_head_down'), b = Sprites.get('p_body_down0');
    return h.width === 16 && h.height === 13 && b.width === 16 && b.height === 12 &&
      !!Sprites.get('p_body_side3') && !!Sprites.get('p_head_down_hurt');
  })()`));

  // galería de sprites del jugador
  await send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/qa-player.html' });
  await sleep(900);
  check('galería de sprites', await evaluate("document.querySelectorAll('#miso canvas').length") === 12,
    await evaluate("document.querySelectorAll('#miso canvas').length"));
  await shot('13-sprites');

  check('sin errores de consola', errors.length === 0, errors.join(' | '));

  const failed = checks.filter((c) => !c.ok);
  console.log('\n' + (failed.length ? 'RESULTADO VISUAL: ' + failed.length + ' FALLOS' : 'RESULTADO VISUAL: TODO OK'));
  if (logs.length) console.log('logs: ' + logs.filter((l) => !/favicon/i.test(l)).slice(0, 10).join(' | '));
  process.exitCode = failed.length ? 1 : 0;
}

main()
  .catch((e) => { console.error('ERROR: ' + e.message); process.exitCode = 1; })
  .finally(async () => {
    try { if (ws) ws.close(); } catch (e) {}
    try { chrome.kill(); } catch (e) {}
    await sleep(300);
    try { server.close(); } catch (e) {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
    setTimeout(() => process.exit(process.exitCode || 0), 200);
  });
