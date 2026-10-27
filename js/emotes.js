// ============================================================
// emotes.js — emotes reales de 7TV (global) para el arma de chat
// Imágenes en assets/emotes/*.webp; si aún no cargan, weapons.js
// dibuja la burbuja clásica como fallback.
// ============================================================
window.Emotes = (function () {

  const names = [
    'FeelsWeirdMan', 'forsenPls', 'WAYTOODANK', 'AYAYA',
    'PartyParrot', 'peepoHappy', 'peepoSad', 'Clap',
    'EZ', 'BibleThump', 'FeelsOkayMan', 'PETPET',
    'Stare', 'AlienDance', 'TeaTime', 'ppL',
  ];

  const imgs = names.map((n) => {
    const im = new Image();
    im.src = 'assets/emotes/' + n + '.webp';
    return im;
  });

  function get(i) { return imgs[((i % imgs.length) + imgs.length) % imgs.length]; }
  function ready(i) { const im = get(i); return !!(im && im.complete && im.naturalWidth); }
  function pick() { return (Math.random() * imgs.length) | 0; }

  return { names, get, ready, pick };

})();
