// ============================================================
// ranking.js — clasificación online (API PHP en OVH)
// Si el API no responde, el juego sigue funcionando en local.
// ============================================================
window.Ranking = (function () {
  'use strict';

  const ENDPOINT = 'api/ranking.php';
  const NAME_KEY = 'mara_survivor_name_v1';
  const TIMEOUT = 7000;
  const MAX_NAME = 16;

  let lastScores = [];
  let busy = false;

  function $(id) { return document.getElementById(id); }

  // ---------------- NOMBRE ----------------
  function cleanName(raw) {
    let n = String(raw == null ? '' : raw)
      .replace(/[\u0000-\u001f\u007f<>"'`\\/]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (n.length > MAX_NAME) n = n.slice(0, MAX_NAME);
    return n || 'VIEWER';
  }

  function getName() {
    try {
      const n = localStorage.getItem(NAME_KEY);
      if (n) return cleanName(n);
    } catch (e) {}
    return 'VIEWER';
  }

  function setName(raw) {
    const n = cleanName(raw);
    try { localStorage.setItem(NAME_KEY, n); } catch (e) {}
    const input = $('ranking-name');
    if (input) input.value = n;
    return n;
  }

  // ---------------- HTTP ----------------
  function request(url, opts) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT) : null;
    const o = Object.assign({ cache: 'no-store' }, opts || {});
    if (ctrl) o.signal = ctrl.signal;

    return fetch(url, o).then((res) => {
      return res.text().then((txt) => {
        let data = null;
        try { data = JSON.parse(txt); } catch (e) { data = null; }
        if (!res.ok || !data) throw new Error('http_' + res.status);
        return data;
      });
    }).finally(() => { if (timer) clearTimeout(timer); });
  }

  function top(limit) {
    const n = Math.max(1, Math.min(50, limit || 20));
    return request(ENDPOINT + '?limit=' + n + '&_=' + Date.now()).then((r) => {
      if (!r.ok) throw new Error(r.error || 'api');
      lastScores = Array.isArray(r.scores) ? r.scores : [];
      return lastScores;
    });
  }

  function submit(stats, win) {
    const payload = {
      name: getName(),
      time: Number(stats && stats.time) || 0,
      kills: Number(stats && stats.kills) || 0,
      level: Number(stats && stats.level) || 1,
      win: !!win,
    };
    return request(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => {
      if (!r.ok) throw new Error(r.error || 'api');
      if (Array.isArray(r.scores)) lastScores = r.scores;
      return r;
    });
  }

  function describe(res) {
    if (!res || !res.ok) return 'Ranking no disponible ahora mismo.';
    const name = res.name || getName();
    if (res.rank) return 'RANKING: #' + res.rank + ' de ' + (res.total || '?') + ' como ' + name + ' (' + fmt(res.time) + ')';
    return 'Resultado enviado como ' + name + '.';
  }

  // ---------------- FORMATO ----------------
  function fmt(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function setStatus(txt) {
    const el = $('ranking-status');
    if (el) el.textContent = txt;
  }

  // ---------------- RENDER ----------------
  function cell(tag, cls, txt) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    d.textContent = txt;
    return d;
  }

  function render(scores, note) {
    const list = $('ranking-list');
    if (!list) return;
    list.innerHTML = '';

    if (!scores || !scores.length) {
      list.appendChild(cell('p', 'rank-empty', note || 'Todavía no hay marcas. ¡Sé el primero!'));
      return;
    }

    const table = document.createElement('div');
    table.className = 'rank-table';

    const head = document.createElement('div');
    head.className = 'rank-row head';
    head.appendChild(cell('span', 'pos', '#'));
    head.appendChild(cell('span', 'who', 'JUGADOR'));
    head.appendChild(cell('span', 'time', 'TIEMPO'));
    head.appendChild(cell('span', 'kills', 'BAJAS'));
    head.appendChild(cell('span', 'lvl', 'NIV'));
    head.appendChild(cell('span', 'win', '★'));
    table.appendChild(head);

    const me = getName();
    scores.forEach((s, i) => {
      const row = document.createElement('div');
      row.className = 'rank-row' + (i < 3 ? ' top' + (i + 1) : '') +
        (String(s.name).toLowerCase() === me.toLowerCase() ? ' me' : '');
      row.appendChild(cell('span', 'pos', String(i + 1)));
      row.appendChild(cell('span', 'who', s.name || 'ANON'));
      row.appendChild(cell('span', 'time', fmt(s.time)));
      row.appendChild(cell('span', 'kills', String(s.kills | 0)));
      row.appendChild(cell('span', 'lvl', String(s.level | 0)));
      row.appendChild(cell('span', 'win', s.win ? '★' : ''));
      table.appendChild(row);
    });

    list.appendChild(table);
  }

  function renderLocal(note) {
    const list = $('ranking-list');
    if (!list) return;
    list.innerHTML = '';
    list.appendChild(cell('p', 'rank-empty', note || 'Sin conexión con el ranking.'));
    const meta = (window.UI && UI.meta) || {};
    if (meta.bestTime) {
      const table = document.createElement('div');
      table.className = 'rank-table local';
      const row = document.createElement('div');
      row.className = 'rank-row me';
      row.appendChild(cell('span', 'pos', '—'));
      row.appendChild(cell('span', 'who', 'TU MEJOR MARCA'));
      row.appendChild(cell('span', 'time', fmt(meta.bestTime)));
      row.appendChild(cell('span', 'kills', '—'));
      row.appendChild(cell('span', 'lvl', '—'));
      row.appendChild(cell('span', 'win', ''));
      table.appendChild(row);
      list.appendChild(table);
    }
  }

  // ---------------- ACCIONES ----------------
  function refresh() {
    if (busy) return;
    busy = true;
    setStatus('CARGANDO…');
    top(20).then((scores) => {
      render(scores);
      setStatus('TOP ' + scores.length);
    }).catch(() => {
      renderLocal();
      setStatus('SIN CONEXIÓN');
    }).finally(() => { busy = false; });
  }

  function open() {
    const input = $('ranking-name');
    if (input) input.value = getName();
    if (window.UI) UI.show('ranking');
    refresh();
  }

  function saveName() {
    const input = $('ranking-name');
    const n = setName(input ? input.value : getName());
    const hint = $('ranking-hint');
    if (hint) hint.textContent = 'Guardado como ' + n + '. Se usará en la próxima run.';
    if (lastScores.length) render(lastScores);
  }

  function init() {
    const refreshBtn = $('btn-ranking-refresh');
    if (!refreshBtn) return;
    refreshBtn.onclick = () => { if (window.AudioFX) AudioFX.click(); refresh(); };

    const backBtn = $('btn-ranking-back');
    if (backBtn) backBtn.onclick = () => {
      if (window.AudioFX) AudioFX.click();
      if (window.UI) UI.renderMenu();
      if (window.Game) Game.state = 'menu';
    };

    const saveBtn = $('btn-save-name');
    if (saveBtn) saveBtn.onclick = () => { if (window.AudioFX) AudioFX.click(); saveName(); };

    const input = $('ranking-name');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); saveName(); }
      });
    }

    if (window.UI && UI.on) UI.on('btn-rank', open);
  }

  init();

  return { init, open, top, submit, describe, refresh, render, getName, setName, ENDPOINT };
})();
