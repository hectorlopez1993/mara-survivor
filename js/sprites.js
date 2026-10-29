window.Sprites = (function () {
  'use strict';

  const PLAYER_GRIDS = {"p_head_down":["................","....WWWWWWWW....","...WWpphhppWW...","..WhhhhhhhhhhW..",".WhhhhhhhhhhhhW.",".WhhhhhhhhhhhhW.",".WhhhhhhhhhhhhW.",".WhhsssssssshhW.",".WWpsdwsswdspWW.",".WWpsdwsswdspWW.",".WWpsrssssrspWW.",".WWpsssRRssspWW.","...hhSSSSSShh..."],"p_body_down0":["..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..wkkkkkkkkkkw..","..sskkkkkkkkss..","..sskkkkkkkkss..","...uuuuuuuuuu...","...uuuuuuuuuu...","hh.uuu....uuu.hh","hh.sss.hh.sss.hh","..wwww.hh.wwww.."],"p_body_down1":["..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..wkkkkkkkkkkw..","..sskkkkkkkkss..","..sskkkkkkkkss..","...uuuuuuuuuu...","...uuuuuuuuuu...","hh.uuu....uuu.hh","hhh.ss.hh.ss.hhh","...ww.hhhh.ww..."],"p_head_down2":["................","....WWWWWWWW....","...WWpphhppWW...","..WhhhhhhhhhhW..",".WhhhhhhhhhhhhW.",".WhhhhhhhhhhhhW.",".WhhhhhhhhhhhhW.",".WhhsssssssshhW.",".WWpsddssddspWW.",".WWpsddssddspWW.",".WWpsrssssrspWW.",".WWpsssRRssspWW.","...hhSSSSSShh..."],"p_head_down_hurt":["................","....WWWWWWWW....","...WWpphhppWW...","..WhhhhhhhhhhW..",".WhhhhhhhhhhhhW.",".WhhhhhhhhhhhhW.",".WhhhhhhhhhhhhW.",".WhhsssssssshhW.",".WWps.ssss.spWW.",".WWps.ssss.spWW.",".WWpsrssssrspWW.",".WWpssRRRRsspWW.","...hhSSSSSShh..."],"p_head_up":["................","....WWWWWWWW....","...WWpphhppWW...","..WhhhhhhhhhhW..",".WhhhhhhhhhhhhW.",".WhhhhhhhhhhhhW.",".WhhhhhhhhhhhhW.",".WhhhhhhhhhhhhW.",".WWphhhhhhhhpWW.",".WWphhhhhhhhpWW.",".WWphhhhhhhhpWW.",".WWphhhhhhhhpWW.","...hhSSSSSShh..."],"p_body_up0":["..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..wkkkkkkkkkkw..","..sskkkkkkkkss..","..sskkkkkkkkss..","...uuuuuuuuuu...","...uuuuuuuuuu...","hh.uuu....uuu.hh","hh.sss.hh.sss.hh","..wwww.hh.wwww.."],"p_head_up2":["................","....WWWWWWWW....","...WWpphhppWW...","..WhhhhhhhhhhW..",".WhhhhhhhhhhhhW.",".WhhhhhhhhhhhhW.",".WhhhhhhhhhhhhW.",".WhhhhhhhhhhhhW.",".WWphhhhhhhhpWW.",".WWphhhhhhhhpWW.",".WWphhhhhhhhpWW.",".WWphhhhhhhhpWW.","...hhSSSSSShh..."],"p_body_up1":["..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..kkkkkkkkkkkk..","..wkkkkkkkkkkw..","..sskkkkkkkkss..","..sskkkkkkkkss..","...uuuuuuuuuu...","...uuuuuuuuuu...","hh.uuu....uuu.hh","hhh.ss.hh.ss.hhh","...ww.hhhh.ww..."],"p_head_side":[".....dddddddd.....","...ddWWWWWWWWdd...","..ddhhWhhhhhhhdd..",".ddhhhWhhhhhhhhdd.","dhhhhhWhhhhhhhhhd.","dhhhhhWhhhhssssssd","dhhhhdWWdhhssssssd","dhhhdWWWWdhssssssd","dhhhdppppdhsssdssd","dhhhhhhhhsssdssSsd","dhhhhhhhhssrrssssd","dhhhhhhhhsssssRssd","..ddhhhhhhSSSdd..."],"p_body_side0":["...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...duuuuuuuuud....","...duuuuuuuuud....","...duuuddduuud....",".hhhdssdhhdssdhhh.",".hhhdssdhhhdssdhh.","...dwwwdhhdwwwwd.."],"p_body_side1":["...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...duuuuuuuuud....","...duuuuuuuuud....","...duuuddduuud....",".hhhdssddssdhhhhh.",".hhhdssddssdhhhhh.","...dwwwdwwwwd....."],"p_body_side2":["...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...duuuuuuuuud....","...duuuuuuuuud....","...duuuddduuud....",".hhhdssdhhdssdhhh.",".hhhdssdhhhdssdhh.","...dwwwdhhdwwwwd.."],"p_body_side3":["...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...dkkkkkkkkkksd..","...duuuuuuuuud....","...duuuuuuuuud....","...duuuddduuud....",".hhhdssddssdhhhhh.",".hhhdssddssdhhhhh.","...dwwwdwwwwd....."],"a_head_down":["................","....WWWWWWWW....","...WWppnnppWW...","..WnnnnnnnnnnW..",".WnnnnnnnnnnnnW.",".WnnnnnnnnnnnnW.",".WnnnnnnnnnnnnW.",".WnnssssssssnnW.",".WWpsdwsswdspWW.",".WWpsdwsswdspWW.",".WWpsrssssrspWW.",".WWpsssRRssspWW.","...nnSSSSSSnn..."],"a_body_down0":["..gggggggggggg..","..gggggggggggg..","..gggggggggggg..","..gggggggggggg..","..wggggggggggw..","..ssggggggggss..","..ssggggggggss..","...bbbbbbbbbb...","...bbbbbbbbbb...",".h.bbb....bbb.h.","hh.sss.hh.sss.hh","..sss....sss...."],"a_body_down1":["..gggggggggggg..","..gggggggggggg..","..gggggggggggg..","..gggggggggggg..","..wggggggggggw..","..ssggggggggss..","..ssggggggggss..","...bbbbbbbbbb...","...bbbbbbbbbb...",".h.bbb....bbb.h.","hhh.ss.hh.ss.hhh","..sss....sss...."],"a_head_down_hurt":["................","....WWWWWWWW....","...WWppnnppWW...","..WnnnnnnnnnnW..",".WnnnnnnnnnnnnW.",".WnnnnnnnnnnnnW.",".WnnnnnnnnnnnnW.",".WnnssssssssnnW.",".WWps.ssss.spWW.",".WWps.ssss.spWW.",".WWpsrssssrspWW.",".WWpssRRRRsspWW.","...nnSSSSSSnn..."],"a_body_hurt":["..gggggggggggg..","..gggggggggggg..","..gggggggggggg..","..gggggggggggg..","..wggggggggggw..","..ssggggggggss..","..ssggggggggss..","...bbbbbbbbbb...","...bbbbbbbbbb...",".h.bbb....bbb.h.","hh.sss.hh.sss.hh","..sss....sss...."],"a_head_side":["..................",".....WWWWWWWW.....","....nnWnnnnnnn....","...nnnWnnnnnnnn...",".nnnnnWnnnnnnnnn..",".nnnnnWnnnnssssss.",".nnnn.WW.nnssssss.",".nnn.WWWW.nssssss.",".nnn.pppp.nsssdss.",".nnnnnnnnsssdssSs.",".nnnnnnnnssrrssss.",".nnnnnnnnsssssRss.","....nnnnnnSSS....."],"a_body_side0":["...gggggggggggg...","...gggggggggggg...","...gggggggggggg...","...gggggggggggg...","....ggggggggggs...","....ggggggggggs...","....bbbbbbbbb.....","....bbbbbbbbb.....","....bbb...bbb.....","..hh.ss.hh.ss.hh..",".hhh.ss.hhh.ss.hh.",".hhh.ss.hhh.ss.h.."],"a_body_side2":["...gggggggggggg...","...gggggggggggg...","...gggggggggggg...","...gggggggggggg...","....ggggggggggs...","....ggggggggggs...","....bbbbbbbbb.....","....bbbbbbbbb.....","....bbb...bbb.....","..h.ss.hhhh.ss.h..",".h.ss.hhhhh.ss.hh.",".hhh.ss.hhh.ss.h.."],"a_head_down2":["................","....WWWWWWWW....","...WWppnnppWW...","..WnnnnnnnnnnW..",".WnnnnnnnnnnnnW.",".WnnnnnnnnnnnnW.",".WnnnnnnnnnnnnW.",".WnnssssssssnnW.",".WWpsdwsswdspWW.",".WWpsdwsswdspWW.",".WWpsrssssrspWW.",".WWpsssRRssspWW.","...nnSSSSSSnn..."],"a_head_up":["................","....WWWWWWWW....","...WWppnnppWW...","..WnnnnnnnnnnW..",".WnnnnnnnnnnnnW.",".WnnnnnnnnnnnnW.",".WnnnnnnnnnnnnW.",".WnnssssssssnnW.",".WWpsdwsswdspWW.",".WWpsdwsswdspWW.",".WWpsrssssrspWW.",".WWpsssRRssspWW.","...nnSSSSSSnn..."],"a_body_side1":["...gggggggggggg...","...gggggggggggg...","...gggggggggggg...","...gggggggggggg...","....ggggggggggs...","....ggggggggggs...","....bbbbbbbbb.....","....bbbbbbbbb.....","....bbb...bbb.....","..hh.ss.hh.ss.hh..",".hhh.ss.hhh.ss.hh.",".hhh.ss.hhh.ss.h.."],"a_body_side3":["...gggggggggggg...","...gggggggggggg...","...gggggggggggg...","...gggggggggggg...","....ggggggggggs...","....ggggggggggs...","....bbbbbbbbb.....","....bbbbbbbbb.....","....bbb...bbb.....","..h.ss.hhhh.ss.h..",".h.ss.hhhhh.ss.hh.",".hhh.ss.hhh.ss.h.."],"a_body_up0":["..gggggggggggg..","..gggggggggggg..","..gggggggggggg..","..gggggggggggg..","..wggggggggggw..","..ssggggggggss..","..ssggggggggss..","...bbbbbbbbbb...","...bbbbbbbbbb...",".h.bbb....bbb.h.","hh.sss.hh.sss.hh","..sss....sss...."],"a_body_up1":["..gggggggggggg..","..gggggggggggg..","..gggggggggggg..","..gggggggggggg..","..wggggggggggw..","..ssggggggggss..","..ssggggggggss..","...bbbbbbbbbb...","...bbbbbbbbbb...",".h.bbb....bbb.h.","hhh.ss.hh.ss.hhh","..sss....sss...."]};

  const PAL = {
    h: [27, 27, 36],
    k: [26, 24, 34],
    u: [139, 92, 246],
    s: [246, 203, 164],
    W: [244, 240, 255],
    w: [242, 242, 246],
    p: [201, 182, 238],
    S: [219, 158, 116],
    r: [244, 160, 168],
    R: [232, 64, 64],
    n: [90, 58, 26],
    g: [63, 174, 106],
    b: [60, 90, 166],
    d: [20, 20, 26]
  };

  const cache = Object.create(null);
  const flashCache = Object.create(null);
  const iconCache = Object.create(null);
  let shadow = null;
  let light = null;

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function ctx2(c) {
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return x;
  }

  function rgb(a) {
    return 'rgb(' + a[0] + ',' + a[1] + ',' + a[2] + ')';
  }

  function rect(x, px, py, w, h, col) {
    x.fillStyle = col;
    x.fillRect(px, py, w, h);
  }

  function line(x, x1, y1, x2, y2, col, w) {
    x.strokeStyle = col;
    x.lineWidth = w || 1;
    x.beginPath();
    x.moveTo(x1 + 0.5, y1 + 0.5);
    x.lineTo(x2 + 0.5, y2 + 0.5);
    x.stroke();
  }

  function box(x, px, py, w, h, fill, border) {
    rect(x, px, py, w, h, border || '#0b0b12');
    rect(x, px + 1, py + 1, w - 2, h - 2, fill);
  }

  function gridSprite(rows) {
    const h = rows.length;
    const w = rows[0].length;
    const c = canvas(w, h);
    const x = ctx2(c);
    for (let j = 0; j < h; j++) {
      const row = rows[j];
      for (let i = 0; i < w; i++) {
        const ch = row[i];
        if (ch === '.') continue;
        const col = PAL[ch];
        if (!col) continue;
        x.fillStyle = rgb(col);
        x.fillRect(i, j, 1, 1);
      }
    }
    return c;
  }

  function hash2(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function mod(v, m) {
    return ((v % m) + m) % m;
  }

  function tileCanvas(sx, sy, rug, m, n, edge, parity) {
    const c = canvas(16, 16);
    const x = ctx2(c);
    if (rug) {
      rect(x, 0, 0, 16, 16, parity ? '#2b1d47' : '#291b43');
      x.fillStyle = 'rgba(98,66,150,.10)';
      for (let i = 0; i < 7; i++) {
        x.fillRect(mod(sx * 5 + sy * 3 + i * 7, 15), mod(i * 5 + sy, 15), 1, 1);
      }
      x.strokeStyle = 'rgba(96,64,148,.26)';
      x.lineWidth = 1;
      x.beginPath();
      x.moveTo(0, 0.5);
      x.lineTo(16, 0.5);
      x.moveTo(0.5, 0);
      x.lineTo(0.5, 16);
      x.stroke();
      if (mod(m + n, 8) === 0) {
        x.strokeStyle = 'rgba(128,92,190,.30)';
        x.beginPath();
        x.moveTo(0.5, 0.5);
        x.lineTo(15.5, 15.5);
        x.stroke();
      }
      if (mod(m - n, 8) === 0) {
        x.strokeStyle = 'rgba(128,92,190,.30)';
        x.beginPath();
        x.moveTo(0.5, 15.5);
        x.lineTo(15.5, 0.5);
        x.stroke();
      }
      if (mod(m + n, 8) === 0 && mod(m - n, 8) === 0) {
        rect(x, 7, 7, 2, 2, 'rgba(168,128,238,.40)');
      }
      if (edge & 1) rect(x, 0, 0, 1, 16, '#7a4dff');
      if (edge & 2) rect(x, 15, 0, 1, 16, '#7a4dff');
      if (edge & 4) rect(x, 0, 0, 16, 1, '#7a4dff');
      if (edge & 8) rect(x, 0, 15, 16, 1, '#7a4dff');
    } else {
      const h = hash2(sx * 17 + 3, sy * 31 + 7);
      const base = h < 0.33 ? '#4a2e1a' : h < 0.66 ? '#54341d' : '#5b3a22';
      rect(x, 0, 0, 16, 16, base);
      for (let k = 0; k < 2; k++) {
        const y = k * 8;
        rect(x, 0, y, 16, 1, '#2b190d');
        rect(x, 0, y + 7, 16, 1, '#3a2312');
        const gx = Math.floor(hash2(sx * 7 + k, sy * 13 + k) * 10);
        rect(x, gx, y + 2, 3, 1, 'rgba(30,18,9,.35)');
        rect(x, mod(gx + 5, 12), y + 5, 2, 1, 'rgba(30,18,9,.35)');
        rect(x, mod(gx + 2, 13), y + 4, 4, 1, 'rgba(120,80,45,.25)');
      }
      const jx = sy % 2 === 0 ? 8 : 0;
      rect(x, jx, 0, 1, 8, '#2b190d');
      rect(x, mod(jx + 8, 16), 8, 1, 8, '#2b190d');
    }
    return c;
  }

  function tile(tx, ty) {
    const rug = tx >= -12 && tx <= 12 && ty >= -12 && ty <= 12;
    let key;
    let args;
    if (rug) {
      const m = mod(tx, 8);
      const n = mod(ty, 8);
      const edge = (tx === -12 ? 1 : 0) | (tx === 12 ? 2 : 0) | (ty === -12 ? 4 : 0) | (ty === 12 ? 8 : 0);
      const parity = (tx + ty) & 1;
      key = 'r' + m + ',' + n + ',' + edge + ',' + parity;
      args = [mod(tx, 4), mod(ty, 4), true, m, n, edge, parity];
    } else {
      const sx = mod(tx, 4);
      const sy = mod(ty, 4);
      key = 'w' + sx + ',' + sy;
      args = [sx, sy, false, 0, 0, 0, 0];
    }
    let c = cache[key];
    if (!c) {
      c = tileCanvas(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
      cache[key] = c;
    }
    return c;
  }

  function shadowEl() {
    if (shadow) return shadow;
    const c = canvas(24, 10);
    const x = ctx2(c);
    const g = x.createRadialGradient(12, 5, 1, 12, 5, 12);
    g.addColorStop(0, 'rgba(0,0,0,.50)');
    g.addColorStop(0.55, 'rgba(0,0,0,.28)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.save();
    x.translate(12, 5);
    x.scale(1, 0.38);
    x.beginPath();
    x.arc(0, 0, 12, 0, Math.PI * 2);
    x.fill();
    x.restore();
    shadow = c;
    return c;
  }

  // halo de luz del jugador (cálido, sutil, cacheado)
  function lightEl() {
    if (light) return light;
    const c = canvas(160, 160);
    const x = ctx2(c);
    const g = x.createRadialGradient(80, 80, 4, 80, 80, 78);
    g.addColorStop(0, 'rgba(255,236,170,.20)');
    g.addColorStop(0.35, 'rgba(255,220,140,.10)');
    g.addColorStop(0.7, 'rgba(180,140,255,.045)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 160, 160);
    light = c;
    return c;
  }

  function paper(x, px, py, w, h, fill, border) {
    rect(x, px, py, w, h, border || '#0b0b12');
    rect(x, px + 1, py + 1, w - 2, h - 2, fill || '#f4f0ff');
  }

  function enemyForm() {
    const c = canvas(14, 14);
    const x = ctx2(c);
    paper(x, 0, 0, 14, 14, '#f4f0ff');
    rect(x, 1, 1, 12, 3, '#8b5cf6');
    rect(x, 4, 2, 6, 1, '#f4f0ff');
    rect(x, 4, 6, 2, 2, '#22222b');
    rect(x, 8, 6, 2, 2, '#22222b');
    rect(x, 3, 5, 3, 1, '#22222b');
    rect(x, 8, 5, 3, 1, '#22222b');
    rect(x, 4, 10, 6, 1, '#8c86a0');
    rect(x, 4, 12, 4, 1, '#8c86a0');
    return c;
  }

  function enemyContrato() {
    const c = canvas(16, 16);
    const x = ctx2(c);
    rect(x, 1, 0, 14, 16, '#0b0b12');
    rect(x, 2, 1, 12, 14, '#f4e7d3');
    rect(x, 1, 2, 1, 12, '#d9b98a');
    rect(x, 14, 2, 1, 12, '#d9b98a');
    rect(x, 4, 4, 8, 1, '#8c6c42');
    rect(x, 4, 6, 7, 1, '#8c6c42');
    rect(x, 4, 8, 8, 1, '#8c6c42');
    rect(x, 4, 10, 5, 1, '#8c6c42');
    rect(x, 10, 11, 4, 4, '#c43e3e');
    rect(x, 11, 12, 2, 2, '#ff8ba3');
    return c;
  }

  function enemyCV() {
    const c = canvas(16, 16);
    const x = ctx2(c);
    paper(x, 0, 0, 16, 16, '#f4f0ff');
    rect(x, 2, 2, 5, 6, '#8b5cf6');
    rect(x, 3, 3, 3, 3, '#f6cba4');
    rect(x, 3, 5, 3, 2, '#3c5aa6');
    rect(x, 9, 2, 5, 1, '#6c6880');
    rect(x, 9, 4, 4, 1, '#6c6880');
    rect(x, 9, 6, 5, 1, '#6c6880');
    rect(x, 2, 10, 12, 1, '#6c6880');
    rect(x, 2, 12, 9, 1, '#6c6880');
    return c;
  }

  function enemyEmail() {
    const c = canvas(16, 12);
    const x = ctx2(c);
    rect(x, 0, 1, 16, 11, '#0b0b12');
    rect(x, 1, 2, 14, 9, '#f4f0ff');
    line(x, 1, 2, 8, 7, '#8b5cf6');
    line(x, 15, 2, 8, 7, '#8b5cf6');
    line(x, 1, 10, 6, 6, '#c9b6ee');
    line(x, 15, 10, 10, 6, '#c9b6ee');
    rect(x, 11, 1, 4, 4, '#ff4d6d');
    rect(x, 12, 2, 2, 2, '#fff');
    return c;
  }

  function enemyEmpresa() {
    const c = canvas(20, 21);
    const x = ctx2(c);
    rect(x, 2, 1, 16, 19, '#0b0b12');
    rect(x, 3, 2, 14, 18, '#4c4a63');
    rect(x, 4, 3, 12, 4, '#6c6880');
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 3; i++) {
        rect(x, 5 + i * 4, 9 + r * 4, 2, 2, (r + i) % 2 ? '#ffe45e' : '#5ce1ff');
      }
    }
    rect(x, 8, 18, 4, 3, '#0b0b12');
    rect(x, 9, 17, 2, 1, '#ff4d6d');
    rect(x, 15, 0, 1, 4, '#0b0b12');
    rect(x, 14, 0, 1, 1, '#ff4d6d');
    rect(x, 5, 4, 2, 1, '#ff4d6d');
    rect(x, 13, 4, 2, 1, '#ff4d6d');
    return c;
  }

  function enemyPracticas() {
    const c = canvas(16, 17);
    const x = ctx2(c);
    rect(x, 5, 0, 6, 5, '#0b0b12');
    rect(x, 6, 1, 4, 4, '#f6cba4');
    rect(x, 6, 0, 4, 2, '#5a3a1a');
    rect(x, 6, 3, 1, 1, '#22222b');
    rect(x, 9, 3, 1, 1, '#22222b');
    rect(x, 4, 6, 8, 7, '#0b0b12');
    rect(x, 5, 7, 6, 5, '#5ce1ff');
    rect(x, 7, 7, 2, 3, '#f4f0ff');
    rect(x, 7, 10, 2, 1, '#ff4d6d');
    rect(x, 3, 8, 2, 4, '#f6cba4');
    rect(x, 11, 8, 2, 4, '#f6cba4');
    rect(x, 5, 13, 2, 3, '#3c5aa6');
    rect(x, 9, 13, 2, 3, '#3c5aa6');
    rect(x, 4, 16, 3, 1, '#0b0b12');
    rect(x, 9, 16, 3, 1, '#0b0b12');
    rect(x, 11, 9, 3, 4, '#f4e7d3');
    rect(x, 12, 10, 1, 2, '#8c6c42');
    return c;
  }

  // El PICAO: chándal, gorra, cadenita y móvil en la mano.
  function enemyPicao() {
    const c = canvas(22, 27);
    const x = ctx2(c);
    // gorra
    rect(x, 6, 0, 10, 1, '#0b0b12');
    rect(x, 6, 1, 10, 2, '#c43e3e');
    rect(x, 8, 1, 6, 1, '#e8607a');
    rect(x, 4, 3, 15, 1, '#0b0b12');
    rect(x, 5, 4, 13, 1, '#8c1a2a');
    // cabeza
    rect(x, 5, 4, 12, 9, '#0b0b12');
    rect(x, 6, 4, 10, 8, '#f6cba4');
    rect(x, 6, 5, 10, 1, '#5a3a1a');
    // gafas de sol
    rect(x, 7, 7, 3, 2, '#0b0b12');
    rect(x, 12, 7, 3, 2, '#0b0b12');
    rect(x, 7, 7, 1, 1, '#5ce1ff');
    rect(x, 12, 7, 1, 1, '#5ce1ff');
    rect(x, 10, 7, 2, 1, '#0b0b12');
    // sonrisilla chulesca
    rect(x, 9, 10, 5, 1, '#0b0b12');
    rect(x, 10, 10, 3, 1, '#c43e3e');
    // cadena de oro
    rect(x, 7, 12, 8, 1, '#ffd24a');
    rect(x, 10, 13, 2, 2, '#ffd24a');
    // torso (chándal)
    rect(x, 3, 13, 16, 2, '#0b0b12');
    rect(x, 4, 14, 14, 9, '#0b0b12');
    rect(x, 5, 14, 12, 8, '#3d2c6b');
    rect(x, 5, 14, 12, 1, '#ffd24a');
    rect(x, 10, 15, 2, 7, '#f4f0ff');
    rect(x, 10, 16, 2, 1, '#c43e3e');
    rect(x, 5, 16, 1, 6, '#8b5cf6');
    rect(x, 16, 16, 1, 6, '#8b5cf6');
    // brazos
    rect(x, 0, 15, 4, 9, '#0b0b12');
    rect(x, 1, 16, 2, 6, '#8b5cf6');
    rect(x, 18, 15, 4, 9, '#0b0b12');
    rect(x, 19, 16, 2, 6, '#8b5cf6');
    // móvil en la mano
    rect(x, 18, 12, 4, 7, '#0b0b12');
    rect(x, 19, 13, 2, 4, '#5ce1ff');
    rect(x, 19, 15, 2, 1, '#0b0b12');
    // piernas
    rect(x, 4, 23, 6, 4, '#0b0b12');
    rect(x, 12, 23, 6, 4, '#0b0b12');
    rect(x, 5, 24, 4, 2, '#2a2140');
    rect(x, 13, 24, 4, 2, '#2a2140');
    rect(x, 5, 24, 1, 2, '#8b5cf6');
    rect(x, 16, 24, 1, 2, '#8b5cf6');
    // zapas
    rect(x, 4, 26, 5, 1, '#f4f0ff');
    rect(x, 13, 26, 5, 1, '#f4f0ff');
    return c;
  }

  function enemyManifestante() {
    const c = canvas(19, 21);
    const x = ctx2(c);
    rect(x, 2, 0, 15, 6, '#0b0b12');
    rect(x, 3, 1, 13, 4, '#f4e7d3');
    rect(x, 4, 2, 3, 2, '#c43e3e');
    rect(x, 8, 2, 6, 1, '#8c6c42');
    rect(x, 4, 4, 8, 1, '#8c6c42');
    rect(x, 8, 6, 1, 4, '#5a3a1a');
    rect(x, 7, 10, 5, 5, '#0b0b12');
    rect(x, 8, 11, 3, 3, '#3fae6a');
    rect(x, 7, 9, 5, 2, '#f6cba4');
    rect(x, 8, 9, 1, 1, '#22222b');
    rect(x, 10, 9, 1, 1, '#22222b');
    rect(x, 6, 14, 2, 6, '#3c5aa6');
    rect(x, 11, 14, 2, 6, '#3c5aa6');
    rect(x, 5, 20, 3, 1, '#0b0b12');
    rect(x, 11, 20, 3, 1, '#0b0b12');
    rect(x, 13, 8, 2, 5, '#f6cba4');
    return c;
  }

  function enemyBurocracia() {
    const c = canvas(25, 23);
    const x = ctx2(c);
    rect(x, 1, 2, 23, 20, '#0b0b12');
    rect(x, 2, 3, 21, 18, '#5c5a70');
    rect(x, 3, 4, 19, 3, '#76738c');
    rect(x, 4, 8, 8, 5, '#f4e7d3');
    rect(x, 13, 8, 8, 5, '#f4e7d3');
    rect(x, 4, 14, 8, 5, '#f4e7d3');
    rect(x, 13, 14, 8, 5, '#f4e7d3');
    rect(x, 5, 9, 2, 2, '#22222b');
    rect(x, 9, 9, 2, 2, '#22222b');
    rect(x, 14, 9, 2, 2, '#22222b');
    rect(x, 18, 9, 2, 2, '#22222b');
    rect(x, 5, 15, 2, 2, '#22222b');
    rect(x, 9, 15, 2, 2, '#22222b');
    rect(x, 14, 15, 2, 2, '#22222b');
    rect(x, 18, 15, 2, 2, '#22222b');
    rect(x, 12, 13, 1, 6, '#3a3850');
    rect(x, 4, 5, 5, 1, '#c43e3e');
    rect(x, 14, 5, 6, 1, '#c43e3e');
    rect(x, 2, 0, 4, 3, '#0b0b12');
    rect(x, 3, 1, 2, 1, '#c43e3e');
    rect(x, 19, 0, 4, 3, '#0b0b12');
    rect(x, 20, 1, 2, 1, '#c43e3e');
    return c;
  }

  function enemyOferta() {
    const c = canvas(8, 8);
    const x = ctx2(c);
    rect(x, 0, 1, 8, 6, '#0b0b12');
    rect(x, 1, 2, 6, 4, '#f4e7d3');
    rect(x, 2, 3, 3, 1, '#8c6c42');
    rect(x, 2, 5, 2, 1, '#8c6c42');
    rect(x, 5, 3, 2, 2, '#c43e3e');
    return c;
  }

  function obsImpresora() {
    const c = canvas(22, 18);
    const x = ctx2(c);
    rect(x, 1, 4, 20, 12, '#0b0b12');
    rect(x, 2, 5, 18, 10, '#d9d6e3');
    rect(x, 2, 5, 18, 2, '#f4f0ff');
    rect(x, 3, 8, 16, 5, '#9a96ac');
    rect(x, 4, 9, 14, 3, '#6c6880');
    rect(x, 4, 0, 14, 5, '#f4f0ff');
    rect(x, 5, 1, 12, 3, '#ffffff');
    rect(x, 6, 2, 8, 1, '#8c86a0');
    rect(x, 16, 13, 2, 1, '#3dffb0');
    rect(x, 3, 14, 4, 1, '#3a3850');
    return c;
  }

  function obsTaquilla() {
    const c = canvas(18, 26);
    const x = ctx2(c);
    rect(x, 1, 0, 16, 26, '#0b0b12');
    rect(x, 2, 1, 14, 24, '#5c6a7a');
    rect(x, 3, 2, 12, 22, '#76889a');
    rect(x, 4, 4, 10, 1, '#3a4652');
    rect(x, 4, 6, 10, 1, '#3a4652');
    rect(x, 4, 8, 10, 1, '#3a4652');
    rect(x, 12, 12, 2, 4, '#c9b6ee');
    rect(x, 4, 20, 10, 1, '#3a4652');
    rect(x, 5, 22, 3, 1, '#ff4d6d');
    return c;
  }

  function obsVending() {
    const c = canvas(18, 26);
    const x = ctx2(c);
    rect(x, 1, 0, 16, 26, '#0b0b12');
    rect(x, 2, 1, 14, 24, '#241a3d');
    rect(x, 3, 2, 9, 18, '#3a2b5c');
    rect(x, 4, 3, 7, 16, '#0d0b16');
    for (let r = 0; r < 4; r++) {
      for (let i = 0; i < 3; i++) {
        rect(x, 5 + i * 2, 4 + r * 4, 1, 2, (r + i) % 2 ? '#ffe45e' : '#5ce1ff');
      }
    }
    rect(x, 13, 3, 2, 3, '#3dffb0');
    rect(x, 13, 7, 2, 2, '#ff4d6d');
    rect(x, 13, 11, 2, 2, '#5ce1ff');
    rect(x, 3, 21, 12, 2, '#0b0b12');
    rect(x, 4, 21, 10, 1, '#8b5cf6');
    return c;
  }

  function obsPlanta() {
    const c = canvas(16, 24);
    const x = ctx2(c);
    rect(x, 4, 16, 8, 8, '#0b0b12');
    rect(x, 5, 17, 6, 6, '#8c4a2a');
    rect(x, 5, 17, 6, 1, '#b56a3c');
    rect(x, 7, 6, 2, 11, '#2f7a4a');
    rect(x, 3, 8, 4, 3, '#3fae6a');
    rect(x, 9, 5, 4, 3, '#3fae6a');
    rect(x, 2, 12, 4, 3, '#2f7a4a');
    rect(x, 10, 10, 4, 3, '#3fae6a');
    rect(x, 5, 3, 6, 3, '#3fae6a');
    rect(x, 6, 0, 4, 4, '#4ecb7c');
    rect(x, 11, 2, 3, 4, '#2f7a4a');
    return c;
  }

  function obsMaceta() {
    const c = canvas(14, 18);
    const x = ctx2(c);
    rect(x, 3, 11, 8, 7, '#0b0b12');
    rect(x, 4, 12, 6, 5, '#8c4a2a');
    rect(x, 4, 12, 6, 1, '#b56a3c');
    rect(x, 6, 3, 2, 9, '#2f7a4a');
    rect(x, 4, 5, 2, 3, '#3fae6a');
    rect(x, 8, 6, 2, 3, '#3fae6a');
    rect(x, 5, 2, 2, 2, '#4ecb7c');
    rect(x, 9, 1, 2, 3, '#3fae6a');
    rect(x, 3, 8, 2, 2, '#2f7a4a');
    return c;
  }

  function obsCajas() {
    const c = canvas(20, 18);
    const x = ctx2(c);
    rect(x, 0, 6, 12, 11, '#0b0b12');
    rect(x, 1, 7, 10, 9, '#b57a3c');
    rect(x, 1, 7, 10, 1, '#d99a54');
    rect(x, 5, 7, 2, 9, '#8c5a28');
    rect(x, 3, 10, 4, 2, '#f4e7d3');
    rect(x, 10, 1, 10, 16, '#0b0b12');
    rect(x, 11, 2, 8, 14, '#3c5aa6');
    rect(x, 11, 2, 8, 1, '#5c7ac6');
    rect(x, 14, 2, 2, 14, '#2a3f78');
    rect(x, 12, 6, 6, 2, '#f4e7d3');
    rect(x, 13, 9, 4, 1, '#c9b6ee');
    return c;
  }

  function obsArbol() {
    const c = canvas(20, 30);
    const x = ctx2(c);
    rect(x, 8, 18, 4, 11, '#0b0b12');
    rect(x, 9, 18, 2, 10, '#5a3a1a');
    rect(x, 7, 25, 6, 2, '#3a2414');
    rect(x, 2, 4, 16, 15, '#0b0b12');
    rect(x, 3, 5, 14, 13, '#2f7a4a');
    rect(x, 5, 3, 10, 3, '#3fae6a');
    rect(x, 4, 8, 12, 8, '#3fae6a');
    rect(x, 6, 6, 8, 6, '#4ecb7c');
    rect(x, 7, 9, 3, 2, '#2f7a4a');
    rect(x, 11, 12, 3, 2, '#2f7a4a');
    return c;
  }

  function obsRoca() {
    const c = canvas(20, 16);
    const x = ctx2(c);
    rect(x, 1, 7, 18, 9, '#0b0b12');
    rect(x, 2, 8, 16, 7, '#5c5a70');
    rect(x, 4, 5, 12, 3, '#76738c');
    rect(x, 6, 3, 8, 3, '#8c89a0');
    rect(x, 5, 8, 4, 2, '#8c89a0');
    rect(x, 12, 10, 4, 2, '#3a3850');
    rect(x, 3, 12, 3, 1, '#3a3850');
    return c;
  }

  function obsChimenea() {
    const c = canvas(18, 26);
    const x = ctx2(c);
    rect(x, 2, 2, 14, 24, '#0b0b12');
    rect(x, 3, 3, 12, 23, '#8c4a3a');
    for (let r = 0; r < 6; r++) {
      rect(x, 3, 4 + r * 4, 12, 1, '#5c2c22');
      rect(x, r % 2 ? 6 : 9, 4 + r * 4, 1, 3, '#5c2c22');
    }
    rect(x, 2, 0, 14, 4, '#0b0b12');
    rect(x, 3, 1, 12, 2, '#6c6880');
    rect(x, 5, 0, 2, 2, '#9a96ac');
    return c;
  }

  function obsEstanteria() {
    const c = canvas(20, 28);
    const x = ctx2(c);
    rect(x, 0, 0, 20, 28, '#0b0b12');
    rect(x, 1, 1, 18, 26, '#5a3a1a');
    rect(x, 2, 2, 16, 24, '#3a2414');
    for (let s = 0; s < 3; s++) {
      rect(x, 2, 8 + s * 8, 16, 1, '#8c5a28');
      for (let i = 0; i < 4; i++) {
        const col = ['#ff4d6d', '#5ce1ff', '#ffe45e', '#3fae6a'][(s + i) % 4];
        rect(x, 3 + i * 4, 3 + s * 8, 3, 5, col);
        rect(x, 3 + i * 4, 3 + s * 8, 3, 1, '#f4f0ff');
      }
    }
    return c;
  }

  function obsTvstream() {
    const c = canvas(18, 22);
    const x = ctx2(c);
    rect(x, 0, 1, 18, 13, '#0b0b12');
    rect(x, 1, 2, 16, 11, '#3a3850');
    rect(x, 2, 3, 14, 9, '#0d0b16');
    rect(x, 4, 5, 9, 5, '#241a3d');
    rect(x, 5, 6, 7, 3, '#8b5cf6');
    rect(x, 13, 4, 2, 2, '#ff4d6d');
    rect(x, 7, 14, 4, 3, '#0b0b12');
    rect(x, 3, 17, 12, 2, '#0b0b12');
    rect(x, 4, 17, 10, 1, '#5c5a70');
    return c;
  }

  function obsGato() {
    const c = canvas(14, 12);
    const x = ctx2(c);
    rect(x, 1, 4, 12, 7, '#0b0b12');
    rect(x, 2, 5, 10, 5, '#d98a3c');
    rect(x, 3, 2, 2, 4, '#d98a3c');
    rect(x, 9, 2, 2, 4, '#d98a3c');
    rect(x, 4, 6, 1, 1, '#22222b');
    rect(x, 9, 6, 1, 1, '#22222b');
    rect(x, 6, 7, 2, 1, '#8c4a2a');
    rect(x, 11, 8, 2, 2, '#d98a3c');
    rect(x, 2, 6, 2, 1, '#f4e7d3');
    return c;
  }

  function obsLampara() {
    const c = canvas(12, 24);
    const x = ctx2(c);
    rect(x, 4, 10, 4, 12, '#0b0b12');
    rect(x, 5, 10, 2, 12, '#5c5a70');
    rect(x, 2, 22, 8, 2, '#0b0b12');
    rect(x, 1, 2, 10, 8, '#0b0b12');
    rect(x, 2, 3, 8, 6, '#ffe45e');
    rect(x, 3, 4, 6, 3, '#fff27a');
    rect(x, 4, 8, 4, 2, '#d9b93a');
    return c;
  }

  function pickupXP(color, accent, face) {
    const c = canvas(12, 14);
    const x = ctx2(c);
    rect(x, 0, 0, 12, 14, '#0b0b12');
    rect(x, 1, 1, 10, 12, '#f4f0ff');
    rect(x, 2, 2, 8, 8, color);
    rect(x, 3, 3, 6, 6, '#14141a');
    if (face) {
      rect(x, 4, 5, 1, 1, accent);
      rect(x, 7, 5, 1, 1, accent);
      rect(x, 5, 7, 2, 1, accent);
    } else {
      rect(x, 5, 4, 2, 4, accent);
      rect(x, 4, 5, 4, 2, accent);
    }
    rect(x, 2, 11, 8, 1, color);
    return c;
  }

  function pickupBit() {
    const c = canvas(10, 10);
    const x = ctx2(c);
    rect(x, 4, 0, 2, 10, '#0b0b12');
    rect(x, 2, 2, 6, 6, '#0b0b12');
    rect(x, 1, 4, 8, 2, '#0b0b12');
    rect(x, 4, 1, 2, 8, '#8b5cf6');
    rect(x, 2, 3, 6, 4, '#8b5cf6');
    rect(x, 3, 2, 4, 6, '#a87cff');
    rect(x, 4, 3, 2, 2, '#e0d4ff');
    return c;
  }

  function pickupBocadillo() {
    const c = canvas(14, 12);
    const x = ctx2(c);
    rect(x, 0, 2, 14, 8, '#0b0b12');
    rect(x, 1, 3, 12, 6, '#d99a54');
    rect(x, 1, 3, 12, 2, '#f4e7d3');
    rect(x, 2, 5, 10, 1, '#3fae6a');
    rect(x, 2, 6, 10, 1, '#ff4d6d');
    rect(x, 1, 8, 12, 1, '#b57a3c');
    return c;
  }

  function pickupCofre() {
    const c = canvas(18, 14);
    const x = ctx2(c);
    rect(x, 0, 2, 18, 12, '#0b0b12');
    rect(x, 1, 3, 16, 10, '#8c4a2a');
    rect(x, 1, 3, 16, 5, '#b56a3c');
    rect(x, 1, 7, 16, 1, '#5c2c22');
    rect(x, 7, 6, 4, 4, '#ffe45e');
    rect(x, 8, 7, 2, 2, '#8c4a2a');
    rect(x, 2, 1, 14, 2, '#5c2c22');
    return c;
  }

  function iconSprite(name) {
    const c = canvas(16, 16);
    const x = ctx2(c);
    switch (name) {
      case 'polaroid':
        rect(x, 1, 1, 14, 14, '#0b0b12');
        rect(x, 2, 2, 12, 12, '#f4f0ff');
        rect(x, 3, 3, 10, 8, '#8b5cf6');
        rect(x, 4, 4, 8, 6, '#241a3d');
        rect(x, 7, 5, 2, 3, '#ffe45e');
        rect(x, 6, 6, 4, 1, '#ffe45e');
        rect(x, 4, 12, 8, 1, '#c9b6ee');
        break;
      case 'caca':
        rect(x, 4, 3, 8, 4, '#7a4a24');
        rect(x, 3, 6, 10, 4, '#8c5a2c');
        rect(x, 2, 10, 12, 4, '#a06a32');
        rect(x, 5, 5, 1, 1, '#f4f0ff');
        rect(x, 10, 5, 1, 1, '#f4f0ff');
        rect(x, 13, 2, 2, 1, '#7dffd0');
        rect(x, 1, 4, 2, 1, '#7dffd0');
        break;
      case 'sub':
        rect(x, 2, 2, 12, 12, '#241a3d');
        rect(x, 3, 3, 10, 10, '#8b5cf6');
        rect(x, 4, 4, 8, 8, '#bf94ff');
        rect(x, 5, 5, 6, 3, '#f4f0ff');
        rect(x, 6, 8, 4, 3, '#f4f0ff');
        break;
      case 'cafe':
        rect(x, 3, 5, 8, 8, '#0b0b12');
        rect(x, 4, 6, 6, 6, '#f4e7d3');
        rect(x, 4, 6, 6, 1, '#8c5a2c');
        rect(x, 11, 7, 2, 4, '#0b0b12');
        rect(x, 11, 8, 1, 2, '#f4e7d3');
        rect(x, 5, 2, 1, 2, '#c9c9d4');
        rect(x, 8, 1, 1, 3, '#c9c9d4');
        break;
      case 'chat':
        rect(x, 1, 2, 14, 10, '#0b0b12');
        rect(x, 2, 3, 12, 8, '#8b5cf6');
        rect(x, 4, 11, 3, 3, '#8b5cf6');
        rect(x, 4, 11, 3, 1, '#0b0b12');
        rect(x, 5, 6, 1, 1, '#f4f0ff');
        rect(x, 8, 6, 1, 1, '#f4f0ff');
        rect(x, 11, 6, 1, 1, '#f4f0ff');
        break;
      case 'alejandro':
        rect(x, 4, 1, 8, 3, '#3fae6a');
        rect(x, 3, 3, 10, 4, '#3fae6a');
        rect(x, 4, 4, 8, 8, '#f6cba4');
        rect(x, 4, 2, 8, 2, '#3fae6a');
        rect(x, 5, 7, 1, 1, '#22222b');
        rect(x, 10, 7, 1, 1, '#22222b');
        rect(x, 6, 10, 4, 1, '#c43e3e');
        break;
      case 'grito':
        rect(x, 2, 3, 7, 10, '#0b0b12');
        rect(x, 3, 4, 5, 8, '#f6cba4');
        rect(x, 4, 6, 3, 4, '#8c1a2a');
        rect(x, 4, 7, 3, 1, '#f4f0ff');
        rect(x, 10, 4, 4, 2, '#ff4d6d');
        rect(x, 11, 7, 4, 2, '#ff4d6d');
        rect(x, 10, 10, 4, 2, '#ff4d6d');
        break;
      case 'pedo':
        rect(x, 3, 8, 9, 5, '#0b0b12');
        rect(x, 4, 7, 7, 5, '#3fae6a');
        rect(x, 6, 5, 4, 3, '#4ecb7c');
        rect(x, 2, 6, 3, 2, '#4ecb7c');
        rect(x, 12, 4, 2, 1, '#3fae6a');
        rect(x, 13, 7, 2, 1, '#3fae6a');
        break;
      case 'cabeza':
        rect(x, 5, 1, 8, 2, '#f4f0ff');
        rect(x, 3, 3, 11, 8, '#1b1b24');
        rect(x, 4, 5, 9, 7, '#f6cba4');
        rect(x, 4, 4, 9, 2, '#c9b6ee');
        rect(x, 5, 7, 1, 1, '#22222b');
        rect(x, 10, 7, 1, 1, '#22222b');
        rect(x, 6, 10, 4, 1, '#c43e3e');
        rect(x, 3, 13, 2, 2, '#f6cba4');
        rect(x, 11, 13, 2, 2, '#f6cba4');
        break;
      case 'micro':
        rect(x, 6, 1, 4, 7, '#0b0b12');
        rect(x, 7, 2, 2, 5, '#c9c9d4');
        rect(x, 7, 3, 2, 1, '#8c86a0');
        rect(x, 4, 8, 8, 2, '#0b0b12');
        rect(x, 5, 8, 6, 1, '#8c86a0');
        rect(x, 7, 10, 2, 4, '#5c5a70');
        rect(x, 5, 14, 6, 1, '#0b0b12');
        break;
      case 'silla':
        rect(x, 4, 1, 8, 9, '#0b0b12');
        rect(x, 5, 2, 6, 7, '#8b5cf6');
        rect(x, 6, 3, 4, 4, '#241a3d');
        rect(x, 3, 9, 10, 3, '#0b0b12');
        rect(x, 4, 9, 8, 2, '#bf94ff');
        rect(x, 7, 12, 2, 3, '#5c5a70');
        rect(x, 4, 14, 8, 1, '#0b0b12');
        break;
      case 'audiencia':
        for (let i = 0; i < 3; i++) {
          rect(x, 2 + i * 4, 4, 3, 3, '#f6cba4');
          rect(x, 2 + i * 4, 7, 3, 5, ['#8b5cf6', '#5ce1ff', '#3fae6a'][i]);
        }
        break;
      case 'comida':
        rect(x, 1, 4, 14, 8, '#0b0b12');
        rect(x, 2, 5, 12, 6, '#d99a54');
        rect(x, 2, 5, 12, 2, '#f4e7d3');
        rect(x, 3, 7, 10, 1, '#3fae6a');
        rect(x, 3, 8, 10, 1, '#ff4d6d');
        rect(x, 2, 9, 12, 1, '#b57a3c');
        break;
      case 'flequillo':
        rect(x, 3, 2, 10, 4, '#d6303e');
        rect(x, 4, 4, 8, 9, '#f6cba4');
        rect(x, 3, 3, 4, 5, '#ff7a86');
        rect(x, 4, 7, 1, 1, '#22222b');
        rect(x, 9, 7, 1, 1, '#22222b');
        rect(x, 6, 10, 4, 1, '#c43e3e');
        break;
      case 'llorona':
        rect(x, 2, 3, 12, 8, '#0b0b12');
        rect(x, 3, 4, 10, 6, '#f6cba4');
        rect(x, 5, 5, 2, 1, '#22222b');
        rect(x, 9, 5, 2, 1, '#22222b');
        rect(x, 5, 7, 1, 1, '#5ce1ff');
        rect(x, 5, 8, 1, 3, '#5ce1ff');
        rect(x, 10, 8, 1, 2, '#5ce1ff');
        rect(x, 6, 11, 4, 1, '#c43e3e');
        break;
      case 'gravedad':
        rect(x, 4, 2, 8, 8, '#0b0b12');
        rect(x, 5, 3, 6, 6, '#8b5cf6');
        rect(x, 6, 4, 4, 4, '#bf94ff');
        rect(x, 7, 1, 2, 3, '#f4f0ff');
        rect(x, 7, 11, 2, 3, '#f4f0ff');
        rect(x, 1, 7, 3, 2, '#f4f0ff');
        rect(x, 12, 7, 3, 2, '#f4f0ff');
        break;
      case 'bits':
        rect(x, 7, 1, 2, 14, '#0b0b12');
        rect(x, 3, 4, 10, 8, '#0b0b12');
        rect(x, 7, 2, 2, 12, '#8b5cf6');
        rect(x, 4, 5, 8, 6, '#8b5cf6');
        rect(x, 5, 4, 6, 8, '#a87cff');
        rect(x, 7, 5, 2, 3, '#e0d4ff');
        break;
      case 'vida':
        rect(x, 3, 3, 4, 4, '#ff4d6d');
        rect(x, 9, 3, 4, 4, '#ff4d6d');
        rect(x, 2, 5, 12, 5, '#ff4d6d');
        rect(x, 3, 9, 10, 2, '#ff4d6d');
        rect(x, 5, 11, 6, 2, '#ff4d6d');
        rect(x, 7, 13, 2, 1, '#ff4d6d');
        rect(x, 4, 4, 2, 2, '#ffb3c2');
        break;
      default:
        return null;
    }
    return c;
  }

  function fallback(name) {
    const c = canvas(16, 16);
    const x = ctx2(c);
    rect(x, 0, 0, 16, 16, '#0b0b12');
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        if ((i + j) % 2 === 0) rect(x, i * 2, j * 2, 2, 2, '#241a3d');
      }
    }
    rect(x, 4, 4, 8, 2, '#ff4d6d');
    rect(x, 4, 6, 2, 4, '#ff4d6d');
    rect(x, 7, 8, 2, 2, '#ff4d6d');
    rect(x, 7, 11, 2, 2, '#ff4d6d');
    return c;
  }

  function worldSprite(name) {
    switch (name) {
      // Enemigos
      case 'form': return enemyForm();
      case 'contrato': return enemyContrato();
      case 'cv': return enemyCV();
      case 'email': return enemyEmail();
      case 'empresa': return enemyEmpresa();
      case 'practicas': return enemyPracticas();
      case 'picao': return enemyPicao();
      case 'manifestante': return enemyManifestante();
      case 'burocracia': return enemyBurocracia();
      case 'oferta': return enemyOferta();
      // Objetos de oficina
      case 'impresora': return obsImpresora();
      case 'taquilla': return obsTaquilla();
      case 'vending': return obsVending();
      case 'planta': return obsPlanta();
      case 'maceta': return obsMaceta();
      case 'cajas': return obsCajas();
      case 'arbol': return obsArbol();
      case 'roca': return obsRoca();
      case 'chimenea': return obsChimenea();
      case 'estanteria': return obsEstanteria();
      case 'tvstream': return obsTvstream();
      case 'gato': return obsGato();
      case 'lampara': return obsLampara();
      // Pickup items
      case 'xp_blue': return pickupXP('#5ce1ff', '#bfeaff', true);
      case 'xp_green': return pickupXP('#3dffb0', '#c9ffe9', true);
      case 'xp_red': return pickupXP('#ff4d6d', '#ffc9d2', true);
      case 'xp_purple': return pickupXP('#bf94ff', '#efe6ff', true);
      case 'bit': return pickupBit();
      case 'bocadillo': return pickupBocadillo();
      case 'cofre': return pickupCofre();
      default: return null;
    }
  }

  // Variantes "_fl" de la pasiva Flequillo. Se generan a partir de la
  // cabeza base (abajo/arriba/lado, parpadeo, daño y ambos personajes)
  // para que la pasiva se vea igual mire donde mire el jugador.
  const fringeCache = Object.create(null);

  function fringeHead(base) {
    const key = 'fl:' + base;
    if (fringeCache[key]) return fringeCache[key];
    const src = get(base);
    if (!src) return null;
    const c = canvas(src.width, src.height);
    const x = ctx2(c);
    x.drawImage(src, 0, 0);

    // flequillo teñido de rojo (el rasgo estilizado de la pasiva)
    const dye = rgb([214, 48, 62]);
    const light = rgb([255, 122, 134]);
    const hair = rgb(PAL.h);
    const put = (px, py, w, h, col) => {
      if (py < 0 || py >= c.height) return;
      if (px < 0) { w += px; px = 0; }
      if (px + w > c.width) w = c.width - px;
      if (w > 0) rect(x, px, py, w, h, col);
    };
    const side = /_side$/.test(base);
    const up = /_up\d*$/.test(base);

    if (side) {
      // barrido sobre la frente y mechón sobre el ojo delantero
      put(7, 3, 6, 1, dye);
      put(8, 4, 6, 1, dye);
      put(9, 5, 5, 1, dye);
      put(9, 6, 4, 1, dye);
      put(11, 7, 4, 1, hair);
      put(11, 8, 4, 2, hair);
      put(12, 10, 3, 1, hair);
      put(7, 3, 2, 1, light);
      put(8, 4, 2, 1, light);
      put(11, 8, 1, 2, dye);
    } else if (up) {
      // mechón teñido en la nuca
      put(7, 2, 3, 1, dye);
      put(6, 3, 4, 1, dye);
      put(5, 4, 4, 1, dye);
      put(5, 5, 5, 2, dye);
      put(6, 7, 5, 1, dye);
      put(6, 8, 4, 1, dye);
      put(7, 9, 3, 1, dye);
      put(7, 2, 1, 1, light);
      put(5, 4, 1, 2, light);
      put(6, 7, 1, 1, light);
    } else {
      // flequillo lateral sobre la frente y ojo derecho tapado
      put(4, 3, 6, 1, dye);
      put(3, 4, 7, 1, dye);
      put(4, 5, 8, 1, dye);
      put(5, 6, 8, 1, dye);
      put(9, 7, 4, 1, hair);
      put(9, 8, 4, 2, hair);
      put(10, 10, 2, 1, hair);
      put(4, 3, 2, 1, light);
      put(3, 4, 2, 1, light);
      put(5, 5, 2, 1, light);
      put(9, 8, 1, 2, dye);
    }
    fringeCache[key] = c;
    return c;
  }

  function get(name) {
    if (!name) return fallback('?');
    if (cache[name]) return cache[name];
    let c = null;
    if (name.length > 3 && name.slice(-3) === '_fl') c = fringeHead(name.slice(0, -3));
    else if (PLAYER_GRIDS[name]) c = gridSprite(PLAYER_GRIDS[name]);
    else if (name.indexOf('ic_') === 0) c = iconSprite(name.slice(3));
    else {
      c = worldSprite(name);
      if (!c) c = iconSprite(name);
    }
    if (!c) c = fallback(name);
    cache[name] = c;
    return c;
  }

  function flash(name) {
    const key = 'f:' + name;
    if (flashCache[key]) return flashCache[key];
    const src = get(name);
    const c = canvas(src.width, src.height);
    const x = ctx2(c);
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-over';
    flashCache[key] = c;
    return c;
  }

  function iconData(name) {
    if (!name) return '';
    const key = 'i:' + name;
    if (iconCache[key] !== undefined) return iconCache[key];
    const id = name.indexOf('ic_') === 0 ? name : 'ic_' + name;
    const c = get(id);
    let url = '';
    try {
      url = c.toDataURL('image/png');
    } catch (e) {
      url = '';
    }
    iconCache[key] = url;
    return url;
  }

  function has(name) {
    if (!name) return false;
    if (name.length > 3 && name.slice(-3) === '_fl') return has(name.slice(0, -3));
    return !!(PLAYER_GRIDS[name] || cache[name]);
  }

  function init() {
    shadowEl();
    get('p_head_down');
    get('p_body_down0');
    return true;
  }

  return {
    init,
    get,
    has,
    flash,
    iconData,
    shadowEl,
    lightEl,
    hash2,
    tile,
    PAL
  };
})();
