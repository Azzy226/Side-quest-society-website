/* Living background: twinkling stars, drifting fireflies, parallax mountains and pines. */
(function () {
  const world = document.getElementById('world');
  const canvas = document.getElementById('fx');
  if (!world || !canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, scrollY = 0;

  // ---- Mountain / hill silhouettes (SVG, regenerated on resize) ----
  const NS = 'http://www.w3.org/2000/svg';
  let svg = null;
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
  function ridge(r, baseY, amp, step, roughness) {
    let d = 'M0 ' + H + ' L0 ' + baseY;
    let y = baseY;
    for (let x = 0; x <= W + step; x += step) {
      y = baseY + (r() - 0.5) * amp + Math.sin(x / (W / 3)) * amp * 0.4 * roughness;
      d += ' L' + x + ' ' + y.toFixed(1);
    }
    return d + ' L' + W + ' ' + H + ' Z';
  }
  function pines(r, baseY, count, size, color) {
    let d = '';
    for (let i = 0; i < count; i++) {
      const x = r() * W, h = size * (0.6 + r() * 0.8), w = h * 0.38;
      const y = baseY + (r() - 0.5) * 14;
      d += 'M' + (x - w) + ' ' + y + ' L' + x + ' ' + (y - h) + ' L' + (x + w) + ' ' + y + 'Z ';
    }
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d); p.setAttribute('fill', color);
    return p;
  }
  function buildScenery() {
    if (svg) svg.remove();
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    const layers = [
      { color: '#1b2c4a', base: H * 0.62, amp: H * 0.16, speed: 0.04, seed: 7 },
      { color: '#15233b', base: H * 0.72, amp: H * 0.12, speed: 0.08, seed: 21 },
      { color: '#0f2a22', base: H * 0.84, amp: H * 0.08, speed: 0.14, seed: 33, trees: '#0a1e18' },
      { color: '#0a1d16', base: H * 0.93, amp: H * 0.05, speed: 0.22, seed: 45, trees: '#06130f' }
    ];
    layers.forEach((L) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'layer');
      g.dataset.speed = L.speed;
      const r = rng(L.seed);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', ridge(r, L.base, L.amp, Math.max(40, W / 28), 1));
      path.setAttribute('fill', L.color);
      g.appendChild(path);
      if (L.trees) g.appendChild(pines(r, L.base + 6, Math.round(W / 38), H * 0.07, L.trees));
      svg.appendChild(g);
    });
    world.insertBefore(svg, canvas);
  }

  // ---- Canvas particles ----
  let stars = [], flies = [];
  function seed() {
    stars = Array.from({ length: Math.round(W / 9) }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.6,
      r: Math.random() * 1.3 + 0.3, p: Math.random() * 6.28, s: Math.random() * 1.5 + 0.5
    }));
    flies = Array.from({ length: Math.max(14, Math.round(W / 55)) }, () => ({
      x: Math.random() * W, y: H * (0.4 + Math.random() * 0.55),
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.25,
      p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.2, r: 1.6 + Math.random() * 1.8
    }));
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildScenery(); seed(); draw(0);
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(s.p + t * 0.001 * s.s));
      ctx.fillStyle = 'rgba(255,248,225,' + a.toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    for (const f of flies) {
      if (!reduce) {
        f.x += f.vx + Math.sin(t * 0.0007 * f.s + f.p) * 0.25;
        f.y += f.vy + Math.cos(t * 0.0009 * f.s + f.p) * 0.2;
        if (f.x < -20) f.x = W + 20; if (f.x > W + 20) f.x = -20;
        if (f.y < H * 0.3) f.vy = Math.abs(f.vy); if (f.y > H) f.vy = -Math.abs(f.vy);
      }
      const glow = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.002 * f.s + f.p));
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 7);
      g.addColorStop(0, 'rgba(255,230,140,' + (0.9 * glow).toFixed(2) + ')');
      g.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 7, 0, 6.283); ctx.fill();
    }
  }

  function parallax() {
    if (!svg) return;
    svg.querySelectorAll('.layer').forEach((g) => {
      g.style.transform = 'translateY(' + (-scrollY * g.dataset.speed).toFixed(1) + 'px)';
    });
  }
  window.addEventListener('scroll', () => { scrollY = window.scrollY; if (!reduce) parallax(); }, { passive: true });
  window.addEventListener('resize', resize);

  function loop(t) { draw(t); requestAnimationFrame(loop); }
  resize();
  if (!reduce) requestAnimationFrame(loop);
})();
