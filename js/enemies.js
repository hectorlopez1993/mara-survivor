// ============================================================
// enemies.js — tipos, IA, oleadas por minuto, bosses, proyectiles
// ============================================================
window.Enemies = (function () {

  const TYPES = {
    form:      { hp: 9,   speed: 32, dmg: 6,  r: 7,  xp: 1,  spr: 'form',      w: 14, h: 14 },
    contrato:  { hp: 7,   speed: 58, dmg: 5,  r: 7,  xp: 1,  spr: 'contrato',  w: 16, h: 16 },
    cv:        { hp: 22,  speed: 40, dmg: 9,  r: 8,  xp: 2,  spr: 'cv',        w: 16, h: 14 },
    email:     { hp: 16,  speed: 30, dmg: 6,  r: 8,  xp: 2,  spr: 'email',     w: 16, h: 12, ranged: true, range: 150, cd: 2.4 },
    empresa:   { hp: 90,  speed: 24, dmg: 16, r: 13, xp: 7,  spr: 'empresa',   w: 20, h: 21, tank: true },
    practicas: { hp: 70,  speed: 78, dmg: 12, r: 8,  xp: 12, spr: 'practicas', w: 16, h: 17, elite: true },
    picao:     { hp: 380, speed: 30, dmg: 22, r: 17, xp: 45, spr: 'picao',     w: 22, h: 27, boss: true },
    manifestante:{ hp: 48, speed: 46, dmg: 12, r: 10, xp: 6, spr: 'manifestante', w: 19, h: 21 },
    burocracia:{ hp: 1800,speed: 22, dmg: 32, r: 21, xp: 120,spr: 'burocracia',w: 25, h: 23, boss: true },
    // --- desbloqueados por nivel de directo ---
    hater:     { hp: 30,  speed: 50, dmg: 8,  r: 8,  xp: 3,  spr: 'hater',     w: 16, h: 16, ranged: true, range: 130, cd: 2.0, proj: 'dislike', tier: 1, minMinute: 2 },
    reclutador:{ hp: 130, speed: 34, dmg: 18, r: 11, xp: 10, spr: 'reclutador',w: 18, h: 22, charge: true, tier: 2, minMinute: 3 },
    influencer:{ hp: 65,  speed: 60, dmg: 10, r: 9,  xp: 8,  spr: 'influencer',w: 16, h: 20, aura: true, tier: 3, minMinute: 4 },
    pelirroja: { hp: 3000,speed: 27, dmg: 40, r: 20, xp: 200,spr: 'pelirroja', w: 26, h: 28, boss: true, finalBoss: true, tier: 2 },
  };

  // Enemigos que se estrenan al subir de nivel de directo.
  const UNLOCKS = ['hater', 'reclutador', 'influencer'];

  // composición de oleadas por minuto (como VS: cambia cada minuto)
  const WAVES = [
    { form: 100 },                                              // 0
    { form: 80, contrato: 20 },                                 // 1
    { form: 55, contrato: 35, cv: 10 },                         // 2
    { form: 40, contrato: 35, cv: 15, email: 10, manifestante: 8 },              // 3
    { contrato: 35, cv: 25, email: 15, form: 25, manifestante: 12 },             // 4
    { contrato: 30, cv: 25, email: 20, empresa: 8, form: 17, manifestante: 14 }, // 5
    { cv: 28, email: 24, empresa: 14, contrato: 24, form: 10, manifestante: 15 },// 6+
    { email: 25, empresa: 20, cv: 25, contrato: 25, form: 5, manifestante: 15 },
    { empresa: 28, email: 25, cv: 25, contrato: 22, manifestante: 18 },
  ];

  let eproj = [];   // proyectiles enemigos
  let spawnT = 0, eliteT = 0, bossMinDone = new Set(), finalSpawned = false;
  let lastMin = 0, picaoTauntI = 0, pelirrojaTauntI = 0;

  // La Pelirroja: homenaje/parodia de una streamer pelirroja. Solo
  // coletillas públicas de directo, sin polémicas.
  const PELIRROJA_TAUNTS = [
    '"NO ME VAN A MATAR, SOY MUY BUENA EN ESTO."',
    '"¿QUÉ COJONES ES ESTO?"',
    '"ME GUSTA HACER STREAM Y TROLLEAR AL CHAT."',
    '"SOY STREAMER, NO ME DEDICO A TIKTOK."',
    '"ASDKJSDAJKLSDAJKLDSA."',
    '"LA VIDA EL LOL."',
    '"SEPE, PÍDEME PERDÓN."',
    '"ESTO NO ES UN BAIT, ES CONTENIDO."',
  ];

  // El PICAO: el pesado del chat que no acepta un no. Ataca con su peor
  // arma, el mensaje privado insistente.
  const PICAO_TAUNTS = [
    '"TE DONÉ 1000€. HAZME CASO."',
    '"QUÍTAME LA DENUNCIA, VA."',
    '"¿DÓNDE VIVES? ES PARA UN REGALO."',
    '"NO ES ACOSO, ES INSISTENCIA."',
    '"TENGO 12 CUENTAS MÁS."',
    '"RESPÓNDEME AL DM. POR FAVOR."',
    '"TE HE VISTO EN EL DIRECTO."',
    '"ME DEBES UNA EXPLICACIÓN."',
    '"ESTOY EN EL PARKING. SAL."',
    '"NO ME IGNORES, QUE ME PONGO TRISTE."',
  ];

  // hitos por minuto (sin minutos de boss: 3, 6, 9, 12)
  const MINUTE_LINES = {
    1: 'MINUTO 1: nadie ha mirado tu LinkedIn. Todavía.',
    2: 'MINUTO 2: cero notificaciones de entrevista.',
    4: 'MINUTO 4: RRHH ya sabe dónde vives.',
    5: '¡A LA MITAD! Aguanta sin enviar el CV.',
    7: 'MINUTO 7: si pierdes, entrevista mañana a las 9.',
    8: 'MINUTO 8: la empresa familiar te ha visto el perfil.',
    10: '¡MINUTO 10! Quedan 5 minutos de libertad.',
    11: 'MINUTO 11: se oye el timbre de la oficina...',
    13: 'MINUTO 13: te escriben "tenemos una vacante". CORRE.',
    14: '¡ÚLTIMO MINUTO! ¡NO MANDES NADA!',
  };

  function reset() {
    eproj = []; spawnT = 1.5; eliteT = 120; bossMinDone = new Set(); finalSpawned = false;
    lastMin = 0; picaoTauntI = 0; pelirrojaTauntI = 0;
  }

  function tier() {
    return window.UI ? UI.tierIndex() : 0;
  }

  function waveComp(minute, t) {
    const lvl = t === undefined ? tier() : Math.max(0, t | 0);
    const base = WAVES[Math.min(minute, WAVES.length - 1)];
    const comp = {};
    for (const k in base) comp[k] = base[k];
    // los enemigos del directo se mezclan con peso creciente
    for (const id of UNLOCKS) {
      const d = TYPES[id];
      if (lvl < d.tier || minute < d.minMinute) continue;
      const weight = (d.boss ? 4 : 10) + (lvl - d.tier) * 3;
      comp[id] = (comp[id] || 0) + weight;
    }
    return comp;
  }

  function bossFor(t) {
    const lvl = t === undefined ? tier() : Math.max(0, t | 0);
    return lvl >= 2 ? 'pelirroja' : 'burocracia';
  }

  function pickType(comp) {
    let total = 0;
    for (const k in comp) total += comp[k];
    let r = Math.random() * total;
    for (const k in comp) { r -= comp[k]; if (r <= 0) return k; }
    return 'form';
  }

  function spawnPos(g) {
    const a = Math.random() * Math.PI * 2;
    const dx = Math.cos(a), dy = Math.sin(a);
    const needX = Math.abs(dx) > 0.001 ? 350 / Math.abs(dx) : 0;
    const needY = Math.abs(dy) > 0.001 ? 210 / Math.abs(dy) : 0;
    const d = Math.max(260, needX, needY) + Math.random() * 40;
    return { x: g.player.x + dx * d, y: g.player.y + dy * d };
  }

  function create(g, type, x, y) {
    const t = TYPES[type];
    const minute = g.time / 60;
    const tm = window.UI ? UI.tierMults() : { hp: 1, speed: 1, dmg: 1 };
    let hp = t.hp * (1 + minute * 0.34) * tm.hp;          // escalado con el tiempo y el directo
    if (t.boss) hp = t.hp * (1 + minute * 0.18) * tm.hp;
    const e = {
      type, x, y, hp, maxHp: hp,
      speed: t.speed * (1 + minute * 0.012) * tm.speed,
      dmg: t.dmg * (1 + minute * 0.05) * tm.dmg,
      r: t.r, t, flash: 0, slow: 0,
      kb: { x: 0, y: 0 },
      shootT: (t.cd || 2) * Math.random(),
      atkT: 2.5,
      pending: null,
      phase: Math.random() * Math.PI * 2,
      flip: false,
      haste: 0,                // aura de la influencer
      chargeT: 2 + Math.random() * 2,
      dashT: 0,
      dashX: 0, dashY: 0,
      final: false,
      atkI: 0,
    };
    g.enemies.push(e);
    return e;
  }

  function spawnWaveBurst(g) {
    const minute = Math.floor(g.time / 60);
    const comp = waveComp(minute);
    const tm = window.UI ? UI.tierMults() : { count: 0, maxAlive: 230 };
    const n = 3 + Math.min(10, Math.floor(minute * 1.1)) + (Math.random() < 0.4 ? 2 : 0) + Math.floor(tm.count);
    const maxAlive = tm.maxAlive || 230;
    for (let i = 0; i < n; i++) {
      if (g.enemies.length >= maxAlive) break;
      const type = pickType(comp);
      const p = spawnPos(g);
      create(g, type, p.x, p.y);
    }
  }

  // ---------- director ----------
  function director(dt, g) {
    const minute = Math.floor(g.time / 60);

    // hito narrativo al pasar de minuto
    if (minute > lastMin) {
      lastMin = minute;
      const line = MINUTE_LINES[minute];
      if (line) {
        if (minute === 5 || minute === 10 || minute === 14) UI.announce(line, minute === 14);
        else UI.subtitle(line);
      }
    }

    // spawns continuos cada pocos segundos
    spawnT -= dt;
    if (spawnT <= 0) {
      const tm = window.UI ? UI.tierMults() : { spawn: 1 };
      spawnT = Math.max(0.35, (1.6 - minute * 0.09) / tm.spawn);
      spawnWaveBurst(g);
    }

    // élites cada 2 minutos (dan cofre al morir)
    eliteT -= dt;
    if (eliteT <= 0) {
      eliteT = 95;
      const n = 1 + Math.floor(minute / 4);
      for (let i = 0; i < n; i++) {
        const p = spawnPos(g);
        create(g, 'practicas', p.x, p.y);
      }
      UI.subtitle('⚠ Prácticas no remuneradas: ¡vienen a por ti!');
    }

    // bosses de mitad (solo uno vivo a la vez)
    for (const m of [3, 6, 9, 12]) {
      if (minute >= m && !bossMinDone.has(m) && g.time < 15 * 60 - 1) {
        bossMinDone.add(m);
        // a partir del directo #2 la Burocracia adelanta su cita al minuto 12
        const midType = (m === 12 && bossFor() === 'pelirroja') ? 'burocracia' : 'picao';
        if (g.enemies.some(x => x.type === midType && x.hp > 0)) {
          UI.subtitle(midType === 'picao'
            ? 'El Picao sigue en pie: no piensa quitarse de tu chat.'
            : 'La Burocracia sigue tramitando: no piensa irse.');
          continue;
        }
        const p = spawnPos(g);
        const b = create(g, midType, p.x, p.y);
        b.hp *= 1 + (m / 6); b.maxHp = b.hp;
        AudioFX.boss();
        if (midType === 'picao') {
          UI.announce('¡EL PICAO!', true);
          UI.subtitle('"Te doné 1000€, hazme caso." — El Picao');
        } else {
          UI.announce('¡LA BUROCRACIA!', true);
          UI.subtitle('47 formularios y todos piden experiencia.');
        }
      }
    }

    // boss final a los 15:00
    if (g.time >= 15 * 60 && !finalSpawned) {
      finalSpawned = true;
      // los picaos huyen para dejar sitio al jefe final
      for (let i = g.enemies.length - 1; i >= 0; i--) {
        if (g.enemies[i].type === 'picao') g.enemies.splice(i, 1);
      }
      const p = spawnPos(g);
      const who = bossFor();
      const b = create(g, who, p.x, p.y);
      b.final = true;
      AudioFX.boss();
      if (who === 'pelirroja') {
        UI.announce('¡LA PELIRROJA!', true);
        UI.subtitle('"NO ME VAN A MATAR, SOY MUY BUENA EN ESTO."');
      } else {
        UI.announce('¡LA BUROCRACIA SUPREMA!', true);
        UI.subtitle('El jefe final: 47 formularios... ¡y todos piden experiencia!');
      }
    }
  }

  // ---------- update ----------
  function update(dt, g) {
    const p = g.player;
    const minute = g.time / 60;

    for (let i = g.enemies.length - 1; i >= 0; i--) {
      const e = g.enemies[i];
      if (e.flash > 0) e.flash -= dt;
      if (e.slow > 0) e.slow -= dt;
      if (e.haste > 0) e.haste -= dt;

      // knockback
      if (e.kb.x || e.kb.y) {
        e.x += e.kb.x * dt; e.y += e.kb.y * dt;
        e.kb.x *= Math.pow(0.02, dt); e.kb.y *= Math.pow(0.02, dt);
        if (Math.abs(e.kb.x) < 4) e.kb.x = 0;
        if (Math.abs(e.kb.y) < 4) e.kb.y = 0;
      }

      const dx = p.x - e.x, dy = p.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const slowK = e.slow > 0 ? 0.45 : 1;
      const hasteK = e.haste > 0 ? 1.3 : 1;
      const sp = e.speed * slowK * hasteK;

      if (e.t.ranged) {
        // mantiene distancia y dispara
        if (dx < 0) e.flip = true; else if (dx > 0) e.flip = false;
        const want = e.t.range;
        let mvx = 0, mvy = 0;
        if (dist > want + 20) { mvx = dx / dist; mvy = dy / dist; }
        else if (dist < want - 30) { mvx = -dx / dist; mvy = -dy / dist; }
        e.x += mvx * sp * dt; e.y += mvy * sp * dt;
        e.shootT -= dt;
        if (e.shootT <= 0 && dist < want + 80) {
          e.shootT = (e.t.cd || 2.4) / (1 + minute * 0.02);
          const a = Math.atan2(dy, dx);
          eproj.push({
            x: e.x, y: e.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120,
            dmg: e.dmg * 0.8, life: 3.2, kind: e.t.proj || 'oferta',
          });
          AudioFX.shoot();
        }
      } else if (e.t.aura) {
        // la influencer huye si te acercas y acelera a los suyos
        if (dx < 0) e.flip = true; else if (dx > 0) e.flip = false;
        const away = dist < 96;
        e.x += (away ? -dx / dist : dx / dist) * sp * dt;
        e.y += (away ? -dy / dist : dy / dist) * sp * dt;
        for (const o of g.enemies) {
          if (o === e) continue;
          const ox = o.x - e.x, oy = o.y - e.y;
          if (ox * ox + oy * oy < 96 * 96) o.haste = 0.25;
        }
      } else if (e.t.charge) {
        // el reclutador embiste en línea recta cada 3,5 s
        if (dx < 0) e.flip = true; else if (dx > 0) e.flip = false;
        if (e.dashT > 0) {
          e.dashT -= dt;
          e.x += e.dashX * 240 * slowK * dt;
          e.y += e.dashY * 240 * slowK * dt;
        } else {
          e.x += dx / dist * sp * dt;
          e.y += dy / dist * sp * dt;
          e.chargeT -= dt;
          if (e.chargeT <= 0 && dist < 280) {
            e.chargeT = 3.5;
            e.dashT = 0.35;
            e.dashX = dx / dist;
            e.dashY = dy / dist;
            AudioFX.scream();
          }
        }
      } else {
        // persecución directa
        e.x += dx / dist * sp * dt;
        e.y += dy / dist * sp * dt;
        if (dx < 0) e.flip = true; else if (dx > 0) e.flip = false;
      }

      // ataques de boss con telegrafía
      if (e.pending) {
        e.pending.t -= dt;
        if (e.pending.t <= 0) resolveBossAttack(g, e);
      }
      if (e.t.boss) {
        e.atkT -= dt;
        if (e.atkT <= 0 && !e.pending) {
          if (e.type === 'picao') {
            e.atkT = 4;
            e.pending = { kind: 'wave', t: 0.45 };
          } else if (e.type === 'pelirroja') {
            // alterna likes, bait e invocación de haters
            const kinds = ['likes', 'bait', 'summon'];
            const kind = kinds[(e.atkI++ || 0) % kinds.length];
            e.atkT = kind === 'summon' ? 4.5 : 3.2;
            e.pending = { kind, t: 0.6 };
          } else {
            e.atkT = 3;
            e.pending = { kind: 'burst', t: 0.6 };
          }
          AudioFX.scream();
        }
      }

      // contacto con el jugador
      if (dist < e.r + p.r) {
        if (p.invuln <= 0) {
          g.hurtPlayer(e.dmg);
          p.x += dx / dist * 6;
          p.y += dy / dist * 6;
        }
        // empuja al enemigo un poco
        e.x -= dx / dist * 10; e.y -= dy / dist * 10;
      }

      // limpiar muy lejanos (rendimiento)
      if (dist > 900 && !e.t.boss) g.enemies.splice(i, 1);
    }

    // proyectiles enemigos
    for (let i = eproj.length - 1; i >= 0; i--) {
      const pr = eproj[i];
      pr.life -= dt;
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      const dx = p.x - pr.x, dy = p.y - pr.y;
      if (dx * dx + dy * dy < (p.r + 4) * (p.r + 4)) {
        g.hurtPlayer(pr.dmg);
        eproj.splice(i, 1);
        continue;
      }
      if (pr.life <= 0) eproj.splice(i, 1);
    }
  }

  function bossWave(g, e, range, dmg, color) {
    // daña y empuja a quien esté cerca
    const p = g.player;
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d < range + p.r) g.hurtPlayer(dmg);
    AudioFX.explode();
    g.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 8, max: range, t: 0.4, color });
  }

  function resolveBossAttack(g, e) {
    const kind = e.pending ? e.pending.kind : null;
    e.pending = null;
    if (kind === 'wave') {
      bossWave(g, e, 70, e.dmg * 0.7, '#ff5f7e');
      UI.subtitle(PICAO_TAUNTS[picaoTauntI++ % PICAO_TAUNTS.length]);
    } else if (kind === 'burst') {
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        eproj.push({
          x: e.x, y: e.y, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110,
          dmg: e.dmg * 0.5, life: 4, kind: 'oferta',
        });
      }
      for (let k = 0; k < 4; k++) {
        const a = Math.random() * Math.PI * 2;
        create(g, 'form', e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40);
      }
      AudioFX.explode();
      g.shake = Math.max(g.shake, 6);
    } else if (kind === 'likes') {
      // ráfaga de corazones en abanico hacia el jugador
      const base = Math.atan2(g.player.y - e.y, g.player.x - e.x);
      for (let k = -2; k <= 2; k++) {
        const a = base + k * 0.22;
        eproj.push({
          x: e.x, y: e.y, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130,
          dmg: e.dmg * 0.45, life: 4, kind: 'like',
        });
      }
      UI.subtitle(PELIRROJA_TAUNTS[pelirrojaTauntI++ % PELIRROJA_TAUNTS.length]);
      AudioFX.shoot();
    } else if (kind === 'bait') {
      // bait que explota a su alrededor
      bossWave(g, e, 84, e.dmg * 0.8, '#ff4d6d');
      g.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 10, max: 84, t: 0.5, color: '#ffd24a' });
      UI.subtitle('"ESTO NO ES UN BAIT, ES CONTENIDO."');
      g.shake = Math.max(g.shake, 5);
    } else if (kind === 'summon') {
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + 0.4;
        create(g, 'hater', e.x + Math.cos(a) * 46, e.y + Math.sin(a) * 46);
      }
      UI.subtitle('"ME GUSTA HACER STREAM Y TROLLEAR AL CHAT."');
      AudioFX.explode();
    }
  }

  // ---------- draw ----------
  function draw(ctx, g) {
    for (const e of g.enemies) {
      const spr = Sprites.get(e.t.spr);
      const bob = Math.sin(g.time * 6 + e.phase) * 1.5;
      const sx = e.x - spr.width / 2;
      const sy = e.y - spr.height / 2 + bob + (e.t.boss ? 6 : 2);

      ctx.drawImage(Sprites.shadowEl(), e.x - 12, e.y + e.r - 2, 24, 10);

      const fspr = e.flash > 0 ? (Sprites.flash(e.t.spr) || spr) : null;
      drawFlipped(ctx, fspr || spr, sx, sy, e.flip);

      // aviso de ataque inminente
      if (e.pending) {
        const k = Math.max(0, Math.min(1, e.pending.t / 0.6));
        ctx.save();
        ctx.globalAlpha = 0.35 + (1 - k) * 0.45;
        ctx.strokeStyle = '#ff3355';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.pending.kind === 'wave' ? 70 : 54, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (e.t.ranged && e.shootT < 0.35) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#ffe45e';
        ctx.fillRect(e.x - 2, sy - 4, 4, 4);
        ctx.restore();
      }

      if (e.slow > 0) {
        ctx.fillStyle = 'rgba(90,200,255,0.75)';
        ctx.fillRect(e.x - 1, e.y - e.r - 6, 2, 2);
      }

      // barras de vida de élites/bosses
      if (e.t.elite || e.t.boss) {
        const w = e.t.boss ? 44 : 22;
        const hpr = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = '#14141a';
        ctx.fillRect(e.x - w / 2 - 1, sy - 7, w + 2, 4);
        ctx.fillStyle = e.t.boss ? '#ff3355' : '#ffd24a';
        ctx.fillRect(e.x - w / 2, sy - 6, w * hpr, 2);
      }
    }

    // proyectiles enemigos
    for (const pr of eproj) {
      const img = Sprites.get(pr.kind === 'dislike' ? 'dislike' : pr.kind === 'like' ? 'like' : 'oferta');
      ctx.save();
      ctx.translate(pr.x, pr.y);
      if (pr.kind === 'oferta') ctx.rotate(Math.atan2(pr.vy, pr.vx));
      else {
        const wob = Math.sin(g.time * 9 + pr.x * 0.1) * 0.25;
        ctx.rotate(wob);
      }
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    }
  }

  function drawFlipped(ctx, spr, x, y, flip) {
    if (flip) {
      ctx.save();
      ctx.translate(x + spr.width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(spr, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(spr, x, y);
    }
  }

  return { TYPES, reset, director, update, draw, create, eproj: () => eproj, waveComp, bossFor };
})();
