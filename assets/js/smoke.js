(() => {
  // Centre de l'ouverture dans exhaust.svg (viewBox 160x120) et axe de sortie de l'embout.
  const MOUTH = { x: 118 / 160, y: 38 / 120 };
  const AXIS = { x: Math.cos(-38.6 * Math.PI / 180), y: Math.sin(-38.6 * Math.PI / 180) };

  const exhausts = ['left', 'right'].map((side) => {
    const img = document.createElement('img');
    img.src = 'assets/img/exhaust.svg';
    img.alt = '';
    img.className = `exhaust exhaust--${side}`;
    img.setAttribute('aria-hidden', 'true');
    return { side, img };
  });
  document.body.prepend(...exhausts.map((e) => e.img));

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX = 260;
  const SCROLL_THRESHOLD = 1.2; // px/ms
  const canvas = document.createElement('canvas');
  canvas.className = 'smoke-layer';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  const rand = (a, b) => a + Math.random() * (b - a);

  function makeSprite() {
    const s = document.createElement('canvas');
    s.width = s.height = 256;
    const c = s.getContext('2d');
    for (let i = 0; i < 40; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * 70;
      const x = 128 + Math.cos(ang) * dist;
      const y = 128 + Math.sin(ang) * dist;
      const r = rand(25, 60);
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(225,225,230,${rand(0.15, 0.35)})`);
      g.addColorStop(1, 'rgba(225,225,230,0)');
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    c.globalCompositeOperation = 'destination-in';
    const m = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(0.6, 'rgba(0,0,0,0.8)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = m;
    c.fillRect(0, 0, 256, 256);
    return s;
  }
  const sprites = Array.from({ length: 4 }, makeSprite);

  let w = 0, h = 0, dpr = 1;
  const emitters = { left: null, right: null };

  function measure() {
    for (const { side, img } of exhausts) {
      const r = img.getBoundingClientRect();
      const fx = side === 'left' ? MOUTH.x : 1 - MOUTH.x;
      emitters[side] = {
        x: r.left + fx * r.width,
        y: r.top + MOUTH.y * r.height,
        dx: side === 'left' ? AXIS.x : -AXIS.x,
        dy: AXIS.y
      };
    }
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    measure();
  }
  resize();
  addEventListener('resize', resize);
  exhausts.forEach((e) => e.img.addEventListener('load', measure));

  const particles = [];
  const pending = { left: 0, right: 0 };
  let running = false;
  let last = 0;

  function emit(side) {
    const e = emitters[side];
    if (!e) return;
    if (particles.length >= MAX) particles.shift();
    const spread = rand(-25, 25) * Math.PI / 180;
    const cos = Math.cos(spread), sin = Math.sin(spread);
    const dx = e.dx * cos - e.dy * sin;
    const dy = e.dx * sin + e.dy * cos;
    const speed = rand(250, 450);
    particles.push({
      x: e.x, y: e.y,
      vx: dx * speed, vy: dy * speed,
      r: rand(40, 70),
      maxR: rand(260, 380),
      peak: rand(0.55, 0.75),
      life: rand(2.2, 3),
      age: 0,
      rot: rand(0, Math.PI * 2),
      spin: rand(-0.4, 0.4),
      sprite: sprites[(Math.random() * sprites.length) | 0]
    });
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(tick);
  }

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    for (const side of ['left', 'right']) {
      const n = Math.min(pending[side], 4);
      for (let i = 0; i < n; i++) emit(side);
      pending[side] -= n;
    }

    ctx.clearRect(0, 0, w, h);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        particles.splice(i, 1);
        continue;
      }
      const t = p.age / p.life;
      const drag = 1 - 2.2 * dt;
      p.vx *= drag;
      p.vy = p.vy * drag - 30 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      const ease = 1 - Math.pow(1 - t, 3);
      const size = p.r + (p.maxR - p.r) * ease;
      const alpha = t < 0.04 ? p.peak * (t / 0.04) : p.peak * Math.pow(1 - t, 1.2);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.drawImage(p.sprite, -size, -size, size * 2, size * 2);
      ctx.restore();
    }

    if (particles.length || pending.left || pending.right) {
      requestAnimationFrame(tick);
    } else {
      running = false;
      ctx.clearRect(0, 0, w, h);
    }
  }

  addEventListener('pointerdown', () => {
    pending.left += 22 + ((Math.random() * 7) | 0);
    pending.right += 22 + ((Math.random() * 7) | 0);
    start();
  }, { passive: true });

  let lastY = scrollY;
  let lastT = performance.now();

  addEventListener('scroll', () => {
    const now = performance.now();
    const speed = Math.abs(scrollY - lastY) / Math.max(now - lastT, 1);
    lastY = scrollY;
    lastT = now;
    if (speed < SCROLL_THRESHOLD) return;
    const n = Math.min(10, Math.ceil(speed * 2));
    pending.left = Math.max(pending.left, n);
    pending.right = Math.max(pending.right, n);
    start();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      particles.length = 0;
      pending.left = pending.right = 0;
      ctx.clearRect(0, 0, w, h);
    }
  });
})();
