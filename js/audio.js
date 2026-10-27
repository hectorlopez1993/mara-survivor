// ============================================================
// audio.js — SFX sintetizados con WebAudio (sin assets)
// ============================================================
window.AudioFX = (function () {
  let ctx = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.35;
        master.connect(ctx.destination);
      } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function env(node, t0, a, d, peak) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    node.connect(g);
    g.connect(master);
    return g;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime;
    const o = c.createOscillator();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    env(o, t0, 0.008, dur, vol || 0.5);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, filterFreq) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime;
    const len = Math.max(1, (c.sampleRate * dur) | 0);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq || 1200;
    src.connect(f);
    env(f, t0, 0.005, dur, vol || 0.4);
    src.start(t0);
  }

  const fx = {
    shoot()   { tone(720, 0.07, 'square', 0.18, 320); },
    flash()   { tone(1400, 0.1, 'triangle', 0.22, 500); noise(0.06, 0.1, 3000); },
    hit()     { noise(0.05, 0.16, 900); },
    kill()    { tone(300, 0.09, 'square', 0.2, 120); noise(0.07, 0.14, 700); },
    hurt()    { tone(160, 0.2, 'sawtooth', 0.4, 70); },
    xp()      { tone(880, 0.05, 'sine', 0.14, 1320); },
    levelup() {
      [523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => tone(f, 0.12, 'square', 0.3), i * 70));
    },
    chest() {
      [392, 523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => tone(f, 0.15, 'triangle', 0.34), i * 90));
    },
    coin()    { tone(1200, 0.06, 'square', 0.16, 1800); },
    click()   { tone(500, 0.04, 'square', 0.16, 700); },
    poop()    { tone(200, 0.1, 'sine', 0.3, 90); noise(0.08, 0.12, 500); },
    explode() { noise(0.28, 0.4, 600); tone(90, 0.25, 'sawtooth', 0.3, 40); },
    boss()    { tone(80, 0.7, 'sawtooth', 0.45, 55); noise(0.5, 0.2, 400); },
    win() {
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        setTimeout(() => tone(f, 0.22, 'square', 0.32), i * 130));
    },
    lose() {
      [440, 370, 311, 220].forEach((f, i) =>
        setTimeout(() => tone(f, 0.3, 'sawtooth', 0.3), i * 180));
    },
    scream()  { tone(900, 0.25, 'sawtooth', 0.22, 300); },
    toast()   { tone(660, 0.1, 'triangle', 0.24, 990); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
  };

  return fx;
})();
