// ============================================================
// player.js — MissPolaroid / Alejandro: movimiento y render
// ============================================================
window.Player = (function () {

  function create(char) {
    return {
      char: char || 'miso',
      x: 0, y: 0, r: 6,
      hp: 100,
      facing: { x: 0, y: 1 },
      animT: 0, moving: false,
      blinkT: 1.2 + Math.random() * 2.4, blink: 0,
      invuln: 0, hurtT: 0,
      stats: Upgrades.baseStats(),
      xp: 0, xpNeed: 5, level: 1,
    };
  }

  function update(dt, g) {
    const p = g.player;
    let dx = 0, dy = 0;

    // teclado
    const k = g.keys;
    if (k['ArrowLeft'] || k['KeyA']) dx -= 1;
    if (k['ArrowRight'] || k['KeyD']) dx += 1;
    if (k['ArrowUp'] || k['KeyW']) dy -= 1;
    if (k['ArrowDown'] || k['KeyS']) dy += 1;

    // ratón mantenido: hacia el cursor (relativo al centro: la cámara sigue al jugador)
    if (g.mouseDown && g.mouse) {
      const mdx = g.mouse.x - 320, mdy = g.mouse.y - 180;
      if (Math.abs(mdx) + Math.abs(mdy) > 6) { dx = mdx; dy = mdy; }
    }

    const len = Math.sqrt(dx * dx + dy * dy);
    p.moving = len > 0.01;
    if (p.moving) {
      dx /= len; dy /= len;
      p.facing.x = dx; p.facing.y = dy;
      const sp = p.stats.moveSpeed;
      p.x += dx * sp * dt;
      p.y += dy * sp * dt;
    }

    p.animT += dt;
    p.blinkT -= dt;
    if (p.blinkT <= 0) {
      p.blinkT = 2.6 + Math.random() * 3.4;
      p.blink = 0.14;
    }
    if (p.blink > 0) p.blink -= dt;
    if (p.hurtT > 0) p.hurtT -= dt;

    if (p.invuln > 0) p.invuln -= dt;

    // regeneración
    if (p.stats.regen > 0 && p.hp < p.stats.maxHP) {
      p.hp = Math.min(p.stats.maxHP, p.hp + p.stats.regen * dt);
    }
  }

  function draw(ctx, g) {
    const p = g.player;
    const pre = p.char === 'alex' ? 'a_' : 'p_';

    // dirección
    let dir = 'down';
    const fx = p.facing.x, fy = p.facing.y;
    if (Math.abs(fy) > Math.abs(fx)) dir = fy < 0 ? 'up' : 'down';
    else dir = 'side';

    const sideFrames = dir === 'side';
    const frame = p.moving
      ? (Math.floor(p.animT * (sideFrames ? 10 : 8)) % (sideFrames ? 4 : 2))
      : 0;
    let bodyName, headName;
    if (sideFrames) {
      bodyName = pre + 'body_side' + frame;
      headName = pre + 'head_side';
    } else {
      bodyName = pre + 'body_' + dir + frame;
      headName = pre + 'head_' + dir;
      if (dir === 'down' && p.blink > 0) headName += '2';
      if (dir === 'down' && p.hurtT > 0) headName = pre + 'head_down_hurt';
    }
    // pasiva Flequillo Estilizado: mech��n te��ido + ojo que asoma
    if (g.passives && g.passives.flequillo && Sprites.has && Sprites.has(headName + '_fl')) headName += '_fl';
    const body = Sprites.get(bodyName) || Sprites.get(pre + 'body_down0');
    let head = Sprites.get(headName) || Sprites.get(pre + 'head_down');

    const walkBob = p.moving && (sideFrames ? (frame === 1 || frame === 3) : frame === 1);
    const idleBob = !p.moving ? (Math.floor(p.animT * 2.2) % 2) : 0;
    const bob = (walkBob || idleBob) ? 1 : 0;
    const bodyX = Math.round(p.x - body.width / 2);
    const bodyY = Math.round(p.y - body.height + 4 + bob);

    // parpadeo de invulnerabilidad
    const blink = p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0;

    ctx.save();
    if (blink) ctx.globalAlpha = 0.35;

    ctx.drawImage(Sprites.shadowEl(), p.x - 12, p.y + 3, 24, 10);
    ctx.drawImage(body, bodyX, bodyY);

    // CABEZA con escala (pasiva Cabeza Gigante)
    const hs = (p.stats.headScale || 1) + (p.stats.headScaleAdd || 0);
    const hw = head.width * hs, hh = head.height * hs;
    // anclaje: centro horizontal del cuerpo, base de la cabeza sobre los hombros
    const anchorX = Math.round(p.x);
    const anchorY = bodyY + 4; // hombros
    const flip = dir === 'side' && fx < 0;
    ctx.imageSmoothingEnabled = false;
    if (flip) {
      ctx.save();
      ctx.translate(anchorX, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(head, -hw / 2, anchorY - hh, hw, hh);
      ctx.restore();
    } else {
      ctx.drawImage(head, anchorX - hw / 2, anchorY - hh, hw, hh);
    }

    // estrellitas de daño
    if (p.hurtT > 0) {
      ctx.globalAlpha = Math.min(1, p.hurtT * 4);
      ctx.fillStyle = '#ffd24a';
      const hy = anchorY - hh - 3;
      star(ctx, anchorX - 10, hy + 2);
      star(ctx, anchorX, hy - 2);
      star(ctx, anchorX + 10, hy + 1);
    }
    ctx.restore();
  }

  function star(ctx, x, y) {
    ctx.fillRect(x, y - 2, 1, 5);
    ctx.fillRect(x - 2, y, 5, 1);
  }

  return { create, update, draw };
})();
