// ============================================================
// upgrades.js — catálogo de armas/pasivas, selección de nivel,
// reroll/skip/banish, condiciones de evolución, stats
// ============================================================
window.Upgrades = (function () {

  function baseStats() {
    return {
      maxHP: 100, armor: 0,
      moveSpeed: 88,          // px/s
      might: 1.0,             // multiplicador de daño
      cooldown: 1.0,          // multiplicador (menor = más rápido)
      area: 1.0,              // multiplicador de área
      amount: 0,              // proyectiles extra
      magnet: 42,             // radio de recogida px
      regen: 0,               // vida/s
      luck: 0,                // 0..1
      rerolls: 1, skips: 1, banishes: 1,
      dodge: 0,               // 0..0.5
      xpMul: 1,               // multiplicador de XP (mochila)
      duration: 1,            // duración de charcos/fuego (cubito)
      headScale: 1.0,         // visual Cabeza Gigante
      headScaleAdd: 0,        // visual Cabeza Gravitatoria
    };
  }

  // ---------------- ARMAS ----------------
  // evo: pasiva catalizadora que permite evolucionar (con cofre)
  const WEAPONS = {
    polaroid: {
      name: 'Polaroid Flash', short: 'Polaroid', icon: 'polaroid',
      max: 5, evo: 'subs', evoName: 'Cámara Réflex',
      desc: 'Destello fotográfico en la dirección que miras.',
      evoDesc: 'FLASH 360° que ciega a todos los que rodean.',
      base: { cd: 1.6, dmg: 12, range: 84, arc: 1.35 },
    },
    caca: {
      name: 'Caca', short: 'Caca', icon: 'caca',
      max: 5, evo: 'cafe', evoName: 'Tormenta de Caca',
      desc: 'Lanza caca que revienta en charcos viscosos.',
      evoDesc: 'Charcos ENORMES que pegan durante mucho más tiempo.',
      base: { cd: 1.9, dmg: 9, speed: 130, splash: 26 },
    },
    sub: {
      name: 'Suscripción', short: 'Subs', icon: 'sub',
      max: 5, evo: 'micro', evoName: 'Sub Bomba',
      desc: 'Insignias de sub girando a tu alrededor.',
      evoDesc: 'Las insignias EXPLOTAN al golpear.',
      base: { cd: 4.0, dmg: 10, radius: 46, orbit: 2 },
    },
    cafe: {
      name: 'Café', short: 'Café', icon: 'cafe',
      max: 5, evo: 'silla', evoName: 'Café Colao',
      desc: 'Aura de café hirviendo que quema a los cercanos.',
      evoDesc: 'Aura gigante que además RALENTIZA a todos.',
      base: { cd: 0.3, dmg: 5, radius: 44 },
    },
    chat: {
      name: 'Chat', short: 'Chat', icon: 'chat',
      max: 5, evo: 'flequillo', evoName: 'Chat Tóxico',
      desc: 'Espama emotes del chat hacia los enemigos.',
      evoDesc: 'Emotes más rápidos que PERFORAN al enemigo.',
      base: { cd: 1.5, dmg: 7, speed: 210, count: 3 },
    },
    alejandro: {
      name: 'Alejandro', short: 'Alex', icon: 'alejandro',
      max: 5, evo: 'comida', evoName: 'Banquete Familiar',
      desc: 'Tu compañero aparece en ráfagas de 3.5s (luego se va 14s). Con Alex, viene Mara.',
      evoDesc: 'Doble ataque con seguimiento perfecto.',
      base: { cd: 1.8, dmg: 11, speed: 165 },
    },
    grito: {
      name: 'Grito', short: 'Grito', icon: 'grito',
      max: 5, evo: 'cabeza', evoName: 'Microfonazo',
      desc: 'AAAAH: onda expansiva con empujón.',
      evoDesc: 'Onda MÁS grande que también daña el doble.',
      base: { cd: 3.2, dmg: 14, range: 70 },
    },
    pedo: {
      name: 'Pedo', short: 'Pedo', icon: 'pedo',
      max: 5, desc: 'Nubes verdes que envenenan y empujan a los enemigos.',
      base: { cd: 2.4, dmg: 7, radius: 22 },
    },
    // --- armas desbloqueables en la tienda ---
    taper: {
      name: 'Táper de mamá', short: 'Táper', icon: 'taper',
      max: 5, evo: 'comida', evoName: 'Táper Familiar', unlock: 'taper',
      desc: 'Se lanza en arco y deja comida que ralentiza. Arma inicial de Alejandro.',
      evoDesc: 'Táperes dobles que dejan un banquete más grande y duradero.',
      base: { cd: 2.0, dmg: 10, speed: 200 },
    },
    vaso: {
      name: 'Vaso de alcohol', short: 'Vaso', icon: 'vaso',
      max: 5, evo: 'hielo', evoName: 'Cóctel Molotov', unlock: 'vaso',
      desc: 'Se rompe en un charco que, al rato, PRENDE FUEGO.',
      evoDesc: 'El fuego deja rastro y dura mucho más.',
      base: { cd: 2.6, dmg: 8, speed: 170 },
    },
    lanza: {
      name: 'Lanza de corazones', short: 'Lanza', icon: 'lanza',
      max: 5, evo: 'corazon', evoName: 'Flecha de Cupido', unlock: 'lanza',
      desc: 'Estocada corta que dispara corazones teledirigidos.',
      evoDesc: 'Los corazones PERFORAN a todo lo que pillan.',
      base: { cd: 1.2, dmg: 12, range: 54 },
    },
  };

  // ---------------- PASIVAS ----------------
  const PASSIVES = {
    cabeza: {
      name: 'Cabeza Gigante', short: 'Cabeza', icon: 'cabeza',
      max: 6, desc: '+8% de área. Tu cabeza crece... ¿y qué?',
      apply(s, l) { s.area += 0.08 * l; s.headScale = 1 + 0.17 * l; },
    },
    micro: {
      name: 'Micrófono', short: 'Micro', icon: 'micro',
      max: 6, desc: '+8% de daño con cada nivel.',
      apply(s, l) { s.might += 0.08 * l; },
    },
    silla: {
      name: 'Silla Gamer', short: 'Silla', icon: 'silla',
      max: 6, desc: '+12 de vida y +1 de armadura por nivel.',
      apply(s, l) { s.maxHP += 12 * l; s.armor += Math.floor((l + 1) / 2); },
    },
    cafe: {
      name: 'Café Extra', short: 'Café+', icon: 'cafe',
      max: 6, desc: '+5% velocidad de movimiento y -5% de cooldown.',
      apply(s, l) { s.moveSpeed *= (1 + 0.05 * l); s.cooldown *= (1 - 0.05 * l); },
    },
    subs: {
      name: 'Suscriptores', short: 'Subs+', icon: 'audiencia',
      max: 6, desc: '+1 proyectil extra (niveles 2, 4 y 6) y +4% área.',
      apply(s, l) { s.amount += (l >= 2 ? 1 : 0) + (l >= 4 ? 1 : 0) + (l >= 6 ? 1 : 0); s.area += 0.04 * l; },
    },
    comida: {
      name: 'Comida de Alejandro', short: 'Comida', icon: 'comida',
      max: 6, desc: '+0.4 regeneración y +25% imán por nivel.',
      apply(s, l) { s.regen += 0.4 * l; s.magnet *= (1 + 0.25 * l); },
    },
    flequillo: {
      name: 'Flequillo Estilizado', short: 'Flequillo', icon: 'flequillo',
      max: 6, desc: '+3% esquiva y +8% suerte por nivel.',
      apply(s, l) { s.dodge = Math.min(0.5, 0.03 * l); s.luck += 0.08 * l; },
    },
    llorona: {
      name: 'Llorona', short: 'Llorona', icon: 'llorona',
      max: 6, desc: 'Mientras te mueves dejas charquitos de lágrimas que dañan.',
      // el efecto lo resuelve weapons.js leyendo g.passives.llorona
      apply(s, l) { s.lagrimaLv = l; },
    },
    gravedad: {
      name: 'Cabeza Gravitatoria', short: 'Gravedad', icon: 'gravedad',
      max: 6, desc: '+20% de atracción de fichas por nivel. Tu cabeza pesa más.',
      apply(s, l) { s.magnet *= (1 + 0.20 * l); s.headScaleAdd += 0.04 * l; },
    },
    mochila: {
      name: 'Mochila de mamá', short: 'Mochila', icon: 'mochila',
      max: 6, desc: '+6% XP y +8% imán por nivel. Siempre trae táper.',
      apply(s, l) { s.xpMul = (s.xpMul || 1) * (1 + 0.06 * l); s.magnet *= (1 + 0.08 * l); },
    },
    hielo: {
      name: 'Cubito', short: 'Cubito', icon: 'hielo',
      max: 6, desc: '+6% de área y +10% de duración de charcos y fuego.',
      apply(s, l) { s.area += 0.06 * l; s.duration *= (1 + 0.10 * l); },
    },
    corazon: {
      name: 'Corazón de Mara', short: 'Corazón', icon: 'corazon',
      max: 6, desc: '+12 de vida y +0,15 de regeneración por nivel.',
      apply(s, l) { s.maxHP += 12 * l; s.regen += 0.15 * l; },
    },
  };

  const SLOTS = { weapon: 6, passive: 6 };

  function ckey(c) {
    if (!c || !c.kind) return '';
    if (c.kind === 'wnew' || c.kind === 'wup') return 'w:' + c.id;
    if (c.kind === 'pnew' || c.kind === 'pup') return 'p:' + c.id;
    return c.kind + ':' + (c.id || '');
  }

  // ---------------- SELECCIÓN DE NIVEL ----------------
  function bannedSet() { return new Set(); }

  function buildCandidates(banished) {
    const g = window.Game;
    const list = [];
    const hasW = g.weapons.length, hasP = Object.keys(g.passives).length;

    for (const id in WEAPONS) {
      if (banished.has('w:' + id)) continue;
      const unlocked = !WEAPONS[id].unlock || (UI.meta.unlocked && UI.meta.unlocked[WEAPONS[id].unlock]);
      const owned = g.weapons.find(w => w.id === id);
      if (owned) {
        if (owned.evolved) continue;
        if (owned.level < WEAPONS[id].max) list.push({ kind: 'wup', id, w: owned });
      } else if (hasW < SLOTS.weapon && unlocked) {
        list.push({ kind: 'wnew', id });
      }
    }
    for (const id in PASSIVES) {
      if (banished.has('p:' + id)) continue;
      const lvl = g.passives[id] || 0;
      if (lvl > 0) {
        if (lvl < PASSIVES[id].max) list.push({ kind: 'pup', id, lvl });
      } else if (hasP < SLOTS.passive) {
        list.push({ kind: 'pnew', id });
      }
    }
    return list;
  }

  function toOption(c) {
    if (c.kind === 'wnew' || c.kind === 'wup') {
      const w = WEAPONS[c.id];
      const lvl = c.kind === 'wnew' ? 0 : c.w.level;
      const g = window.Game;
      let evoHint = '';
      if (w.evo && PASSIVES[w.evo] && (lvl === w.max - 1 || (c.kind === 'wup' && c.w.level === w.max))) {
        // mostrar pista de evolución si tiene la catalizadora
        if ((g.passives[w.evo] || 0) >= 3 && c.kind === 'wup' && c.w.level >= w.max - 1 && c.w.level < w.max)
          evoHint = '⚡ ' + w.evoName + ' con ' + PASSIVES[w.evo].name + ' (abre cofre)';
        else if (c.kind === 'wup' && c.w.level === w.max - 1)
          evoHint = 'Pásala a Lv' + w.max + ' para poder evolucionar';
      }
      return {
        pick: c, icon: w.icon, name: w.name, isNew: c.kind === 'wnew', type: 'arma',
        level: lvl, max: w.max, desc: w.desc, evoHint,
      };
    } else {
      const p = PASSIVES[c.id];
      const lvl = c.kind === 'pnew' ? 0 : c.lvl;
      const catalyst = Object.keys(WEAPONS).filter(wid => WEAPONS[wid].evo === c.id && (window.Game.weapons.find(x => x.id === wid)));
      let evoHint = '';
      if (catalyst.length && lvl >= 3 && lvl < p.max)
        evoHint = '⚡ Cataliza: ' + catalyst.map(wid => WEAPONS[wid].evoName).join(', ');
      return {
        pick: c, icon: p.icon, name: p.name, isNew: c.kind === 'pnew', type: 'pasiva',
        level: lvl, max: p.max, desc: p.desc, evoHint,
      };
    }
  }

  function pick3(banished, excludeIds) {
    let cands = buildCandidates(banished).filter(c => !excludeIds || !excludeIds.has(ckey(c)));
    // barajar
    for (let i = cands.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [cands[i], cands[j]] = [cands[j], cands[i]];
    }
    // priorizar nuevas
    cands.sort((a, b) => (b.kind.includes('new') ? 1 : 0) - (a.kind.includes('new') ? 1 : 0));
    return cands.slice(0, 3).map(toOption);
  }

  function fallbackOptions() {
    return [
      { pick: { kind: 'bits' }, icon: 'bits', name: 'Bits de la comunidad', level: 0, desc: '+100 Bits para la tienda.', isNew: false },
      { pick: { kind: 'heal' }, icon: 'vida', name: 'Bocadillo', level: 0, desc: 'Recupera 40 de vida.', isNew: false },
    ];
  }

  // ---------------- APLICAR OPCIÓN ----------------
  function applyOption(opt) {
    const g = window.Game, c = opt.pick;
    if (c.kind === 'bits') { g.bonusBits += 100; return; }
    if (c.kind === 'heal') { g.player.hp = Math.min(g.player.stats.maxHP, g.player.hp + 40); return; }
    if (c.kind === 'wnew') {
      if (g.weapons.length < SLOTS.weapon) window.Weapons.grant(c.id);
    }
    else if (c.kind === 'wup') { c.w.level++; window.Weapons.onLevel(c.w); }
    else if (c.kind === 'pnew') {
      if (Object.keys(g.passives).length < SLOTS.passive) { g.passives[c.id] = 1; recompute(true); }
    }
    else if (c.kind === 'pup') { g.passives[c.id]++; recompute(true); }
  }

  // recalcula stats del jugador desde shop + pasivas
  function recompute(keepResources) {
    const g = window.Game;
    const prev = keepResources && g.player ? {
      rerolls: g.player.stats.rerolls,
      skips: g.player.stats.skips,
      banishes: g.player.stats.banishes,
    } : null;
    const s = baseStats();
    const shop = UI.meta.shop;
    s.might += 0.06 * (shop.dmg || 0);
    s.maxHP += 12 * (shop.hp || 0);
    s.magnet *= (1 + 0.25 * (shop.magnet || 0));
    s.luck += 0.08 * (shop.luck || 0);
    s.rerolls += (shop.reroll || 0);
    // mejoras permanentes nuevas
    s.armor += shop.armor || 0;
    s.regen += 0.15 * (shop.regen || 0);
    s.area *= (1 + 0.05 * (shop.area || 0));
    s.cooldown *= Math.max(0.5, 1 - 0.03 * (shop.cooldown || 0));
    s.xpMul *= (1 + 0.06 * (shop.growth || 0));
    for (const id in g.passives) {
      const lvl = g.passives[id];
      if (lvl > 0 && PASSIVES[id]) PASSIVES[id].apply(s, lvl);
    }
    // preserva vida proporcional
    const prevMax = g.player ? g.player.stats.maxHP : s.maxHP;
    g.player.stats = s;
    if (prev) {
      g.player.stats.rerolls = prev.rerolls;
      g.player.stats.skips = prev.skips;
      g.player.stats.banishes = prev.banishes;
    }
    if (g.player.hp >= prevMax - 0.01) g.player.hp = s.maxHP;
    // hp no debe superar el nuevo máximo
    if (g.player.hp > s.maxHP) g.player.hp = s.maxHP;
  }

  // ---------------- COFRE ----------------
  function chestOptions(count, banished) {
    const g = window.Game;
    const opts = [];
    // 1) evoluciones posibles primero
    for (const w of g.weapons) {
      if (w.evolved) continue;
      const def = WEAPONS[w.id];
      if (w.level >= def.max && (g.passives[def.evo] || 0) >= 3) {
        opts.push({
          pick: { kind: 'evolve', id: w.id }, icon: def.icon,
          name: def.evoName + ' ★', isNew: true, level: 0,
          desc: def.evoDesc, evolvedFrom: def.name,
        });
      }
    }
    // rellenar con mejoras normales, sin pasarse de slots
    const ownedW = new Set(g.weapons.map(w => w.id));
    let nW = g.weapons.length;
    let nP = Object.keys(g.passives).length;
    let guard = 0;
    while (opts.length < count && guard++ < 60) {
      const pool = pick3(banished, new Set(opts.map(o => ckey(o.pick)))).filter(o => {
        if (o.pick.kind === 'wnew') return nW < SLOTS.weapon && !ownedW.has(o.pick.id);
        if (o.pick.kind === 'pnew') return nP < SLOTS.passive;
        return true;
      });
      if (!pool.length) break;
      const o = pool[0];
      opts.push(o);
      if (o.pick.kind === 'wnew') { nW++; ownedW.add(o.pick.id); }
      else if (o.pick.kind === 'pnew') nP++;
    }
    // si ya no quedan mejoras, el cofre siempre da algo
    while (opts.length < count) {
      const fb = fallbackOptions();
      opts.push(fb[opts.length % fb.length]);
    }
    return opts.slice(0, count);
  }

  function applyChest(opt) {
    const g = window.Game, c = opt.pick;
    if (c.kind === 'evolve') {
      const w = g.weapons.find(x => x.id === c.id);
      if (w) { w.evolved = true; w.level = WEAPONS[w.id].max; window.Weapons.onLevel(w); }
      return;
    }
    applyOption(opt);
  }

  return {
    baseStats, WEAPONS, PASSIVES, SLOTS, ckey,
    pick3, fallbackOptions, applyOption, applyChest, chestOptions, recompute, toOption,
  };
})();
