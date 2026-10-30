// ============================================================
// main.js — bucle de juego, input, escalado, wiring de menús
// ============================================================
(function () {

  Sprites.init();

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const stage = document.getElementById('stage');

  // ---------- escalado pixel-perfect a la ventana ----------
  function fit() {
    const s = Math.min(window.innerWidth / 640, window.innerHeight / 360);
    stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  fit();

  // ---------- input ----------
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    Game.keyDown(e.code);
  });
  window.addEventListener('keyup', (e) => Game.keyUp(e.code));
  window.addEventListener('blur', () => {
    Game.keys = {};
    Game.mouseDown = false;
    if (Game.state === 'playing') Game.pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && Game.state === 'playing') {
      Game.keys = {};
      Game.mouseDown = false;
      Game.pause();
    }
  });

  function toLogical(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (640 / r.width),
      y: (e.clientY - r.top) * (360 / r.height),
    };
  }
  canvas.addEventListener('mousemove', (e) => { Game.mouse = toLogical(e); });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { Game.mouseDown = true; Game.mouse = toLogical(e); }
  });
  window.addEventListener('mouseup', () => { Game.mouseDown = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- menús ----------
  UI.on('btn-play', () => Game.reset());
  UI.on('btn-char', () => {
    if (!UI.meta.alex) return;
    UI.meta.char = UI.meta.char === 'miso' ? 'alex' : 'miso';
    UI.save();
    UI.renderMenu();
  });
  UI.on('btn-shop', () => UI.renderShop());
  UI.on('btn-how', () => UI.show('howto'));
  UI.on('btn-hud', () => UI.cycleHudMode());
  UI.on('btn-hud-pause', () => UI.cycleHudMode());
  UI.on('btn-how-back', () => UI.renderMenu());
  UI.on('btn-shop-back', () => UI.renderMenu());

  // ---------- bucle ----------
  const STEP = 1 / 60;
  let last = performance.now();
  let acc = 0;

  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;

    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard < 5) {
      Game.update(STEP);
      acc -= STEP;
      guard++;
    }
    if (acc > 0.25) acc = 0;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 640, 360);
    Game.draw(ctx);

    requestAnimationFrame(frame);
  }

  // arranque
  UI.renderMenu();
  requestAnimationFrame(frame);

})();
