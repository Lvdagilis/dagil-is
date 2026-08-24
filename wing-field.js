/* WingField — the goldfinch wing profile as a line field, the design system's
   one ambient background. Ported from components/motion/WingField.jsx.
   Strokes and transforms on a single canvas, one rAF loop. No images, no
   blur, no gradients. Two motions (an approach that scales toward the viewer,
   a downstroke that sweeps under the type) cut into six presets so every
   surface reads as one system. Freezes to a composed still under
   prefers-reduced-motion. Never illustrates a bird.

   Usage: <canvas data-wing-field="title" data-line-opacity="0.1"
                  data-speed="0.35" data-background="transparent"></canvas> */
(function () {
  /* wing silhouette in normalised units: tips lift, body dips */
  function wing(xn) {
    var a = Math.abs(xn);
    return 0.60 * Math.pow(a, 1.75)
         - 0.24 * Math.exp(-xn * xn * 7)
         - 0.06 * Math.exp(-Math.pow((a - 0.75) * 3.2, 2));
  }

  var PRESETS = {
    title:        { mode: 'approach',   cxf: 0.50,  cyf: 0.38, sx: 1.05, sy: 1.25, speed: 1.0,  alpha: 2.6,  count: 2.2, rot: 0,     dense: true },
    descent:      { mode: 'downstroke', cxf: 0.48,  cyf: 0.22, sx: 1.00, sy: 1.10, speed: 0.85, alpha: 1,    count: 1.1, rot: 0 },
    'right-edge': { mode: 'downstroke', cxf: 1.02,  cyf: 0.30, sx: 0.85, sy: 0.95, speed: 0.7,  alpha: 1.05, count: 1.0, rot: -0.12 },
    'far-away':   { mode: 'approach',   cxf: 0.56,  cyf: 0.44, sx: 1.35, sy: 1.50, speed: 0.4,  alpha: 0.7,  count: 0.9, rot: 0 },
    corner:       { mode: 'downstroke', cxf: -0.08, cyf: 0.58, sx: 0.70, sy: 0.80, speed: 0.9,  alpha: 1,    count: 1.2, rot: 0.16 },
    underline:    { mode: 'approach',   cxf: 0.44,  cyf: 1.02, sx: 1.70, sy: 0.70, speed: 0.55, alpha: 0.95, count: 1.0, rot: 0 }
  };

  function num(v, fallback) {
    var n = parseFloat(v);
    return isNaN(n) ? fallback : n;
  }

  function init(canvas) {
    var d = canvas.dataset;
    var p = {
      variant: d.wingField || 'descent',
      speed: num(d.speed, 0.35),
      lineOpacity: num(d.lineOpacity, 0.14),
      lineCount: num(d.lineCount, 30),
      accentEvery: num(d.accentEvery, 5),
      accentColor: d.accentColor || null,
      background: d.background || null,
      still: d.still === 'true'
    };

    var cs = getComputedStyle(canvas);
    function token(name, fallback) {
      return (cs.getPropertyValue(name) || '').trim() || fallback;
    }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function surface() {
      if (!canvas.clientWidth) return null;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      var ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (p.background !== 'transparent') {
        ctx.fillStyle = p.background || token('--void', '#0c0c0e');
        ctx.fillRect(0, 0, w, h);
      }
      ctx.lineCap = 'round';
      return { ctx: ctx, w: w, h: h };
    }

    function strokeLine(ctx, j, o, a, lw) {
      var isAccent = j % o.accentEvery === 0;
      ctx.strokeStyle = isAccent ? o.accent : o.ink;
      ctx.globalAlpha = Math.max(0, isAccent ? a * 0.55 : a);
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function drawApproach(s, t, o) {
      var ctx = s.ctx, w = s.w, h = s.h;
      var period = 16, cx = w * o.cxf, cy = h * o.cyf;
      for (var j = 0; j < o.n; j++) {
        var u = ((t / period) + j / o.n) % 1;
        var sc = 0.05 * Math.pow(52, u);
        var a = Math.pow(Math.sin(Math.PI * u), 1.5) * o.peak;
        if (a < 0.002) continue;
        var flap = 0.86 + 0.14 * Math.sin(t * 0.5 + j * 0.5);
        ctx.beginPath();
        for (var i = 0; i <= 96; i++) {
          var xn = -1.6 + 3.2 * (i / 96);
          var X = cx + xn * w * 0.66 * o.sx * sc;
          var Y = cy - wing(xn) * flap * h * 1.15 * o.sy * sc;
          if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        }
        strokeLine(ctx, j, o, a, Math.min(1.6, 0.6 + sc * 0.45));
      }
    }

    function drawDownstroke(s, t, o) {
      var ctx = s.ctx, w = s.w, h = s.h;
      var cx = w * o.cxf;
      for (var j = 0; j < o.n; j++) {
        var v = ((j / o.n) + t * 0.016) % 1;
        var spread = 0.55 + 1.5 * v;
        var lift = (0.5 - v) * h * 0.5 * o.sy;
        var a = Math.pow(Math.sin(Math.PI * v), 1.1) * o.peak;
        if (a < 0.002) continue;
        var sway = Math.sin(t * 0.22 + v * 3.4) * 0.06;
        ctx.beginPath();
        for (var i = 0; i <= 110; i++) {
          var xn = -1.9 + 3.8 * (i / 110);
          var X = cx + xn * w * 0.60 * o.sx * spread * (1 + sway);
          var Y = h * o.cyf - (lift + wing(xn) * h * 1.5 * o.sy * (0.55 + 0.75 * v));
          if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        }
        strokeLine(ctx, j, o, a, 1);
      }
    }

    function paint(t) {
      var s = surface();
      if (!s) return false;
      var preset = PRESETS[p.variant] || PRESETS.descent;
      var o = {
        cxf: preset.cxf, cyf: preset.cyf, sx: preset.sx, sy: preset.sy,
        mode: preset.mode, rot: preset.rot,
        peak: p.lineOpacity * preset.alpha,
        n: Math.max(8, Math.round(p.lineCount * preset.count)),
        accent: p.accentColor || token('--goldfinch-wing', '#f0c419'),
        ink: token('--text-1', '#ffffff'),
        accentEvery: Math.max(2, preset.dense ? Math.round(p.accentEvery * 0.6) : p.accentEvery)
      };
      var tt = t * p.speed * preset.speed;
      s.ctx.save();
      if (preset.rot) {
        s.ctx.translate(s.w / 2, s.h / 2);
        s.ctx.rotate(preset.rot);
        s.ctx.translate(-s.w / 2, -s.h / 2);
      }
      if (preset.mode === 'approach') drawApproach(s, tt, o);
      else drawDownstroke(s, tt, o);
      s.ctx.restore();
      return true;
    }

    /* A composed still: the layout must never depend on the loop running. */
    if (reduced || p.still) {
      var freeze = function () { paint(7.4); };
      freeze();
      requestAnimationFrame(freeze);
      window.addEventListener('resize', freeze);
      return;
    }

    var t0 = null;
    (function loop(ts) {
      if (t0 === null) t0 = ts;
      paint((ts - t0) / 1000);
      requestAnimationFrame(loop);
    })(performance.now());
  }

  var fields = document.querySelectorAll('[data-wing-field]');
  if (!fields.length) return;

  /* Full bleed without a stray horizontal scrollbar: 100vw includes the
     classic scrollbar, clientWidth does not. */
  function bleed() {
    document.documentElement.style.setProperty(
      '--bleed', document.documentElement.clientWidth + 'px');
  }
  bleed();
  window.addEventListener('resize', bleed);

  for (var i = 0; i < fields.length; i++) init(fields[i]);
}());
