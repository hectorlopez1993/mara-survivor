// ============================================================
// ui.js — HUD, pantallas, tienda, meta (localStorage)
// ============================================================
window.UI = (function () {

  // ---------------- META (localStorage) ----------------
  const KEY = 'mara_survivor_save_v1';
  const META_DEFAULT = {
    bits: 0,
    char: 'miso',
    shop: {
      dmg: 0, hp: 0, magnet: 0, reroll: 0, luck: 0,
      armor: 0, regen: 0, area: 0, cooldown: 0, growth: 0, greed: 0, revive: 0, curse: 0,
    },
    unlocked: { taper: false, vaso: false, lanza: false },
    alex: false,
    tier: 0,
    bestTier: 0,
    bestTime: 0,
    totalRuns: 0,
    wins: 0,
  };
  const SHOP_MAX = {
    dmg: 5, hp: 5, magnet: 3, reroll: 3, luck: 4,
    armor: 2, regen: 3, area: 3, cooldown: 3, growth: 3, greed: 3, revive: 1, curse: 5,
  };
  const TIER_MAX = 99;
  let meta = load();

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function toInt(v, min, max, def) {
    if (typeof v !== 'number' || !isFinite(v)) return def;
    return Math.max(min, Math.min(max, Math.floor(v)));
  }

  function mergeMeta(saved) {
    const out = clone(META_DEFAULT);
    if (!saved || typeof saved !== 'object') return out;
    out.bits = toInt(saved.bits, 0, 1e9, 0);
    out.alex = saved.alex === true;
    out.char = saved.char === 'alex' && out.alex ? 'alex' : 'miso';
    out.bestTime = (typeof saved.bestTime === 'number' && isFinite(saved.bestTime) && saved.bestTime > 0) ? saved.bestTime : 0;
    out.totalRuns = toInt(saved.totalRuns, 0, 1e9, 0);
    out.wins = toInt(saved.wins, 0, 1e9, 0);
    out.tier = toInt(saved.tier, 0, TIER_MAX, 0);
    out.bestTier = Math.max(out.tier, toInt(saved.bestTier, 0, TIER_MAX, 0));
    const shop = saved.shop && typeof saved.shop === 'object' ? saved.shop : {};
    for (const k in META_DEFAULT.shop) out.shop[k] = toInt(shop[k], 0, SHOP_MAX[k], 0);
    const un = saved.unlocked && typeof saved.unlocked === 'object' ? saved.unlocked : {};
    for (const k in META_DEFAULT.unlocked) out.unlocked[k] = un[k] === true;
    return out;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return mergeMeta(JSON.parse(raw));
    } catch (e) {}
    return clone(META_DEFAULT);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(meta)); } catch (e) {}
  }
  function addBits(n) {
    if (typeof n !== 'number' || !isFinite(n)) return;
    meta.bits = Math.max(0, Math.floor(meta.bits + n));
    save();
  }

  // ---------------- NIVEL DE DIRECTO ----------------
  const TIER_BIOMES = ['CABAÑA', 'OFICINA', 'PLATÓ'];

  function tierIndex() {
    return Math.max(0, Math.min(TIER_MAX, meta.tier | 0));
  }

  function biomeIndex(tier) {
    const t = tier === undefined ? tierIndex() : Math.max(0, Math.min(TIER_MAX, tier | 0));
    return t % 3;
  }

  function biomeName(tier) {
    const t = tier === undefined ? tierIndex() : tier;
    if (window.Biomes) return window.Biomes.forTier(t).name;
    return TIER_BIOMES[biomeIndex(t)];
  }

  // Multiplicadores entre partidas. Los topes evitan que un guardado roto
  // (o un nivel absurdo) congele el juego.
  function tierMults() {
    const t = tierIndex();
    const curse = Math.max(0, Math.min(5, meta.shop.curse | 0));
    return {
      hp: (1 + 0.25 * t) * (1 + 0.08 * curse),
      speed: Math.min(1.8, 1 + 0.04 * t) * (1 + 0.03 * curse),
      dmg: Math.min(3, 1 + 0.06 * t),
      spawn: (1 + 0.06 * t) * (1 + 0.08 * curse),
      count: 0.7 * t,
      bits: (1 + 0.15 * t) * (1 + 0.12 * curse),
      xp: (1 + 0.05 * t) * (1 + 0.05 * curse),
      maxAlive: Math.min(320, 230 + 10 * t),
    };
  }

  function addTier() {
    meta.tier = Math.min(TIER_MAX, tierIndex() + 1);
    meta.bestTier = Math.max(meta.bestTier || 0, meta.tier);
    save();
    return meta.tier;
  }

  // ---------------- ELEMENTOS ----------------
  const $ = (id) => document.getElementById(id);
  const el = {
    hud: $('hud'), menu: $('menu'), howto: $('howto'), shop: $('shop'),
    ranking: $('ranking'),
    levelup: $('levelup'), chest: $('chest'), pause: $('pause'),
    gameover: $('gameover'), victory: $('victory'),
    hpFill: $('hp-fill'), hpText: $('hp-text'), clock: $('clock'), goal: $('goal'),
    xpFill: $('xp-fill'), lvlText: $('lvl-text'), kills: $('kill-counter'),
    slots: $('weapon-slots'), rerollHud: $('reroll-hud'),
    announce: $('announce'), subtitle: $('subtitle'),
    cards: $('cards'), chestItems: $('chest-items'),
    menuBits: $('menu-bits'), charName: $('char-name'),
    shopBits: $('shop-bits'), shopList: $('shop-list'),
    pauseBuild: $('pause-build'), goStats: $('go-stats'), goBits: $('go-bits'),
    vicStats: $('vic-stats'), vicBits: $('vic-bits'),
    rerollCount: $('reroll-count'), skipCount: $('skip-count'),
    levelupTitle: $('levelup-title'), chestTitle: $('chest-title'),
    xpPct: $('xp-pct'), vignette: $('vignette'),
    bossHud: $('boss-hud'), bossName: $('boss-name'), bossFill: $('boss-fill'),
  };

  const SCREENS = ['menu', 'howto', 'shop', 'ranking', 'levelup', 'chest', 'pause', 'gameover', 'victory'];

  function hideAllScreens() { SCREENS.forEach(s => el[s].classList.add('hidden')); }
  function show(id) { hideAllScreens(); el[id].classList.remove('hidden'); }

  // ---------------- TAMAÑO DEL HUD ----------------
  const HUD_KEY = 'mara_survivor_hud_v1';
  const HUD_MODES = ['compacto', 'normal', 'grande'];
  const HUD_LABELS = { compacto: 'COMPACTO', normal: 'NORMAL', grande: 'GRANDE' };

  function getHudMode() {
    try {
      const v = localStorage.getItem(HUD_KEY);
      if (HUD_MODES.indexOf(v) !== -1) return v;
    } catch (e) {}
    return 'compacto';
  }

  function applyHudMode(mode) {
    const m = HUD_MODES.indexOf(mode) !== -1 ? mode : 'compacto';
    const stage = document.getElementById('stage');
    if (stage) stage.setAttribute('data-hud', m);
    const name = document.getElementById('hud-name');
    if (name) name.textContent = HUD_LABELS[m];
    const namePause = document.getElementById('hud-name-pause');
    if (namePause) namePause.textContent = HUD_LABELS[m];
    return m;
  }

  function setHudMode(mode) {
    const m = applyHudMode(mode);
    try { localStorage.setItem(HUD_KEY, m); } catch (e) {}
    return m;
  }

  function cycleHudMode() {
    const i = HUD_MODES.indexOf(getHudMode());
    return setHudMode(HUD_MODES[(i + 1) % HUD_MODES.length]);
  }

  applyHudMode(getHudMode());

  let announceTimer = null, subTimer = null;
  let lastKills = -1;

  function announce(text, bad) {
    el.announce.textContent = text;
    el.announce.className = bad ? 'bad' : '';
    el.announce.classList.remove('hidden');
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => el.announce.classList.add('hidden'), 2200);
  }

  function subtitle(text) {
    el.subtitle.textContent = text;
    el.subtitle.classList.remove('hidden');
    clearTimeout(subTimer);
    subTimer = setTimeout(() => el.subtitle.classList.add('hidden'), 3000);
  }

  // ---------------- HUD ----------------
  function hud(showIt) { el.hud.classList.toggle('hidden', !showIt); }

  let hurtTimer = null;
  function lowHP(on) {
    el.vignette.classList.toggle('low', !!on);
    const wrap = document.getElementById('hp-wrap');
    if (wrap) wrap.classList.toggle('low', !!on);
    if (on) el.vignette.classList.remove('hidden');
    else if (!el.vignette.classList.contains('hurt')) el.vignette.classList.add('hidden');
  }

  function damageFlash(on) {
    if (on === false) {
      clearTimeout(hurtTimer);
      el.vignette.classList.remove('hurt');
      if (!el.vignette.classList.contains('low')) el.vignette.classList.add('hidden');
      return;
    }
    el.vignette.classList.remove('hidden');
    el.vignette.classList.remove('hurt');
    void el.vignette.offsetWidth;
    el.vignette.classList.add('hurt');
    clearTimeout(hurtTimer);
    hurtTimer = setTimeout(() => {
      el.vignette.classList.remove('hurt');
      if (!el.vignette.classList.contains('low')) el.vignette.classList.add('hidden');
    }, 450);
  }

  function updateBoss(boss) {
    if (!boss) { el.bossHud.classList.add('hidden'); return; }
    el.bossHud.classList.remove('hidden');
    el.bossName.textContent = boss.type === 'burocracia' ? 'LA BUROCRACIA SUPREMA' : 'EL PICAO';
    const pct = Math.max(0, Math.min(100, boss.hp / boss.maxHp * 100));
    el.bossFill.style.width = pct + '%';
    el.bossHud.classList.toggle('danger', pct < 30);
  }

  function updateHUD(p, time, kills, rerolls, skips, banishes) {
    const pct = Math.max(0, p.hp / p.stats.maxHP * 100);
    el.hpFill.style.width = pct + '%';
    el.hpText.textContent = Math.ceil(p.hp) + '/' + Math.round(p.stats.maxHP);
    const m = Math.floor(time / 60), s = Math.floor(time % 60);
    el.clock.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    const xpPct = p.xpNeed > 0 ? Math.max(0, Math.min(100, Math.round(p.xp / p.xpNeed * 100))) : 0;
    el.xpFill.style.width = xpPct + '%';
    if (el.xpPct) el.xpPct.textContent = xpPct + '%';
    el.lvlText.textContent = 'NIV ' + p.level;
    if (kills !== lastKills) {
      if (lastKills >= 0 && kills > lastKills) {
        el.kills.classList.remove('bump');
        void el.kills.offsetWidth;
        el.kills.classList.add('bump');
      }
      lastKills = kills;
    }
    el.kills.textContent = kills + (kills === 1 ? ' baja' : ' bajas');
    const parts = [];
    if (rerolls) parts.push('R' + rerolls);
    if (skips) parts.push('S' + skips);
    if (banishes) parts.push('B' + banishes);
    el.rerollHud.textContent = parts.join(' ');
    lowHP(pct <= 30);
  }

  function updateSlots(items) {
    el.slots.innerHTML = '';
    el.slots.classList.toggle('dense', items.length > 12);
    for (const it of items) {
      const d = document.createElement('div');
      const maxed = it.max && it.level >= it.max;
      d.className = 'ws' + (it.evolved ? ' evo' : '') + (maxed ? ' max' : '');
      if (it.level) d.setAttribute('data-lv', String(Math.min(5, it.level)));
      d.innerHTML = '<img src="' + Sprites.iconData(it.icon || it.id) + '" width="14" height="14" alt="">' +
        '<span>' + it.short + '</span><span class="lv">Lv' + it.level + '</span>' +
        (it.evolved ? '<span class="star" aria-label="evolucionada">★</span>' : '');
      el.slots.appendChild(d);
    }
  }

  // ---------------- LEVEL UP ----------------
  let levelCb = null, rerollCb = null, skipCb = null, banCb = null;
  let levelOpts = [];

  function renderLevelUp(opts, counts, cbs) {
    levelCb = cbs.pick; rerollCb = cbs.reroll; skipCb = cbs.skip; banCb = cbs.banish;
    levelOpts = opts;
    el.rerollCount.textContent = counts.rerolls;
    el.skipCount.textContent = counts.skips;
    $('btn-reroll').disabled = counts.rerolls <= 0;
    $('btn-skip').disabled = counts.skips <= 0;
    $('btn-reroll').onclick = () => { if (rerollCb) { AudioFX.click(); rerollCb(); } };
    $('btn-skip').onclick = () => { if (skipCb) { AudioFX.click(); skipCb(); } };
    el.levelupTitle.textContent = counts.title || '¡SUBIDA DE NIVEL!';
    el.cards.innerHTML = '';
    if (opts.length === 0) {
      const d = document.createElement('div');
      d.innerHTML = '<p style="font-size:11px">Ya lo tienes todo maxeado: ¡+100 de Bits y un bocadillo!</p>';
      el.cards.appendChild(d);
    }
    opts.forEach((o, i) => {
      const c = document.createElement('div');
      const isEvo = o.pick && o.pick.kind === 'evolve';
      c.className = 'card' + (o.isNew ? ' new' : '') + (isEvo ? ' evo' : '');
      c.setAttribute('data-kind', isEvo ? 'evolve' : (o.type === 'pasiva' ? 'passive' : o.type || 'weapon'));
      c.tabIndex = 0;
      c.setAttribute('role', 'button');
      const reward = o.pick.kind === 'bits' || o.pick.kind === 'heal';
      const typeText = isEvo ? 'EVOLUCIÓN' : (reward ? 'RECOMPENSA' : (o.type === 'pasiva' ? 'PASIVA' : 'ARMA'));
      const lvlText = isEvo ? '★' : (reward ? '1 uso' : (o.isNew ? 'Nv 1' : o.level + ' → ' + (o.level + 1)));
      const pips = (!reward && o.max) ? '<div class="pips">' + '◆'.repeat(Math.min(o.level, o.max)) + '◇'.repeat(Math.max(0, o.max - Math.min(o.level, o.max))) + '</div>' : '';
      c.innerHTML =
        '<div class="key" aria-hidden="true">' + (i + 1) + '</div>' +
        '<div class="type' + (o.type === 'pasiva' ? ' passive' : '') + '">' + typeText + '</div>' +
        '<div class="icon" style="background-image:url(' + Sprites.iconData(o.icon) + ')"></div>' +
        '<h3>' + o.name + '</h3>' +
        '<div class="lvl">' + lvlText + '</div>' +
        pips +
        '<p>' + o.desc + '</p>' +
        (o.evoHint ? '<div class="evo">' + o.evoHint + '</div>' : '');
      c.onclick = () => { AudioFX.click(); levelCb(o); };
      c.onkeydown = (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); c.onclick(); }
      };
      if (counts.banishes > 0 && !reward && o.pick.kind !== 'evolve') {
        const b = document.createElement('button');
        b.className = 'ban';
        b.textContent = '⊘ BANEAR';
        b.onclick = (ev) => { ev.stopPropagation(); AudioFX.click(); banCb(o); };
        c.appendChild(b);
      }
      el.cards.appendChild(c);
    });
    show('levelup');
  }

  // atajos de teclado de las pantallas modales
  function handleKey(code) {
    if (!el.levelup.classList.contains('hidden')) {
      const map = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 };
      if (code in map) {
        const card = el.cards.children[map[code]];
        if (card && card.onclick) { card.onclick(); return true; }
        return false;
      }
      if (code === 'KeyR') { const b = $('btn-reroll'); if (b && !b.disabled) { b.onclick(); return true; } return false; }
      if (code === 'KeyS') { const b = $('btn-skip'); if (b && !b.disabled) { b.onclick(); return true; } return false; }
      return false;
    }
    if (!el.chest.classList.contains('hidden')) {
      if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') {
        const b = $('btn-chest-ok'); if (b && b.onclick) { b.onclick(); return true; }
      }
      return false;
    }
    return false;
  }

  // ---------------- COFRE ----------------
  let chestCb = null;
  function renderChest(items, title, cb) {
    chestCb = cb;
    $('btn-chest-ok').onclick = () => { if (chestCb) { AudioFX.click(); chestCb(); } };
    el.chestTitle.textContent = title || '¡COFRE DE SUSCRIPTOR!';
    el.chestItems.innerHTML = '';
    items.forEach((o) => {
      const d = document.createElement('div');
      d.className = 'ci';
      d.innerHTML = '<img src="' + Sprites.iconData(o.icon) + '" width="18" height="18">' +
        '<span><b>' + o.name + '</b> ' + (o.isNew ? '(¡nuevo!)' : '') + ' — ' + o.desc + '</span>';
      el.chestItems.appendChild(d);
    });
    show('chest');
  }

  // ---------------- PAUSA ----------------
  let resumeCb = null, quitCb = null;
  function renderPause(build, cbs) {
    resumeCb = cbs.resume; quitCb = cbs.quit;
    $('btn-resume').onclick = () => { if (resumeCb) { AudioFX.click(); resumeCb(); } };
    $('btn-quit').onclick = () => { if (quitCb) { AudioFX.click(); quitCb(); } };
    el.pauseBuild.innerHTML = build.map(b =>
      '<div class="row"><span>' + (b.name || b.short) + '</span><span>Nv ' + b.level + '</span></div>').join('');
    show('pause');
  }

  // ---------------- ESTADÍSTICAS ----------------
  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function statsHTML(stats) {
    const m = Math.floor(stats.time / 60), s = Math.floor(stats.time % 60);
    const tier = stats.tier === undefined ? meta.tier : stats.tier;
    return [
      ['Tiempo en directo', String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')],
      ['Nivel de directo', '#' + tier + ' · ' + biomeName(tier)],
      ['Bajas', stats.kills],
      ['Nivel alcanzado', stats.level],
      ['Bits ganados', '+' + stats.bits],
      ['Enemigos en pantalla', stats.alive],
    ].map(([a, b]) => '<div><span>' + a + '</span><b>' + b + '</b></div>').join('');
  }

  function gameOver(stats, retryCb, menuCb, flavor) {
    el.goStats.innerHTML = (flavor ? '<p class="flavor">' + flavor + '</p>' : '') + statsHTML(stats);
    el.goBits.textContent = 'BITS TOTALES: ' + meta.bits;
    const note = $('go-rank-note'); if (note) note.textContent = '';
    const rankBtn = $('btn-go-rank');
    if (rankBtn) rankBtn.onclick = () => { AudioFX.click(); if (window.Ranking) Ranking.open(); };
    $('btn-retry').onclick = () => { AudioFX.click(); retryCb(); };
    $('btn-go-menu').onclick = () => { AudioFX.click(); menuCb(); };
    show('gameover');
  }

  const TIER_TEASERS = {
    1: 'NUEVO ENEMIGO: EL HATER · ya no solo insulta en el chat.',
    2: 'NUEVO ENEMIGO: EL RECLUTADOR · y la jefa final cambia: llega LA PELIRROJA.',
    3: 'NUEVO ENEMIGO: LA INFLUENCER · acelera a todo el que tiene cerca.',
  };

  function tierTeaser(tier) {
    const txt = TIER_TEASERS[tier];
    return txt ? '<p class="kicker tier-teaser">' + txt + '</p>' : '';
  }

  function victory(stats, retryCb, menuCb, flavor) {
    el.vicStats.innerHTML = (flavor ? '<p class="flavor">' + flavor + '</p>' : '') +
      '<p class="flavor">DIRECTO #' + meta.tier + ' SUPERADO · SIGUIENTE: ' +
      biomeName(meta.tier) + '</p>' + tierTeaser(meta.tier) + statsHTML(stats);
    el.vicBits.textContent = 'BITS TOTALES: ' + meta.bits;
    const note = $('vic-rank-note'); if (note) note.textContent = '';
    const rankBtn = $('btn-vic-rank');
    if (rankBtn) rankBtn.onclick = () => { AudioFX.click(); if (window.Ranking) Ranking.open(); };
    $('btn-vic-retry').onclick = () => { AudioFX.click(); retryCb(); };
    $('btn-vic-menu').onclick = () => { AudioFX.click(); menuCb(); };
    show('victory');
  }

  function rankNote(win, text) {
    const n = document.getElementById(win ? 'vic-rank-note' : 'go-rank-note');
    if (n) n.textContent = text || '';
  }

  // ---------------- MENU ----------------
  function renderMenu() {
    el.menuBits.textContent = 'BITS: ' + meta.bits;
    const ms = document.getElementById('menu-stats');
    if (ms) {
      const tier = tierIndex();
      ms.textContent = (meta.totalRuns
        ? 'MEJOR ' + fmtTime(meta.bestTime) + '  ·  ' + meta.totalRuns + ' RUN' + (meta.totalRuns === 1 ? '' : 'S') +
          '  ·  ' + meta.wins + ' VICTORIA' + (meta.wins === 1 ? '' : 'S')
        : 'PRIMERA RUN: aguanta los 15:00 y no mandes nada.') +
        '  ·  DIRECTO #' + tier + ' (' + biomeName(tier) + ')';
    }
    el.charName.textContent = meta.char === 'miso' ? 'MISSPOLAROID' : 'ALEJANDRO';
    if (el.goal) el.goal.textContent = 'DIRECTO #' + tierIndex() + ' · ' + biomeName(tierIndex()) + ' · 15:00';
    $('btn-char').disabled = !meta.alex;
    $('btn-char').style.opacity = meta.alex ? 1 : 0.5;
    show('menu');
  }

  // ---------------- TIENDA ----------------
  const SHOP_ITEMS = [
    // pestaña MEJORAS
    { id: 'dmg', tab: 'mejoras', name: 'MICRÓFONO PROFESIONAL', desc: '+6% de daño por nivel', costs: [60, 120, 240, 480, 960], max: 5 },
    { id: 'hp', tab: 'mejoras', name: 'SILLA ERGONÓMICA', desc: '+12 de vida máxima por nivel', costs: [60, 120, 240, 480, 960], max: 5 },
    { id: 'magnet', tab: 'mejoras', name: 'IMÁN DE SEGUIDORES', desc: '+25% de recogida de polaroids', costs: [80, 160, 320], max: 3 },
    { id: 'reroll', tab: 'mejoras', name: 'DADO DE SUSCRIPTOR', desc: '+1 reroll al empezar cada run', costs: [100, 200, 400], max: 3 },
    { id: 'luck', tab: 'mejoras', name: 'TRÉBOL DE STREAM', desc: '+8% suerte: más gemas y Bits', costs: [100, 200, 400, 800], max: 4 },
    { id: 'armor', tab: 'mejoras', name: 'ARMADURA DE STREAMER', desc: '+1 de armadura por nivel (menos daño recibido)', costs: [250, 600], max: 2 },
    { id: 'regen', tab: 'mejoras', name: 'BOCADILLO PERPETUO', desc: '+0,15 de vida por segundo', costs: [200, 400, 800], max: 3 },
    { id: 'area', tab: 'mejoras', name: 'CÁMARA GRAN ANGULAR', desc: '+5% de área en armas y charcos', costs: [150, 300, 600], max: 3 },
    { id: 'cooldown', tab: 'mejoras', name: 'CAFÉ DE MADRUGADA', desc: '−3% de cooldown (atacas más rápido)', costs: [200, 450, 900], max: 3 },
    { id: 'growth', tab: 'mejoras', name: 'GUION DE CONTENIDO', desc: '+6% de XP ganada', costs: [150, 300, 600], max: 3 },
    { id: 'greed', tab: 'mejoras', name: 'MONEDA DE SUPERCHAT', desc: '+10% de Bits ganados', costs: [120, 240, 480], max: 3 },
    { id: 'revive', tab: 'mejoras', name: 'SEGUNDA TOMA', desc: 'Revives una vez al 50% de vida', costs: [2500], max: 1 },
    { id: 'curse', tab: 'mejoras', name: 'MALDICIÓN DEL CHAT', desc: '+8% dificultad, +12% Bits y +5% XP por nivel', costs: [150, 300, 600, 1200, 2400], max: 5 },
    // pestaña ARSENAL
    { id: 'alex', tab: 'arsenal', name: 'DESBLOQUEAR: ALEJANDRO', desc: 'Empieza con Táper de mamá, siempre activo', costs: [300], max: 1, special: 'alex' },
    { key: 'taper', tab: 'arsenal', name: 'TÁPER DE MAMÁ', desc: 'Se lanza en arco y deja comida que ralentiza', costs: [400], max: 1, special: 'unlock' },
    { key: 'vaso', tab: 'arsenal', name: 'VASO DE ALCOHOL', desc: 'Charco que termina PRENDIENDO FUEGO', costs: [500], max: 1, special: 'unlock' },
    { key: 'lanza', tab: 'arsenal', name: 'LANZA DE CORAZONES', desc: 'Estocada que dispara corazones teledirigidos', costs: [700], max: 1, special: 'unlock' },
  ];

  let shopTab = 'mejoras';

  function renderShop(tab) {
    if (tab === 'mejoras' || tab === 'arsenal') shopTab = tab;
    el.shopBits.textContent = '— BITS: ' + meta.bits;
    const tm = document.getElementById('shop-tab-mejoras');
    const ta = document.getElementById('shop-tab-arsenal');
    if (tm && ta) {
      tm.classList.toggle('on', shopTab === 'mejoras');
      ta.classList.toggle('on', shopTab === 'arsenal');
      tm.onclick = () => { AudioFX.click(); renderShop('mejoras'); };
      ta.onclick = () => { AudioFX.click(); renderShop('arsenal'); };
    }
    el.shopList.innerHTML = '';
    SHOP_ITEMS.filter((it) => it.tab === shopTab).forEach(it => {
      const isAlex = it.special === 'alex';
      const isUnlock = it.special === 'unlock';
      const raw = isAlex ? (meta.alex ? 1 : 0)
        : isUnlock ? (meta.unlocked[it.key] ? 1 : 0)
          : (meta.shop[it.id] | 0);
      const lvl = Math.max(0, Math.min(it.max, raw));
      const maxed = lvl >= it.max;
      const cost = maxed ? 0 : it.costs[lvl];
      const row = document.createElement('div');
      row.className = 'shop-item';
      const pips = (isAlex || isUnlock)
        ? (maxed ? '★ DESBLOQUEADO' : '◇ BLOQUEADO')
        : '◆'.repeat(lvl) + '◇'.repeat(it.max - lvl);
      row.innerHTML =
        '<div class="info"><b>' + it.name + '</b><div class="pips">' + pips + '</div><p>' + it.desc + '</p></div>';
      const btn = document.createElement('button');
      if (maxed) { btn.textContent = 'MAX'; btn.disabled = true; }
      else {
        btn.textContent = cost + ' BITS';
        btn.disabled = meta.bits < cost;
        btn.onclick = () => {
          if (meta.bits < cost) return;
          meta.bits -= cost;
          if (isAlex) meta.alex = true;
          else if (isUnlock) meta.unlocked[it.key] = true;
          else meta.shop[it.id]++;
          save(); AudioFX.chest(); renderShop();
        };
      }
      row.appendChild(btn);
      el.shopList.appendChild(row);
    });
    show('shop');
  }

  // ---------------- BOTONES (wiring de main) ----------------
  function on(id, cb) {
    $(id).addEventListener('click', () => { AudioFX.click(); cb(); });
  }

  return {
    meta, save, addBits,
    show, hideAllScreens, hud, announce, subtitle,
    updateHUD, updateSlots, renderLevelUp, renderChest, renderPause,
    gameOver, victory, renderMenu, renderShop, on, rankNote,
    getHudMode, setHudMode, cycleHudMode,
    tierIndex, tierMults, addTier, biomeIndex, biomeName,
    updateBoss, lowHP, damageFlash, handleKey,
    el,
  };
})();
