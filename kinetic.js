/* KineticType — the dagil.is design system's motion signature.
   Applied to one element per page, on the largest type only. Transforms only,
   one rAF loop, nothing painted until the pointer moves. Under
   prefers-reduced-motion the headline stays plain static type. */
(function () {
  var host = document.querySelector('[data-kinetic]');
  if (!host) return;

  var text = host.textContent.trim();
  host.setAttribute('aria-label', text);

  var words = text.split(/\s+/);
  host.textContent = '';
  words.forEach(function (word) {
    var w = document.createElement('span');
    w.className = 'kt-word';
    w.setAttribute('aria-hidden', 'true');
    Array.from(word).forEach(function (ch) {
      var c = document.createElement('span');
      c.className = 'kt-char';
      c.textContent = ch;
      w.appendChild(c);
    });
    host.appendChild(w);
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var chars = Array.prototype.slice.call(host.querySelectorAll('.kt-char'));
  var px = -9999, py = -9999, raf = 0, running = false;

  function frame() {
    var hostRect = host.getBoundingClientRect();
    var reach = Math.max(160, hostRect.height * 1.1);
    for (var i = 0; i < chars.length; i++) {
      var s = chars[i];
      var r = s.getBoundingClientRect();
      var dx = px - (r.left + r.width / 2);
      var dy = py - (r.top + r.height / 2);
      var k = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / reach);
      s.style.transform = 'translateY(' + (-14 * k).toFixed(2) + 'px)';
      s.style.opacity = String(0.62 + 0.38 * Math.max(k, 0.28));
    }
    running = false;
  }

  function schedule() {
    if (!running) { running = true; raf = requestAnimationFrame(frame); }
  }

  window.addEventListener('pointermove', function (e) {
    px = e.clientX; py = e.clientY; schedule();
  }, { passive: true });

  window.addEventListener('pointerleave', function () {
    px = -9999; py = -9999; schedule();
  });

  schedule();
}());
