// ============================================================
// game.js — mundo infinito, cámara, pickups, nivel, cofres,
// daño, obstáculos destructibles, victoria/derrota
// ============================================================
window.Game = (function () {

  const G = {
    state: 'menu',
    keys: {}, mouse: null, mouseDown: false,
    time: 0, kills: 0, runBits: 0, bonusBits: 0,
    player: null, enemies: [], pickups: [], obstacles: [],
    weapons: [], passives: {},
    fx: [], texts: [],
    shake: 0,
    pendingLevels: 0,
    pendingChests: [],
    ended: false,
    victoryDelay: 0,
    banished: new Set(),
    shownIds: new Set(),
    obsChunks: new Map(), destroyed: new Set(),
    _chunkSig: '', _obsRev: 0, _llT: 0,
    lastUISync: 0,
    victoryPending: false,
    _lowT: -99,
    biome: null, bitMul: 1, xpMul: 1, revived: false,
  };

  // ---------------- FRASES (miedo a trabajar) ----------------
  const LOW_LINES = [
    '"Si me caen... me toca mandar el currículum."',
    '"No, no, NO: mañana no tengo entrevista."',
    '"Aguanta, aguanta: el CV no se envía solo."',
  ];
  const KILL_LINES = {
    100: '¡100 bajas! Cero entrevistas por ahora.',
    250: '¡250 bajas! RRHH ya no te busca.',
    500: '¡500 bajas! Tu LinkedIn agradece el descanso.',
  };

  // ---------------- RESET RUN ----------------
  function reset() {
    G.time = 0; G.kills = 0; G.runBits = 0; G.bonusBits = 0;
    G.enemies = []; G.pickups = []; G.obstacles = [];
    G.weapons = []; G.passives = {};
    G.fx = []; G.texts = []; G.shake = 0;
    G.pendingLevels = 0; G.pendingChests = [];
    G.ended = false; G.victoryDelay = 0; G.victoryPending = false;
    G.banished = new Set(); G.shownIds = new Set();
    G.obsChunks = new Map(); G.destroyed = new Set();
    G._chunkSig = ''; G._obsRev = 0; G._llT = 0; G._lowT = -99;
    G.lastUISync = 0;
    G.revived = false;

    // nivel de directo y bioma de esta partida
    const tm = UI.tierMults();
    G.bitMul = tm.bits * (1 + 0.10 * ((UI.meta.shop.greed | 0) || 0));
    G.xpMul = tm.xp;
    G.biome = window.Biomes ? Biomes.forTier(UI.tierIndex()) : null;

    G.player = Player.create(UI.meta.char);
    Weapons.reset();
    Enemies.reset();
    Upgrades.recompute();
    G.player.hp = G.player.stats.maxHP;

    // arma inicial: Alejandro ya no depende del compañero temporal
    Weapons.grant(UI.meta.char === 'alex' ? 'taper' : 'polaroid');
    G.player.x = 0; G.player.y = 0;
    G.state = 'playing';
    UI.hideAllScreens();
    UI.hud(true);
    UI.lowHP(false);
    UI.updateBoss(null);
    syncSlots();
    UI.announce('¡EMISIÓN INICIADA!');
    UI.subtitle('"15 minutos y ni un currículum enviado." — misspolaroid');
  }

  function slotList() {
    const list = [];
    for (const w of G.weapons) {
      const d = Upgrades.WEAPONS[w.id];
      if (!d) continue;
      list.push({ id: w.id, icon: d.icon, name: d.name, short: d.short + (w.evolved ? '★' : ''), level: w.level, evolved: w.evolved, max: d.max, type: 'arma' });
    }
    for (const id in G.passives) {
      const d = Upgrades.PASSIVES[id];
      if (d) list.push({ id, icon: d.icon, name: d.name, short: d.short, level: G.passives[id], evolved: false, max: d.max, type: 'pasiva' });
    }
    return list;
  }
  function syncSlots() { UI.updateSlots(slotList()); }

  // ---------------- DAÑO A ENEMIGOS ----------------
  function damageEnemy(e, dmg, opts) {
    if (!e || e.hp <= 0) return;
    e.hp -= dmg;
    e.flash = 0.1;
    if (opts && opts.slow) e.slow = Math.max(e.slow, opts.slow);
    if (opts && opts.kb) {
      e.kb.x += (opts.kx || 0) * opts.kb;
      e.kb.y += (opts.ky || 0) * opts.kb;
    }
    // números de daño (pocos por frame → barato)
    if (G.texts.length < 80 && Math.random() < 0.4) {
      G.texts.push({
        x: e.x + (Math.random() * 8 - 4), y: e.y - e.r - 4,
        txt: String(Math.max(1, Math.round(dmg))),
        t: 0.6, color: dmg >= 25 ? '#ffd24a' : '#ffffff',
      });
    }
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    const idx = G.enemies.indexOf(e);
    if (idx >= 0) G.enemies.splice(idx, 1);
    G.kills++;
    if (KILL_LINES[G.kills]) UI.subtitle(KILL_LINES[G.kills]);
    const t = e.t;

    // XP polaroid
    let val = t.xp;
    if (Math.random() < Math.min(0.5, (G.player.stats.luck || 0))) val *= 2;
    dropPickup('xp', e.x, e.y, val);

    // bits (la dificultad paga: multiplicador del nivel de directo + maldición)
    const bm = G.bitMul || 1;
    if (t.boss) dropPickup('bit', e.x, e.y, Math.round((25 + Math.floor(Math.random() * 25)) * bm));
    else if (t.elite) dropPickup('bit', e.x, e.y, Math.round((8 + Math.floor(Math.random() * 8)) * bm));
    else if (Math.random() < 0.3 + (G.player.stats.luck || 0) * 0.2) dropPickup('bit', e.x, e.y, Math.max(1, Math.round((1 + Math.floor(Math.random() * 3)) * bm)));

    // comida
    if (Math.random() < 0.025) dropPickup('food', e.x, e.y, 30);

    // cofres
    if (t.elite || t.boss) dropPickup('chest', e.x, e.y, t.boss ? 5 : 3);

    AudioFX.kill();
    G.shake = Math.max(G.shake, t.boss ? 8 : 1.5);
    burst(e.x, e.y, t.boss ? 24 : 6, t.boss ? '#ff5f7e' : '#c9c9d4');

    // solo el jefe final cierra el directo: a partir del nivel #2 la
    // Burocracia es un boss de mitad y la Pelirroja la que da la victoria.
    if (t.boss && e.final) triggerVictory();    if (t.boss) UI.updateBoss(G.enemies.find(x => x.t.boss && x.hp > 0) || null);
    if (t.elite) UI.subtitle('💀 Cofre de suscriptor: ¡recógelo!');
    if (e.type === 'picao') UI.subtitle('El Picao se ha ido a llorar a otro chat.');
  }

  function dropPickup(kind, x, y, val) {
    G.pickups.push({
      kind, x: x + (Math.random() * 10 - 5), y: y + (Math.random() * 10 - 5),
      val, t: 0, life: kind === 'chest' ? 60 : 45,
    });
  }

  // ---------------- DAÑO AL JUGADOR ----------------
  function hurtPlayer(dmg) {
    const p = G.player;
    if (p.invuln > 0 || G.state !== 'playing') return;
    if (Math.random() < (p.stats.dodge || 0)) {
      G.texts.push({ x: p.x, y: p.y - 24, txt: 'FLEQUILLO!', t: 0.7, color: '#49d6d6' });
      p.invuln = 0.3;
      return;
    }
    const real = Math.max(1, dmg - (p.stats.armor || 0));
    p.hp -= real;
    p.invuln = 0.7;
    p.hurtT = 0.35;
    G.shake = 7;
    AudioFX.hurt();
    UI.damageFlash();
    G.texts.push({ x: p.x, y: p.y - 20, txt: '-' + Math.round(real), t: 0.7, color: '#ff5f7e' });
    burst(p.x, p.y, 8, '#ff5f7e');
    if (p.hp <= 0) {
      // Segunda toma: la mejora permanente de la tienda.
      if (UI.meta.shop.revive > 0 && !G.revived) {
        G.revived = true;
        p.hp = Math.max(1, Math.floor(p.stats.maxHP * 0.5));
        p.invuln = 2;
        G.shake = 12;
        for (let i = G.enemies.length - 1; i >= 0; i--) {
          const e = G.enemies[i];
          if (!e || e.t.boss) continue;
          const dx = e.x - p.x, dy = e.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          if (d < 130) damageEnemy(e, 60, { kb: 200, kx: dx / d, ky: dy / d });
        }
        AudioFX.levelup();
        UI.announce('¡SEGUNDA TOMA!', true);
        UI.subtitle('"No he cerrado el directo, solo he pausado." — misspolaroid');
        UI.damageFlash();
        return;
      }
      p.hp = 0;
      triggerGameOver();
      return;
    }
    // miedo a trabajar: aviso cuando la cosa se pone fea
    if (p.hp < p.stats.maxHP * 0.3 && G.time - G._lowT > 18) {
      G._lowT = G.time;
      UI.subtitle(LOW_LINES[(Math.random() * LOW_LINES.length) | 0]);
    }
  }

  // ---------------- XP / NIVEL ----------------
  function xpForLevel(lvl) {
    return 4 + lvl * 3 + Math.floor(lvl / 4) * 8;
  }

  function addXP(v) {
    const p = G.player;
    p.xp += v * (G.xpMul || 1) * ((p.stats && p.stats.xpMul) || 1);
    while (p.xp >= p.xpNeed) {
      p.xp -= p.xpNeed;
      p.level++;
      p.xpNeed = xpForLevel(p.level);
      G.pendingLevels++;
    }
    pumpOverlays();
  }

  // una sola pantalla modal a la vez: niveles primero, luego cofres
  function pumpOverlays() {
    if (G.ended || G.state !== 'playing') return;
    if (G.pendingLevels > 0) { openLevelUp(); return; }
    if (G.pendingChests.length) { openChest(G.pendingChests.shift()); return; }
  }

  function openLevelUp() {
    G.state = 'levelup';
    AudioFX.levelup();
    renderLevel();
  }

  function renderLevel(exclude) {
    const excl = exclude || new Set();
    let opts = Upgrades.pick3(G.banished, excl);
    if (!opts.length) opts = Upgrades.fallbackOptions();
    G.shownIds = new Set(opts.map(o => Upgrades.ckey(o.pick)));
    UI.renderLevelUp(opts, {
      rerolls: G.player.stats.rerolls, skips: G.player.stats.skips,
      banishes: G.player.stats.banishes,
      title: G.pendingLevels > 1 ? '¡NIVEL ' + G.player.level + '! (+' + (G.pendingLevels - 1) + ' pendiente)' : '¡NIVEL ' + G.player.level + '!',
    }, {
      pick: (opt) => { Upgrades.applyOption(opt); afterLevel(); },
      reroll: () => {
        if (G.player.stats.rerolls <= 0) return;
        if (!Upgrades.pick3(G.banished, G.shownIds).length) return;
        G.player.stats.rerolls--;
        renderLevel(G.shownIds);
      },
      skip: () => {
        if (G.player.stats.skips <= 0) return;
        G.player.stats.skips--;
        afterLevel();
      },
      banish: (opt) => {
        if (G.player.stats.banishes <= 0) return;
        G.player.stats.banishes--;
        G.banished.add(Upgrades.ckey(opt.pick));
        renderLevel();
      },
    });
  }

  function afterLevel() {
    G.pendingLevels--;
    syncSlots();
    if (G.pendingLevels > 0) renderLevel();
    else {
      G.state = 'playing';
      UI.hideAllScreens();
      UI.hud(true);
      pumpOverlays();
    }
  }

  // ---------------- COFRE ----------------
  function openChest(count) {
    G.state = 'chest';
    AudioFX.chest();
    let opts = Upgrades.chestOptions(count, G.banished);
    if (!opts.length) opts = Upgrades.fallbackOptions();
    UI.renderChest(opts, count >= 5 ? '¡COFRE ÉPICO DE SUSCRIPTOR!' : '¡COFRE DE SUSCRIPTOR!', () => {
      for (const o of opts) Upgrades.applyChest(o);
      syncSlots();
      G.state = 'playing';
      UI.hideAllScreens();
      UI.hud(true);
      pumpOverlays();
    });
  }

  // ---------------- FINAL ----------------
  function statsObj(tier) {
    return {
      time: G.time, kills: G.kills, level: G.player.level,
      bits: G.runBits + G.bonusBits, alive: G.enemies.length,
      tier: tier === undefined ? UI.tierIndex() : tier,
    };
  }

  function endRun(win) {
    if (G.ended) return;
    G.ended = true;
    G.victoryDelay = 0;
    const runTier = UI.tierIndex();
    const total = G.runBits + G.bonusBits;
    UI.addBits(total);
    UI.meta.totalRuns++;
    if (win) {
      UI.meta.wins++;
      UI.addTier();
    }
    if (G.time > UI.meta.bestTime) UI.meta.bestTime = Math.floor(G.time);
    UI.save();
    G.state = win ? 'victory' : 'gameover';
    UI.hud(false);
    UI.lowHP(false);
    UI.updateBoss(null);
    const back = () => { UI.renderMenu(); G.state = 'menu'; };
    const retry = () => { reset(); };
    const st = statsObj(runTier);
    if (win) {
      AudioFX.win();
      UI.victory(st, retry, back, '"Subathon aguantado. Cero currículums, cero firmas." — misspolaroid');
    } else {
      AudioFX.lose();
      UI.gameOver(st, retry, back, st.time >= 9 * 60
        ? 'Te pillaron a un paso del subathon... y el CV ya volaba a la papelera.'
        : 'Te han pillado pronto: mañana, entrevista a las 9:00.');
    }
    // se envía después de pintar la pantalla para que el aviso no lo borre
    if (window.Ranking) {
      UI.rankNote(win, 'Enviando resultado al ranking…');
      Ranking.submit(st, win)
        .then((res) => UI.rankNote(win, Ranking.describe(res)))
        .catch(() => UI.rankNote(win, 'Ranking no disponible (modo offline).'));
    }
  }

  function triggerGameOver() { endRun(false); }
  function triggerVictory() {
    if (G.ended || G.victoryDelay > 0) return;
    G.victoryDelay = 1.4;
    G.shake = Math.max(G.shake, 10);
    UI.announce('¡SUBATHON COMPLETADA!', false);
    UI.subtitle('"Ni una entrevista. Ni un correo a RRHH." — misspolaroid');
  }

  // ---------------- OBSTÁCULOS ----------------
  const CHUNK = 256;
  const OBS_TYPES = ['impresora', 'taquilla', 'vending', 'planta', 'maceta', 'cajas', 'arbol', 'roca'];
  const DECO_TYPES = ['chimenea', 'estanteria', 'tvstream', 'gato', 'lampara'];
  const OBS_HP = {
    impresora: 20, taquilla: 30, vending: 34, planta: 14, maceta: 14, cajas: 26, arbol: 40, roca: 48,
    sillon: 24, escritorio: 28, camara: 18, tripoide: 14, foco: 16,
  };
  const OBS_R = {
    impresora: 11, taquilla: 12, vending: 12, planta: 9, maceta: 8, cajas: 12, arbol: 10, roca: 12,
    chimenea: 13, estanteria: 13, tvstream: 11, gato: 7, lampara: 6,
    sillon: 12, escritorio: 13, camara: 9, tripoide: 8, foco: 8,
    peluche_oso: 5, peluche_conejo: 5, peluche_pingu: 5, peluche_pulpo: 5,
  };

  function biome() {
    return G.biome || { id: 'cabin', rug: 8, density: 0.55, obs: OBS_TYPES, deco: DECO_TYPES };
  }

  function ensureChunks() {
    const pcx = Math.floor(G.player.x / CHUNK), pcy = Math.floor(G.player.y / CHUNK);
    const sig = pcx + ',' + pcy + ',' + G._obsRev + ',' + biome().id;
    if (sig === G._chunkSig) return;
    G._chunkSig = sig;

    const R = 2;
    const wanted = new Set();
    for (let cx = pcx - R; cx <= pcx + R; cx++) {
      for (let cy = pcy - R; cy <= pcy + R; cy++) {
        const key = cx + '_' + cy;
        wanted.add(key);
        if (!G.obsChunks.has(key)) G.obsChunks.set(key, genChunk(cx, cy, key));
      }
    }
    // podar chunks lejanos
    for (const key of Array.from(G.obsChunks.keys())) {
      if (!wanted.has(key)) G.obsChunks.delete(key);
    }
    // reconstruir lista plana
    G.obstacles = [];
    for (const arr of G.obsChunks.values()) {
      for (const o of arr) if (!o.gone) G.obstacles.push(o);
    }
  }

  function genChunk(cx, cy, key) {
    const out = [];
    const b = biome();
    const obsPool = b.obs && b.obs.length ? b.obs : OBS_TYPES;
    const decoPool = b.deco && b.deco.length ? b.deco : DECO_TYPES;
    const density = typeof b.density === 'number' ? b.density : 0.55;
    for (let i = 0; i < 8; i++) {
      const h = Sprites.hash2(cx * 131 + i * 17, cy * 977 + i * 53);
      if (h > density) continue; // densidad por bioma
      const ox = cx * CHUNK + Sprites.hash2(cx + i * 7, cy * 3 + i) * (CHUNK - 40) + 20;
      const oy = cy * CHUNK + Sprites.hash2(cx * 5 + i, cy * 11 + i * 9) * (CHUNK - 40) + 20;
      if (cx === 0 && cy === 0 && Math.sqrt(ox * ox + oy * oy) < 80) continue; // spawn limpio
      const deco = Sprites.hash2(ox + 13, oy + 29) < 0.42;
      const pool = deco ? decoPool : obsPool;
      const type = pool[Math.floor(Sprites.hash2(ox, oy + 5) * pool.length) % pool.length];
      const okey = key + '_' + i;
      if (G.destroyed.has(okey)) continue;
      out.push({
        key: okey, x: ox, y: oy, type, deco,
        hp: deco ? 1e9 : (OBS_HP[type] || 20), maxHp: deco ? 1e9 : (OBS_HP[type] || 20),
        r: 9, or: OBS_R[type] || 9, flash: 0, gone: false,
      });
    }
    // la cabaña siempre tiene peluches tirados (no bloquean)
    if (b.id === 'cabin') {
      const plush = ['peluche_oso', 'peluche_conejo', 'peluche_pingu', 'peluche_pulpo'];
      const spots = [];
      if (cx === 0 && cy === 0) {
        spots.push([-64, 44], [58, 52], [-42, -58], [70, -46]);
      }
      const h2 = Sprites.hash2(cx * 71 + 5, cy * 89 + 3);
      if (h2 < 0.72) {
        spots.push([
          cx * CHUNK + 30 + h2 * (CHUNK - 60),
          cy * CHUNK + 30 + Sprites.hash2(cx * 13 + 7, cy * 37 + 11) * (CHUNK - 60),
        ]);
      }
      spots.forEach((s, k) => {
        const pkey = key + '_p' + k;
        if (G.destroyed.has(pkey)) return;
        const type2 = plush[Math.floor(h2 * 97 + k * 3) % plush.length];
        out.push({
          key: pkey, x: s[0], y: s[1], type: type2, deco: true,
          hp: 1e9, maxHp: 1e9, r: 5, or: OBS_R[type2] || 5, flash: 0, gone: false,
        });
      });
    }
    return out;
  }

  // el escenario sólido: empuja al jugador fuera de los obstáculos
  function collidePlayer(p) {
    for (const o of G.obstacles) {
      if (o.gone) continue;
      if (o.deco && o.type.indexOf('peluche_') === 0) continue; // peluches: solo decorado
      const dx = p.x - o.x, dy = p.y - o.y;
      const min = p.r + o.or;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min) continue;
      const d = Math.sqrt(d2);
      if (d < 0.001) { p.x += min; continue; }
      const push = min - d;
      p.x += dx / d * push;
      p.y += dy / d * push;
    }
  }

  function damageObstaclesAt(x, y, r, dmg) {
    for (const o of G.obstacles) {
      if (o.deco || o.gone || o.hp <= 0) continue;
      const dx = o.x - x, dy = o.y - y;
      if (dx * dx + dy * dy < (r + o.r) * (r + o.r)) {
        o.hp -= dmg;
        o.flash = 0.1;
        if (o.hp <= 0) destroyObstacle(o);
      }
    }
  }

  function destroyObstacle(o) {
    if (o.gone) return;
    o.gone = true;
    G.destroyed.add(o.key);
    G._obsRev++;
    AudioFX.explode();
    burst(o.x, o.y, 10, '#9a9aa8');
    const h = Math.random();
    if (h < 0.5) dropPickup('bit', o.x, o.y, 1 + Math.floor(Math.random() * 4));
    else if (h < 0.85) dropPickup('xp', o.x, o.y, 2);
    else if (h < 0.95) dropPickup('food', o.x, o.y, 20);
    else dropPickup('chest', o.x, o.y, 1);
    G.shake = Math.max(G.shake, 3);
  }

  // ---------------- FX ----------------
  function burst(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 30 + Math.random() * 70;
      G.fx.push({
        kind: 'spark', x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        t: 0.35 + Math.random() * 0.3, color,
        size: 1 + Math.random() * 2,
      });
    }
  }

  // ---------------- UPDATE ----------------
  function update(dt) {
    if (G.state !== 'playing') return;
    G.time += dt;

    // final diferido: si mueres en este margen, gana la derrota
    if (G.victoryDelay > 0) {
      G.victoryDelay -= dt;
      if (G.victoryDelay <= 0) { endRun(true); return; }
    }

    Player.update(dt, G);
    collidePlayer(G.player);
    ensureChunks();
    Enemies.director(dt, G);
    Enemies.update(dt, G);
    Weapons.update(dt, G);

    // obstáculos flash decay
    for (const o of G.obstacles) if (o.flash > 0) o.flash -= dt;

    updatePickups(dt);

    // regen de textos/fx
    for (let i = G.texts.length - 1; i >= 0; i--) {
      G.texts[i].t -= dt; G.texts[i].y -= 22 * dt;
      if (G.texts[i].t <= 0) G.texts.splice(i, 1);
    }
    for (let i = G.fx.length - 1; i >= 0; i--) {
      const f = G.fx[i];
      f.t -= dt;
      if (f.kind === 'spark') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.92; f.vy *= 0.92; }
      else if (f.kind === 'ring') { f.r += (f.max / 0.4) * dt; }
      if (f.t <= 0) G.fx.splice(i, 1);
    }
    if (typeof window !== 'undefined' && window.Particles) window.Particles.update(dt, G);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 26);

    // HUD
    G.lastUISync += dt;
    if (G.lastUISync > 0.08) {
      G.lastUISync = 0;
      UI.updateHUD(G.player, G.time, G.kills,
        G.player.stats.rerolls, G.player.stats.skips, G.player.stats.banishes);
      UI.updateBoss(G.enemies.find(e => e.t.boss && e.hp > 0));
    }
  }

  function updatePickups(dt) {
    const p = G.player;
    const magnetR = p.stats.magnet;
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const pk = G.pickups[i];
      pk.t += dt; pk.life -= dt;
      const dx = p.x - pk.x, dy = p.y - pk.y;
      const d2 = dx * dx + dy * dy;
      const attract = pk.kind === 'chest' ? magnetR * 0.6 : magnetR;
      if (d2 < attract * attract) {
        const d = Math.sqrt(d2) || 1;
        const sp = Math.min(420, 140 + (1 - d / attract) * 500);
        pk.x += dx / d * sp * dt;
        pk.y += dy / d * sp * dt;
      }
      if (d2 < 100) {
        collect(pk);
        G.pickups.splice(i, 1);
        continue;
      }
      if (pk.life <= 0) G.pickups.splice(i, 1);
    }
  }

  function collect(pk) {
    const p = G.player;
    switch (pk.kind) {
      case 'xp':
        AudioFX.xp();
        addXP(pk.val);
        break;
      case 'bit':
        G.runBits += pk.val;
        AudioFX.coin();
        break;
      case 'food':
        p.hp = Math.min(p.stats.maxHP, p.hp + pk.val);
        AudioFX.toast();
        G.texts.push({ x: p.x, y: p.y - 22, txt: '+' + pk.val, t: 0.7, color: '#54d97a' });
        break;
      case 'chest':
        G.pendingChests.push(pk.val);
        pumpOverlays();
        break;
    }
  }

  // ---------------- DRAW ----------------
  function draw(ctx) {
    const W = 640, H = 360;
    const p = G.player || { x: 0, y: 0 };
    let camX = Math.round(p.x - W / 2);
    let camY = Math.round(p.y - H / 2);
    if (G.shake > 0.3) {
      camX += Math.round((Math.random() - 0.5) * G.shake);
      camY += Math.round((Math.random() - 0.5) * G.shake);
    }

    // ---- tiles ----
    const T = 16;
    const x0 = Math.floor(camX / T) - 1, y0 = Math.floor(camY / T) - 1;
    const cols = Math.ceil(W / T) + 2, rows = Math.ceil(H / T) + 2;
    const b = biome();
    for (let ty = y0; ty < y0 + rows; ty++) {
      for (let tx = x0; tx < x0 + cols; tx++) {
        ctx.drawImage(Sprites.tile(tx, ty, b.id, b.rug), tx * T - camX, ty * T - camY);
      }
    }
    // tinte ambiental del bioma (solo el suelo, para no lavar a los personajes)
    if (b.tint) {
      ctx.fillStyle = b.tint;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.save();
    ctx.translate(-camX, -camY);

    // halo cálido alrededor del jugador (profundidad, sin coste de blur)
    if (G.player) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(Sprites.lightEl(),
        Math.round(G.player.x) - 80, Math.round(G.player.y) - 74, 160, 160);
      ctx.restore();
    }

    // ---- obstáculos ----
    for (const o of G.obstacles) {
      if (o.gone) continue;
      if (o.x < camX - 30 || o.x > camX + W + 30 || o.y < camY - 30 || o.y > camY + H + 30) continue;
      const spr = Sprites.get(o.type);
      const fspr = o.flash > 0 ? (Sprites.flash(o.type) || spr) : null;
      ctx.drawImage(Sprites.shadowEl(), o.x - 12, o.y + 5, 24, 10);
      ctx.drawImage(fspr || spr, o.x - spr.width / 2, o.y - spr.height + 6);
      if (o.hp < o.maxHp) { // grietas
        ctx.fillStyle = 'rgba(20,20,26,0.7)';
        ctx.fillRect(o.x - 1, o.y - 8, 2, 6);
      }
    }

    // ---- pickups ----
    for (const pk of G.pickups) {
      const bob = Math.sin(pk.t * 5) * 2;
      let img;
      if (pk.kind === 'xp') img = Sprites.get(pk.val >= 8 ? 'xp_purple' : pk.val >= 4 ? 'xp_red' : pk.val >= 2 ? 'xp_green' : 'xp_blue');
      else if (pk.kind === 'bit') img = Sprites.get('bit');
      else if (pk.kind === 'food') img = Sprites.get('bocadillo');
      else img = Sprites.get('cofre');
      const w = pk.kind === 'chest' ? img.width * 1.3 : img.width;
      const h = pk.kind === 'chest' ? img.height * 1.3 : img.height;
      if (pk.kind === 'chest') {
        ctx.save();
        ctx.shadowColor = '#ffd24a'; ctx.shadowBlur = 8;
        ctx.drawImage(img, pk.x - w / 2, pk.y - h / 2 + bob, w, h);
        ctx.restore();
      } else {
        ctx.drawImage(img, pk.x - w / 2, pk.y - h / 2 + bob);
      }
    }

    Weapons.drawGround(ctx, G);      // charcos y aura
    Enemies.draw(ctx, G);            // enemigos + proyectiles enemigos
    if (G.player) Player.draw(ctx, G);
    Weapons.drawAir(ctx, G);         // flashes, ondas, proyectiles, orbitales, companion

    // ---- fx ----
    if (typeof window !== 'undefined' && window.Particles) window.Particles.draw(ctx);
    for (const f of G.fx) {
      if (f.kind === 'spark') {
        ctx.globalAlpha = Math.max(0, f.t * 2.5);
        ctx.fillStyle = f.color;
        ctx.fillRect(f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
        ctx.globalAlpha = 1;
      } else if (f.kind === 'ring') {
        ctx.globalAlpha = Math.max(0, f.t * 2.5);
        ctx.strokeStyle = f.color || '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // ---- textos de daño ----
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    for (const t of G.texts) {
      ctx.globalAlpha = Math.min(1, t.t * 3);
      ctx.fillStyle = '#000';
      ctx.fillText(t.txt, t.x + 1, t.y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.txt, t.x, t.y);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // ---------------- INPUT helpers ----------------
  function keyDown(code) {
    const first = !G.keys[code]; // ignora el repetido al mantener pulsado
    G.keys[code] = true;
    if (!first) return;
    if (UI.handleKey && UI.handleKey(code)) return;
    if (code === 'Escape') {
      if (G.state === 'playing') pause();
      else if (G.state === 'pause') resume();
    } else if (code === 'KeyM') {
      const muted = AudioFX.toggleMute();
      UI.subtitle(muted ? '🔇 Sonido OFF — M para volver' : '🔊 Sonido ON');
    }
  }
  function keyUp(code) { G.keys[code] = false; }

  function pause() {
    if (G.state !== 'playing') return;
    G.state = 'pause';
    UI.renderPause(slotList(), {
      resume,
      quit: () => {
        UI.lowHP(false); UI.damageFlash(false); UI.updateBoss(null);
        G.state = 'menu'; UI.hud(false); UI.renderMenu();
      },
    });
  }
  function resume() {
    if (G.state !== 'pause') return;
    G.state = 'playing';
    UI.hideAllScreens();
    UI.hud(true);
  }

  return Object.assign(G, {
    reset, update, draw, damageEnemy, hurtPlayer, dropPickup,
    damageObstaclesAt, slotList, syncSlots, burst,
    pause, resume, keyDown, keyUp, openChest, addXP,
    get ready() { return !!G.player; },
  });
})();
