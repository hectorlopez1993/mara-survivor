// ============================================================
// weapons.js — 7 armas auto + proyectiles + zonas + companion
// ============================================================
window.Weapons = (function () {

  let projectiles = []; // {x,y,vx,vy,dmg,life,homing,pierce,kind,splash,scale}
  let zones = [];       // charcos/auras {x,y,r,dmg,t,tick,kind,slow}
  let flashes = [];     // destellos {x,y,angle,arc,range,t}
  let waves = [];       // grito {x,y,r,max,dmg,t,applied:Set,evolved}
  let orbitAng = 0;
  let alex = null;      // companion {x,y,t}
  let alexOn = false, alexT = 0; // invocación temporal

  // rejilla espacial para búsquedas de enemigo cercano (evita O(P*E))
  const GRID = 64;
  let grid = new Map();
  function rebuildGrid(g) {
    grid.clear();
    for (const e of g.enemies) {
      if (e.hp <= 0) continue;
      const key = Math.floor(e.x / GRID) + ',' + Math.floor(e.y / GRID);
      let cell = grid.get(key);
      if (!cell) { cell = []; grid.set(key, cell); }
      cell.push(e);
    }
  }

  function reset() {
    projectiles = []; zones = []; flashes = []; waves = [];
    orbitAng = 0; alex = null;
    alexOn = false; alexT = 0;
  }

  function grant(id) {
    const g = window.Game;
    if (g.weapons.find(w => w.id === id)) return;
    if (g.weapons.length >= window.Upgrades.SLOTS.weapon) return;
    g.weapons.push({ id, level: 1, evolved: false, t: 0.3 });
    UI.updateSlots(g.slotList());
  }

  function onLevel(w) {
    w.t = Math.min(w.t, 0.25); // reactiva pronto
    const g = window.Game;
    UI.updateSlots(g.slotList());
  }

  function def(id) { return window.Upgrades.WEAPONS[id]; }

  function lv(w, arr) { return arr[Math.min(w.level, arr.length) - 1]; }

  // ---------- helpers ----------
  function aimDir(g) {
    const p = g.player;
    // auto-apunte suave al enemigo más cercano
    const best = nearest(g, p.x, p.y, 220);
    if (best) {
      const dx = best.x - p.x, dy = best.y - p.y;
      const l = Math.sqrt(dx * dx + dy * dy) || 1;
      return { x: dx / l, y: dy / l };
    }
    return p.facing;
  }

  function nearest(g, x, y, maxD) {
    const md = Math.min(maxD || 320, 512);
    const r2 = md * md;
    const cx0 = Math.floor((x - md) / GRID), cx1 = Math.floor((x + md) / GRID);
    const cy0 = Math.floor((y - md) / GRID), cy1 = Math.floor((y + md) / GRID);
    let best = null, bd = r2;
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const cell = grid.get(cx + ',' + cy);
        if (!cell) continue;
        for (const e of cell) {
          const dx = e.x - x, dy = e.y - y;
          const d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = e; }
        }
      }
    }
    return best;
  }

  // ---------- disparos ----------
  function fire(w, g) {
    const S = g.player.stats;
    const d = def(w.id);
    const lvl = w.level;
    const ev = w.evolved;

    switch (w.id) {

      case 'polaroid': {
        const dmg = lv(w, ev ? [34] : [12, 16, 21, 27, 34]) * S.might;
        const range = (ev ? 118 : lv(w, [84, 92, 100, 108, 118])) * S.area;
        const arc = ev ? Math.PI * 2 : lv(w, [1.35, 1.45, 1.55, 1.7, 1.9]);
        const cd = (ev ? 1.15 : lv(w, [1.6, 1.5, 1.4, 1.3, 1.15])) * S.cooldown;
        const a = aimDir(g);
        const baseAng = Math.atan2(a.y, a.x);
        const shots = 1 + S.amount;
        for (let s = 0; s < shots; s++) {
          const ang = ev ? (Math.random() * Math.PI * 2) : baseAng + (s - (shots - 1) / 2) * 0.7;
          if (flashes.length < 60) flashes.push({ x: g.player.x, y: g.player.y, angle: ang, arc: ev ? Math.PI * 2 : arc, range, t: 0.22, max: 0.22 });
          hitCone(g, g.player.x, g.player.y, ang, ev ? Math.PI * 2 : arc, range, dmg, 6);
        }
        AudioFX.flash();
        w.t = cd;
        break;
      }

      case 'caca': {
        const dmg = lv(w, ev ? [16] : [9, 12, 16, 21, 27]) * S.might;
        const speed = lv(w, [130, 140, 150, 160, 175]);
        const splash = (ev ? 44 : lv(w, [26, 29, 33, 37, 42])) * S.area;
        const n = 1 + Math.floor(lvl / 2) + S.amount;
        const a = aimDir(g);
        const baseAng = Math.atan2(a.y, a.x);
        for (let i = 0; i < n; i++) {
          if (projectiles.length >= 400) break;
          const ang = baseAng + (Math.random() - 0.5) * 1.6;
          projectiles.push({
            x: g.player.x, y: g.player.y - 6,
            vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
            dmg, life: 0.9, kind: 'caca', splash, scale: S.area,
          });
        }
        AudioFX.poop();
        w.t = (ev ? 1.5 : lv(w, [1.9, 1.8, 1.7, 1.6, 1.5])) * S.cooldown;
        break;
      }

      case 'sub': {
        // el daño del orbital se aplica en updateOrbit
        w._dmg = lv(w, ev ? [16] : [10, 13, 17, 22, 28]) * S.might;
        w._radius = (ev ? 58 : lv(w, [46, 50, 54, 58, 64])) * S.area;
        w._count = lv(w, [2, 2, 3, 3, 4]) + S.amount;
        w._cd = (ev ? 0.45 : 0.6) * S.cooldown;
        break;
      }

      case 'cafe': {
        w._dmg = lv(w, ev ? [9] : [5, 7, 9, 12, 15]) * S.might;
        w._radius = (ev ? 78 : lv(w, [44, 50, 56, 63, 70])) * S.area;
        w.t = 0.3 * S.cooldown;
        // daño por tick
        const r = w._radius;
        for (let j = g.enemies.length - 1; j >= 0; j--) {
          const e = g.enemies[j];
          const dx = e.x - g.player.x, dy = e.y - g.player.y;
          if (dx * dx + dy * dy < r * r) {
            g.damageEnemy(e, w._dmg, { slow: ev ? 1.6 : 0 });
          }
        }
        break;
      }

      case 'chat': {
        const dmg = lv(w, ev ? [12] : [7, 9, 12, 15, 19]) * S.might;
        const speed = ev ? 260 : lv(w, [210, 220, 230, 245, 260]);
        const count = lv(w, [3, 4, 5, 6, 7]) + S.amount;
        const cd = (ev ? 1.05 : lv(w, [1.5, 1.4, 1.3, 1.2, 1.1])) * S.cooldown;
        const a = aimDir(g);
        const baseAng = Math.atan2(a.y, a.x);
        for (let i = 0; i < count; i++) {
          if (projectiles.length >= 400) break;
          const ang = baseAng + (i - (count - 1) / 2) * 0.32 + (Math.random() - 0.5) * 0.1;
          projectiles.push({
            x: g.player.x, y: g.player.y - 4,
            vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
            dmg, life: 1.4, kind: 'chat',
            homing: 3.2, pierce: ev ? 99 : 0, scale: S.area,
            emote: Emotes.pick(),
          });
        }
        AudioFX.shoot();
        w.t = cd;
        break;
      }

      case 'alejandro': {
        if (!alexOn || !alex) { w.t = 0.4; break; } // fuera del ciclo temporal
        const dmg = lv(w, ev ? [17] : [11, 14, 18, 23, 29]) * S.might;
        const speed = ev ? 190 : lv(w, [165, 172, 180, 188, 196]);
        const cd = (ev ? 1.1 : lv(w, [1.8, 1.7, 1.6, 1.5, 1.4])) * S.cooldown;
        const n = (ev ? 2 : 1) + Math.floor(S.amount / 2);
        const tgt = nearest(g, alex.x, alex.y, 320);
        if (tgt) {
          for (let i = 0; i < n; i++) {
            const dx = tgt.x - alex.x + (i - (n - 1) / 2) * 14, dy = tgt.y - alex.y;
            const l = Math.sqrt(dx * dx + dy * dy) || 1;
            projectiles.push({
              x: alex.x, y: alex.y - 6,
              vx: dx / l * speed, vy: dy / l * speed,
              dmg, life: 2.2, kind: 'comida',
              homing: ev ? 7 : 4.5, pierce: 0, scale: S.area,
            });
          }
          AudioFX.shoot();
        }
        w.t = cd;
        break;
      }

      case 'grito': {
        const dmg = lv(w, ev ? [28] : [14, 18, 23, 29, 36]) * S.might;
        const range = (ev ? 105 : lv(w, [70, 77, 85, 94, 104])) * S.area;
        const cd = (ev ? 2.4 : lv(w, [3.2, 3.0, 2.8, 2.6, 2.4])) * S.cooldown;
        waves.push({
          x: g.player.x, y: g.player.y, r: 8, max: range,
          dmg, t: 0, life: range / 240, applied: new Set(), ev,
          kb: ev ? 260 : 170,
        });
        AudioFX.scream();
        w.t = cd;
        break;
      }

      case 'pedo': {
        const dmg = lv(w, [7, 9, 12, 15, 19]) * S.might;
        const r = lv(w, [22, 25, 28, 32, 36]) * S.area;
        const cd = lv(w, [2.4, 2.2, 2.0, 1.8, 1.6]) * S.cooldown;
        const a = aimDir(g);
        if (zones.length < 120) zones.push({
          x: g.player.x + a.x * 26, y: g.player.y + a.y * 16 + 4,
          r, dmg, t: 1.7, tick: 0.3, kind: 'nube', kb: 130,
        });
        AudioFX.poop();
        w.t = cd;
        break;
      }
    }
  }

  function hitCone(g, x, y, ang, arc, range, dmg, kb) {
    for (let i = g.enemies.length - 1; i >= 0; i--) {
      const e = g.enemies[i];
      if (!e || e.hp <= 0) continue;
      const dx = e.x - x, dy = e.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > range + e.r) continue;
      let da = Math.atan2(dy, dx) - ang;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      if (Math.abs(da) <= arc / 2 + 0.15) {
        g.damageEnemy(e, dmg, { kb, kx: dx / (dist || 1), ky: dy / (dist || 1) });
      }
    }
    g.damageObstaclesAt(x, y, range * 0.6, dmg);
  }

  // ---------- update ----------
  function update(dt, g) {
    const S = g.player.stats;
    rebuildGrid(g);

    // Alejandro: invocación temporal (3.5s presente / 14s fuera)
    if (g.weapons.find((w) => w.id === 'alejandro')) {
      alexT -= dt;
      if (alexT <= 0) {
        alexOn = !alexOn;
        alexT = alexOn ? 3.5 : 14;
        if (alexOn) {
          alex = { x: g.player.x - 18, y: g.player.y + 4, t: 0.5 };
          AudioFX.toast();
        } else {
          alex = null;
        }
      }
    } else if (alex) {
      alexOn = false; alex = null; alexT = 0;
    }

    // destellos (vida)
    for (let i = flashes.length - 1; i >= 0; i--) {
      flashes[i].t -= dt;
      if (flashes[i].t <= 0) flashes.splice(i, 1);
    }

    // armas
    for (const w of g.weapons) {
      if (w.id === 'sub' || w.id === 'cafe') {
        if (w.id === 'cafe') {
          w.t -= dt;
          if (w.t <= 0) fire(w, g);
        } else {
          // refresca stats periódicamente (los niveles de Sub ya cuentan)
          w.t -= dt;
          if (!w._dmg || w.t <= 0) { fire(w, g); w.t = w._cd || 0.5; }
          updateOrbit(dt, w, g);
        }
        continue;
      }
      w.t -= dt;
      if (w.t <= 0) fire(w, g);
    }

    // proyectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.life -= dt;
      if (p.homing) {
        const t = nearest(g, p.x, p.y, 300);
        if (t) {
          const dx = t.x - p.x, dy = t.y - p.y;
          const l = Math.sqrt(dx * dx + dy * dy) || 1;
          const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const tx = dx / l * sp, ty = dy / l * sp;
          const k = Math.min(1, p.homing * dt);
          p.vx += (tx - p.vx) * k;
          p.vy += (ty - p.vy) * k;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      let dead = p.life <= 0;
      if (!dead) {
        for (let j = g.enemies.length - 1; j >= 0; j--) {
          const e = g.enemies[j];
          if (!e || e.hp <= 0) continue;
          const dx = e.x - p.x, dy = e.y - p.y;
          if (dx * dx + dy * dy < (e.r + 5) * (e.r + 5)) {
            g.damageEnemy(e, p.dmg, {});
            if (p.kind === 'caca') {
              zones.push({
                x: p.x, y: p.y, r: p.splash, dmg: p.dmg * 0.45,
                t: 1.6, tick: 0.35, kind: 'charco',
              });
            }
            if (p.pierce > 0) p.pierce--;
            else dead = true;
            break;
          }
        }
      }
      if (dead) {
        if (p.kind === 'caca' && p.life <= 0) {
          zones.push({ x: p.x, y: p.y, r: p.splash, dmg: p.dmg * 0.45, t: 1.6, tick: 0.35, kind: 'charco' });
        }
        g.damageObstaclesAt(p.x, p.y, 8, p.dmg);
        projectiles.splice(i, 1);
      }
    }

    // pasiva Llorona: charquitos de lágrimas mientras te mueves
    const ll = g.passives.llorona || 0;
    if (ll > 0 && g.player.moving) {
      g._llT = (g._llT || 0) - dt;
      if (g._llT <= 0) {
        g._llT = Math.max(0.5, 1.2 - 0.12 * ll);
        zones.push({
          x: g.player.x + (Math.random() - 0.5) * 8,
          y: g.player.y + 3,
          r: 10 + 2 * ll,
          dmg: (1.4 + 1.3 * ll) * g.player.stats.might,
          t: 2.0, tick: 0.35, kind: 'lagrima',
        });
      }
    }

    // zonas (charcos)
    for (let i = zones.length - 1; i >= 0; i--) {
      const z = zones[i];
      if (z.kind === 'steam') { zones.splice(i, 1); continue; }
      z.t -= dt;
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = z.kind === 'nube' ? 0.5 : 0.35;
        for (let j = g.enemies.length - 1; j >= 0; j--) {
          const e = g.enemies[j];
          if (!e || e.hp <= 0) continue;
          const dx = e.x - z.x, dy = e.y - z.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < z.r * z.r) {
            if (z.kb) {
              const d = Math.sqrt(d2) || 1;
              g.damageEnemy(e, z.dmg, { kb: z.kb, kx: dx / d, ky: dy / d, slow: z.slow || 0 });
            } else {
              g.damageEnemy(e, z.dmg, { slow: z.slow || 0 });
            }
          }
        }
        g.damageObstaclesAt(z.x, z.y, z.r, z.dmg);
        if (z.once) z.tick = 999;
      }
      if (z.t <= 0) zones.splice(i, 1);
    }

    // grito
    for (let i = waves.length - 1; i >= 0; i--) {
      const wv = waves[i];
      wv.t += dt;
      wv.r = Math.min(wv.max, 8 + (wv.t / wv.life) * wv.max);
      for (let j = g.enemies.length - 1; j >= 0; j--) {
        const e = g.enemies[j];
        if (!e || e.hp <= 0 || wv.applied.has(e)) continue;
        const dx = e.x - wv.x, dy = e.y - wv.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= wv.r + e.r) {
          wv.applied.add(e);
          g.damageEnemy(e, wv.dmg, { kb: wv.kb, kx: dx / (d || 1), ky: dy / (d || 1) });
        }
      }
      if (!wv.obsHit && wv.r >= wv.max * 0.7) {
        wv.obsHit = true;
        g.damageObstaclesAt(wv.x, wv.y, wv.max, wv.dmg * 0.5);
      }
      if (wv.t >= wv.life) waves.splice(i, 1);
    }

    // companion
    if (alex) {
      const tx = g.player.x - g.player.facing.x * 20 - 8;
      const ty = g.player.y - g.player.facing.y * 12 + 3;
      alex.x += (tx - alex.x) * Math.min(1, 6 * dt);
      alex.y += (ty - alex.y) * Math.min(1, 6 * dt);
    }

    // topes de seguridad (no cambian el juego normal)
    if (projectiles.length > 450) projectiles.splice(0, projectiles.length - 450);
    if (zones.length > 140) zones.splice(0, zones.length - 140);
    if (flashes.length > 80) flashes.splice(0, flashes.length - 80);
    if (waves.length > 20) waves.splice(0, waves.length - 20);
  }

  function updateOrbit(dt, w, g) {
    orbitAng += dt * 2.4;
    const n = Math.max(1, w._count | 0);
    for (let i = 0; i < n; i++) {
      const a = orbitAng + (i / n) * Math.PI * 2;
      const ox = g.player.x + Math.cos(a) * w._radius;
      const oy = g.player.y + Math.sin(a) * w._radius;
      if (!w._pts) w._pts = [];
      w._pts[i] = { x: ox, y: oy };
      for (let j = g.enemies.length - 1; j >= 0; j--) {
        const e = g.enemies[j];
        if (!e || e.hp <= 0) continue;
        const dx = e.x - ox, dy = e.y - oy;
        if (dx * dx + dy * dy < (e.r + 6) * (e.r + 6)) {
          const last = e._orbT === undefined ? -99 : e._orbT;
          if (g.time - last > (w._cd || 0.5)) {
            e._orbT = g.time;
            g.damageEnemy(e, w._dmg, {});
            if (w.evolved) {
              zones.push({
                x: ox, y: oy, r: 24 * (g.player.stats.area || 1),
                dmg: w._dmg * 0.5, t: 0.22, tick: 0, kind: 'boom', once: true,
              });
            }
          }
        }
      }
    }
  }

  // ---------- draw (capa suelo) ----------
  function drawGround(ctx, g) {
    // charcos (bajo todo)
    for (const z of zones) {
      ctx.save();
      if (z.kind === 'charco') {
        ctx.fillStyle = 'rgba(122,74,36,0.75)';
        ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.65, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(60,35,15,0.6)';
        ctx.beginPath(); ctx.ellipse(z.x - z.r * 0.3, z.y + 2, z.r * 0.3, z.r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      } else if (z.kind === 'lagrima') {
        ctx.fillStyle = 'rgba(79,141,255,0.5)';
        ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(200,228,255,0.7)';
        ctx.beginPath(); ctx.ellipse(z.x - z.r * 0.2, z.y - z.r * 0.15, z.r * 0.28, z.r * 0.14, 0, 0, Math.PI * 2); ctx.fill();
      } else if (z.kind === 'nube') {
        const tt = performance.now() / 500;
        ctx.fillStyle = 'rgba(80,150,50,0.35)';
        ctx.beginPath(); ctx.ellipse(z.x, z.y + 2, z.r * 0.75, z.r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(120,200,90,0.45)';
        for (let b = 0; b < 3; b++) {
          const a2 = tt + b * 2.09;
          ctx.beginPath();
          ctx.ellipse(z.x + Math.cos(a2) * z.r * 0.3, z.y + Math.sin(a2 * 1.3) * z.r * 0.18,
            z.r * 0.5, z.r * 0.38, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (z.kind === 'boom') {
        ctx.fillStyle = 'rgba(255,140,60,' + (z.t * 3) + ')';
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (1.6 - z.t * 2), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // aura de café
    const cafeW = g.weapons.find(w => w.id === 'cafe');
    if (cafeW && cafeW._radius) {
      const r = cafeW._radius;
      ctx.save();
      ctx.strokeStyle = 'rgba(181,122,69,0.85)';
      ctx.lineWidth = cafeW.evolved ? 4 : 3;
      ctx.beginPath(); ctx.arc(g.player.x, g.player.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(181,122,69,0.14)';
      ctx.beginPath(); ctx.arc(g.player.x, g.player.y, r, 0, Math.PI * 2); ctx.fill();
      // vapor
      const t = performance.now() / 300;
      for (let i = 0; i < 5; i++) {
        const a = t + i * 1.26;
        const rr = r * 0.7;
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(g.player.x + Math.cos(a) * rr - 1, g.player.y + Math.sin(a) * rr * 0.7 - 1 - (Math.sin(t * 2 + i) + 1) * 2, 2, 2);
      }
      ctx.restore();
    }
  }

  // ---------- draw (capa aérea) ----------
  function drawAir(ctx, g) {
    // destellos polaroid
    for (const f of flashes) {
      const k = f.t / f.max;
      ctx.save();
      ctx.globalAlpha = k * 0.8;
      const grad = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, f.range);
      grad.addColorStop(0, 'rgba(255,255,255,0.95)');
      grad.addColorStop(0.7, 'rgba(255,240,200,0.55)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.arc(f.x, f.y, f.range, f.angle - f.arc / 2, f.angle + f.arc / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // onda de grito
    for (const wv of waves) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - wv.t / wv.life);
      ctx.strokeStyle = wv.ev ? '#ffd24a' : '#ff6fb5';
      ctx.lineWidth = wv.ev ? 6 : 4;
      ctx.beginPath(); ctx.arc(wv.x, wv.y, wv.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha *= 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(wv.x, wv.y, wv.r * 0.8, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // proyectiles (sprites pixel)
    for (const p of projectiles) {
      const img = Sprites.get(p.kind === 'caca' ? 'caca' : p.kind === 'comida' ? 'comida' : 'chat');
      const sc = p.kind === 'chat' ? 1 : 1.4;
      const w = img.width * sc, h = img.height * sc;
      if (p.kind === 'chat') {
        // emote real de 7TV (fallback: burbuja clásica)
        const em = Emotes.get(p.emote || 0);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx) * 0.15);
        if (Emotes.ready(p.emote || 0)) {
          const sz = Math.round(16 * (p.scale || 1));
          const prevSmooth = ctx.imageSmoothingEnabled;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(em, -sz / 2, -sz / 2, sz, sz);
          ctx.imageSmoothingEnabled = prevSmooth;
        } else {
          ctx.fillStyle = '#f2f2f6';
          ctx.fillRect(-5, -4, 10, 8);
          ctx.fillStyle = '#e84040';
          ctx.fillRect(-3, -2, 2, 2); ctx.fillRect(1, -2, 2, 2);
          ctx.strokeStyle = '#14141a';
          ctx.lineWidth = 1;
          ctx.strokeRect(-5.5, -4.5, 11, 9);
        }
        ctx.restore();
      } else {
        ctx.drawImage(img, p.x - w / 2, p.y - h / 2, w, h);
      }
    }

    // orbitales de subs
    const subW = g.weapons.find(w => w.id === 'sub');
    if (subW && subW._pts) {
      const img = Sprites.get('sub');
      for (let i = 0; i < subW._count; i++) {
        const pt = subW._pts[i];
        if (!pt) continue;
        const s = subW.evolved ? 1.5 : 1.2;
        ctx.drawImage(Sprites.shadowEl(), pt.x - 12, pt.y + 4, 24, 10);
        ctx.drawImage(img, pt.x - img.width * s / 2, pt.y - img.height * s / 2, img.width * s, img.height * s);
      }
    }

    // companion Alejandro (o MissPolaroid si juegas con Alejandro)
    if (alex) {
      const isAlexPlayer = g.player.char === 'alex';
      const pre = isAlexPlayer ? 'p' : 'a';
      const bob = Math.sin(performance.now() / 120) > 0 ? 0 : 1;
      const body = Sprites.get(pre + '_body_down' + bob);
      const head = Sprites.get(pre + '_head_down');
      ctx.drawImage(Sprites.shadowEl(), alex.x - 12, alex.y + 6, 24, 10);
      ctx.drawImage(body, alex.x - body.width / 2, alex.y - body.height + 4);
      ctx.drawImage(head, alex.x - head.width / 2, alex.y - body.height + 4 - head.height + 1);
    }
  }

  return { reset, grant, onLevel, update, drawGround, drawAir, get projectiles() { return projectiles; } };
})();
