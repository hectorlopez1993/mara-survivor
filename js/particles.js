// ============================================================
// particles.js — sistema de efectos visuales (chispas, anillos, polvo)
// Se integra con Game.fx y Game.shake desde game.js
// ============================================================

window.Particles = (function () {

  const Particles = {};

  // --- CONFIG ---
  const MAX_PARTICLES = 300;       // límite para no colapsar el GC
  const GRAVITY = 40;              // gravedad (pixels por segundo^2)
  const DRAG = 0.985;              // resistencia del aire

  // --- GESTOR DE VIDA ---
  Particles.active = [];

  function register(particle, life) {
    if (Particles.active.length >= MAX_PARTICLES) return false;
    particle.life = life || 1.0;
    particle.age = 0;
    particle.dead = false;
    Particles.active.push(particle);
    return true;
  }

  function update(dt, game) {
    if (typeof dt !== 'number' || dt <= 0) return;
    const dtClamped = Math.min(dt, 0.1);

    const shake = (game && game.shake) || 0;
    if (shake > 1 && game.player) {
      for (let i = 0; i < Math.min(4, Math.floor(shake)); i++) {
        register(makeSpark(
          game.player.x + (Math.random() - 0.5) * 16,
          game.player.y + (Math.random() - 0.5) * 16,
          '#bf94ff',
          2
        ), 0.25);
      }
    }

    const alive = [];
    for (const p of Particles.active) {
      p.age += dtClamped;
      if (p.age < p.life) {
        if (p.vx) p.x += p.vx * dtClamped;
        if (p.vy) p.y += p.vy * dtClamped;
        if (p.gvy) p.vy += p.gvy * dtClamped;
        if (p.drag) {
          p.vx *= Math.pow(p.drag, dtClamped * 60);
          p.vy *= Math.pow(p.drag, dtClamped * 60);
        }
        alive.push(p);
      } else {
        p.dead = true;
      }
    }
    Particles.active = alive;
  }

  // --- TIPOS DE PARTÍCULAS ---

  function makeSpark(x, y, color, size) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 80;
    return {
      kind: 'spark', x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      color: color || '#ffe45e',
      size: size || 2,
      gvy: GRAVITY * 0.3,
      drag: DRAG,
    };
  }

  function makeRing(x, y, radius, duration, color) {
    return {
      kind: 'ring', x, y,
      vx: 0, vy: 0,
      radius: radius || 6,
      maxR: (radius || 6) + 24,
      color: color || '#5ce1ff',
    };
  }

  function makeDust(x, y, count) {
    const n = count || 4;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 10 + Math.random() * 25;
      register({
        kind: 'dust', x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        color: '#75757e',
        size: 2,
        drag: 0.95,
      }, 0.5 + Math.random() * 0.4);
    }
  }

  // --- DIBUJO ---
  function draw(ctx) {
    if (Particles.active.length === 0) return;

    for (const p of Particles.active) {
      const progress = p.age / p.life;
      ctx.globalAlpha = Math.max(0, 1 - progress);

      if (p.kind === 'spark') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else if (p.kind === 'ring') {
        const r = p.radius + (p.maxR - p.radius) * progress;
        ctx.strokeStyle = p.color || '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === 'dust') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 1, p.y - 1, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  return {
    get active() { return Particles.active; },
    register,
    update,
    draw,
    makeSpark,
    makeRing,
    makeDust,
  };
})();
