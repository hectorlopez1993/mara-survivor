// ============================================================
// biomes.js — ciclo de mapas según el nivel de directo
// ============================================================
window.Biomes = (function () {
  'use strict';

  // El primer nivel siempre es la cabaña de Mara. Después se alterna
  // oficina y plató, y al tercer nivel vuelve la cabaña más dura.
  const LIST = [
    {
      id: 'cabin', name: 'CABAÑA', tint: 'rgba(255,164,92,.05)', rug: 8, density: 0.55,
      obs: ['cajas', 'maceta', 'planta', 'sillon'],
      deco: ['chimenea', 'estanteria', 'tvstream', 'gato', 'lampara',
        'peluche_oso', 'peluche_conejo', 'peluche_pingu', 'peluche_pulpo'],
    },
    {
      id: 'office', name: 'OFICINA', tint: 'rgba(92,206,214,.055)', rug: 0, density: 0.6,
      obs: ['impresora', 'taquilla', 'vending', 'escritorio', 'maceta'],
      deco: ['lampara', 'gato', 'estanteria', 'maceta'],
    },
    {
      id: 'set', name: 'PLATÓ', tint: 'rgba(226,92,182,.06)', rug: 0, density: 0.5,
      obs: ['camara', 'tripoide', 'foco', 'cajas'],
      deco: ['tvstream', 'lampara', 'camara'],
    },
  ];

  function forTier(tier) {
    const t = Math.max(0, (tier | 0) || 0);
    return LIST[t % LIST.length];
  }

  function byId(id) {
    return LIST.find((b) => b.id === id) || LIST[0];
  }

  return { LIST, forTier, byId };
})();
