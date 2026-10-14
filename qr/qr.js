/*
 * NOCIV QR encoder. No outside libraries, nothing leaves the page.
 * Byte mode (UTF-8), versions 1 to 40, error correction L / M / Q / H.
 * Follows the QR Code standard (ISO/IEC 18004). Modeled on Project Nayuki's
 * public domain reference design.
 *
 *   const qr = NocivQR.encode('https://nociv.co', 'H');
 *   qr.size            // modules per side
 *   qr.get(x, y)       // true = dark
 */
(function (global) {
  'use strict';

  var ECL = { L: { ord: 0, bits: 1 }, M: { ord: 1, bits: 0 }, Q: { ord: 2, bits: 3 }, H: { ord: 3, bits: 2 } };

  var ECC_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  var NUM_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];

  function rawDataModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  function dataCodewords(ver, ecl) {
    return Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK[ecl.ord][ver] * NUM_BLOCKS[ecl.ord][ver];
  }

  // ---- GF(256) Reed-Solomon ----
  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xFF;
  }
  function rsDivisor(degree) {
    var res = [];
    for (var i = 0; i < degree - 1; i++) res.push(0);
    res.push(1);
    var root = 1;
    for (var k = 0; k < degree; k++) {
      for (var j = 0; j < res.length; j++) {
        res[j] = gfMul(res[j], root);
        if (j + 1 < res.length) res[j] ^= res[j + 1];
      }
      root = gfMul(root, 0x02);
    }
    return res;
  }
  function rsRemainder(data, divisor) {
    var res = divisor.map(function () { return 0; });
    data.forEach(function (b) {
      var factor = b ^ res.shift();
      res.push(0);
      divisor.forEach(function (coef, i) { res[i] ^= gfMul(coef, factor); });
    });
    return res;
  }

  function utf8(str) {
    var out = [];
    var enc = unescape(encodeURIComponent(str));
    for (var i = 0; i < enc.length; i++) out.push(enc.charCodeAt(i));
    return out;
  }

  function encode(text, eclName, minVersion, forceMask) {
    var ecl = ECL[eclName || 'M'];
    if (!ecl) throw new Error('Unknown error correction level');
    var bytes = utf8(String(text));

    var ver, capBits, need;
    for (ver = Math.max(1, minVersion || 1); ver <= 40; ver++) {
      capBits = dataCodewords(ver, ecl) * 8;
      need = 4 + (ver <= 9 ? 8 : 16) + bytes.length * 8;
      if (need <= capBits) break;
    }
    if (ver > 40) throw new Error('TOO_LONG');

    // ---- bit stream ----
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(0x4, 4);
    put(bytes.length, ver <= 9 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, capBits - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < capBits; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var v = 0;
      for (var j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
      data.push(v);
    }

    // ---- error correction + interleave ----
    var numBlocks = NUM_BLOCKS[ecl.ord][ver];
    var eccLen = ECC_PER_BLOCK[ecl.ord][ver];
    var rawCodewords = Math.floor(rawDataModules(ver) / 8);
    var numShort = numBlocks - rawCodewords % numBlocks;
    var shortLen = Math.floor(rawCodewords / numBlocks);
    var div = rsDivisor(eccLen);
    var blocks = [];
    for (var b = 0, k = 0; b < numBlocks; b++) {
      var dat = data.slice(k, k + shortLen - eccLen + (b < numShort ? 0 : 1));
      k += dat.length;
      var ecc = rsRemainder(dat, div);
      if (b < numShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var codewords = [];
    for (var c = 0; c < blocks[0].length; c++) {
      for (var bb = 0; bb < blocks.length; bb++) {
        if (c !== shortLen - eccLen || bb >= numShort) codewords.push(blocks[bb][c]);
      }
    }

    // ---- matrix ----
    var size = ver * 4 + 17;
    var mods = [], fn = [];
    for (var y = 0; y < size; y++) {
      mods.push(new Array(size).fill(false));
      fn.push(new Array(size).fill(false));
    }
    function setF(x, y, dark) { mods[y][x] = dark; fn[y][x] = true; }

    for (var t = 0; t < size; t++) { setF(6, t, t % 2 === 0); setF(t, 6, t % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) setF(xx, yy, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);

    var align = [];
    if (ver > 1) {
      var na = Math.floor(ver / 7) + 2;
      var step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2;
      align = [6];
      for (var pos = size - 7; align.length < na; pos -= step) align.splice(1, 0, pos);
      for (var ai = 0; ai < na; ai++) for (var aj = 0; aj < na; aj++) {
        if ((ai === 0 && aj === 0) || (ai === 0 && aj === na - 1) || (ai === na - 1 && aj === 0)) continue;
        for (var ady = -2; ady <= 2; ady++) for (var adx = -2; adx <= 2; adx++) {
          setF(align[ai] + adx, align[aj] + ady, Math.max(Math.abs(adx), Math.abs(ady)) !== 1);
        }
      }
    }

    function drawFormat(mask) {
      var d = (ecl.bits << 3) | mask, rem = d;
      for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var f = ((d << 10) | rem) ^ 0x5412;
      function bit(i) { return ((f >>> i) & 1) !== 0; }
      for (var a = 0; a <= 5; a++) setF(8, a, bit(a));
      setF(8, 7, bit(6)); setF(8, 8, bit(7)); setF(7, 8, bit(8));
      for (var a2 = 9; a2 < 15; a2++) setF(14 - a2, 8, bit(a2));
      for (var a3 = 0; a3 < 8; a3++) setF(size - 1 - a3, 8, bit(a3));
      for (var a4 = 8; a4 < 15; a4++) setF(8, size - 15 + a4, bit(a4));
      setF(8, size - 8, true);
    }
    drawFormat(0); // reserve

    if (ver >= 7) {
      var rem = ver;
      for (var vi = 0; vi < 12; vi++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vb = (ver << 12) | rem;
      for (var vj = 0; vj < 18; vj++) {
        var dark = ((vb >>> vj) & 1) !== 0;
        var aa = size - 11 + vj % 3, bb2 = Math.floor(vj / 3);
        setF(aa, bb2, dark); setF(bb2, aa, dark);
      }
    }

    // ---- place data ----
    var bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var jj = 0; jj < 2; jj++) {
          var x = right - jj;
          var up = ((right + 1) & 2) === 0;
          var yy2 = up ? size - 1 - vert : vert;
          if (!fn[yy2][x] && bi < codewords.length * 8) {
            mods[yy2][x] = ((codewords[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0;
            bi++;
          }
        }
      }
    }

    // ---- mask: try all 8, keep the lowest penalty ----
    function maskOn(m, x, y) {
      switch (m) {
        case 0: return (x + y) % 2 === 0;
        case 1: return y % 2 === 0;
        case 2: return x % 3 === 0;
        case 3: return (x + y) % 3 === 0;
        case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
        case 5: return (x * y) % 2 + (x * y) % 3 === 0;
        case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
        default: return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
      }
    }
    function applyMask(m) {
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
        if (!fn[y][x] && maskOn(m, x, y)) mods[y][x] = !mods[y][x];
      }
    }
    function penalty() {
      var p = 0, y, x, run, dark = 0;
      function line(get) {
        var r = 0, prev = null, s = '';
        for (var i = 0; i < size; i++) {
          var c = get(i);
          s += c ? '1' : '0';
          if (c === prev) { r++; if (r === 5) p += 3; else if (r > 5) p++; }
          else { r = 1; prev = c; }
        }
        var re = /(?=(10111010000|00001011101))/g;
        while (re.exec(s)) { p += 40; re.lastIndex++; }
      }
      for (y = 0; y < size; y++) line(function (i) { return mods[y][i]; });
      for (x = 0; x < size; x++) line(function (i) { return mods[i][x]; });
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) {
        var c = mods[y][x];
        if (c === mods[y][x + 1] && c === mods[y + 1][x] && c === mods[y + 1][x + 1]) p += 3;
      }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (mods[y][x]) dark++;
      var total = size * size;
      p += Math.floor(Math.abs(dark * 20 - total * 10) / total) * 10;
      return p;
    }
    var best = 0, bestP = Infinity;
    for (var m = 0; m < 8; m++) {
      applyMask(m); drawFormat(m);
      var pp = penalty();
      if (pp < bestP) { bestP = pp; best = m; }
      applyMask(m);
    }
    if (forceMask !== undefined && forceMask !== null) best = forceMask;
    applyMask(best); drawFormat(best);

    return {
      version: ver,
      size: size,
      ecl: eclName,
      mask: best,
      alignment: align,
      get: function (x, y) { return x >= 0 && y >= 0 && x < size && y < size && mods[y][x]; },
      isFunction: function (x, y) { return fn[y][x]; }
    };
  }

  global.NocivQR = { encode: encode, dataCodewords: dataCodewords };
})(typeof window !== 'undefined' ? window : globalThis);
