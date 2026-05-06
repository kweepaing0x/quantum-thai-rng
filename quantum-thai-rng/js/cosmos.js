// ── COSMOS BACKGROUND ENGINE ──
(function() {
  const canvas = document.getElementById('cosmos');
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], nebulaClouds = [], wormhole = { angle: 0 };
  let animFrame;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initStars();
    initNebula();
  }

  // ── STARS ──
  function initStars() {
    stars = [];
    const count = Math.floor((W * H) / 3000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.6 + 0.2,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.003 + 0.001,
        phase: Math.random() * Math.PI * 2,
        color: starColor(),
        twinkleSpeed: Math.random() * 0.02 + 0.005
      });
    }
  }

  function starColor() {
    const palette = [
      'rgba(200,220,255,',
      'rgba(255,240,200,',
      'rgba(180,255,220,',
      'rgba(220,180,255,',
      'rgba(150,200,255,'
    ];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  // ── NEBULA CLOUDS ──
  function initNebula() {
    nebulaClouds = [];
    const clouds = [
      { x: W * 0.15, y: H * 0.2,  rx: 300, ry: 180, r: 0, g: 60, b: 180, a: 0.06 },
      { x: W * 0.8,  y: H * 0.35, rx: 250, ry: 200, r: 120, g: 0, b: 200, a: 0.05 },
      { x: W * 0.5,  y: H * 0.75, rx: 350, ry: 150, r: 0, g: 160, b: 100, a: 0.05 },
      { x: W * 0.25, y: H * 0.65, rx: 200, ry: 200, r: 200, g: 50, b: 50, a: 0.04 },
      { x: W * 0.85, y: H * 0.8,  rx: 280, ry: 160, r: 0, g: 120, b: 220, a: 0.05 }
    ];
    nebulaClouds = clouds.map(c => ({ ...c, vx: (Math.random()-0.5)*0.08, vy: (Math.random()-0.5)*0.06, phase: Math.random()*Math.PI*2 }));
  }

  // ── SHOOTING STARS ──
  let shooters = [];
  function spawnShooter() {
    if (Math.random() > 0.004) return;
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
    shooters.push({
      x: Math.random() * W * 0.7,
      y: Math.random() * H * 0.4,
      vx: Math.cos(angle) * (6 + Math.random() * 6),
      vy: Math.sin(angle) * (6 + Math.random() * 6),
      len: 80 + Math.random() * 120,
      alpha: 1,
      fade: 0.015 + Math.random() * 0.02
    });
  }

  function drawShooters() {
    shooters = shooters.filter(s => s.alpha > 0);
    shooters.forEach(s => {
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 8, s.y - s.vy * 8);
      grad.addColorStop(0, `rgba(255,255,255,${s.alpha})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      s.x += s.vx; s.y += s.vy;
      s.alpha -= s.fade;
    });
  }

  // ── WORMHOLE ──
  let wormholeActive = false, wormX, wormY;
  function drawWormhole(t) {
    if (!wormholeActive) return;
    const rings = 18;
    for (let i = rings; i >= 1; i--) {
      const ratio = i / rings;
      const r = ratio * 90;
      const alpha = (1 - ratio) * 0.25;
      const hue = (t * 30 + i * 20) % 360;
      ctx.beginPath();
      ctx.ellipse(wormX, wormY, r, r * 0.38, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${hue},100%,70%,${alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // inner glow
    const g = ctx.createRadialGradient(wormX, wormY, 0, wormX, wormY, 50);
    g.addColorStop(0, `rgba(100,200,255,0.15)`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(wormX, wormY, 50, 20, 0, 0, Math.PI*2);
    ctx.fill();
  }

  // Randomly show wormhole
  setInterval(() => {
    wormholeActive = Math.random() > 0.55;
    if (wormholeActive) {
      wormX = W * (0.1 + Math.random() * 0.8);
      wormY = H * (0.1 + Math.random() * 0.8);
      setTimeout(() => { wormholeActive = false; }, 3000 + Math.random() * 4000);
    }
  }, 8000);

  // ── AURORA BANDS ──
  let aurora = { phase: 0 };
  function drawAurora(t) {
    const bands = 4;
    for (let b = 0; b < bands; b++) {
      const yBase = H * (0.15 + b * 0.18);
      const amp = 30 + b * 10;
      ctx.beginPath();
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= W; x += 8) {
        const y = yBase + Math.sin(x / 180 + t * 0.4 + b * 1.2) * amp
                        + Math.sin(x / 90 + t * 0.2 + b) * (amp * 0.4);
        ctx.lineTo(x, y);
      }
      const hue = (t * 15 + b * 40) % 360;
      ctx.strokeStyle = `hsla(${hue},80%,60%,0.025)`;
      ctx.lineWidth = 18;
      ctx.stroke();
    }
  }

  // ── MAIN DRAW ──
  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.016;

    // Deep space base
    ctx.fillStyle = '#000008';
    ctx.fillRect(0, 0, W, H);

    // Aurora
    drawAurora(t);

    // Nebula clouds
    nebulaClouds.forEach(c => {
      c.x += c.vx; c.y += c.vy;
      if (c.x < -300 || c.x > W+300) c.vx *= -1;
      if (c.y < -200 || c.y > H+200) c.vy *= -1;
      const pulse = 1 + Math.sin(t * 0.3 + c.phase) * 0.15;
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.rx * pulse);
      g.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${c.a * 1.5})`);
      g.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},${c.a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.scale(1, c.ry / c.rx);
      ctx.beginPath();
      ctx.arc(c.x, c.y * (c.rx / c.ry), c.rx * pulse, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    });

    // Stars
    stars.forEach(s => {
      s.phase += s.twinkleSpeed;
      const twinkle = 0.4 + Math.sin(s.phase) * 0.3;
      const glow = s.r * (1 + Math.sin(s.phase * 0.7) * 0.4);
      // outer glow
      if (s.r > 1) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, glow * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = s.color + (twinkle * 0.15) + ')';
        ctx.fill();
      }
      // core
      ctx.beginPath();
      ctx.arc(s.x, s.y, glow, 0, Math.PI * 2);
      ctx.fillStyle = s.color + (s.alpha * twinkle) + ')';
      ctx.fill();
    });

    // Wormhole
    drawWormhole(t);

    // Shooting stars
    spawnShooter();
    drawShooters();

    // Milky way band
    const mw = ctx.createLinearGradient(0, H*0.3, W, H*0.7);
    mw.addColorStop(0, 'rgba(100,150,255,0)');
    mw.addColorStop(0.3, 'rgba(100,150,255,0.018)');
    mw.addColorStop(0.5, 'rgba(180,200,255,0.025)');
    mw.addColorStop(0.7, 'rgba(100,150,255,0.018)');
    mw.addColorStop(1, 'rgba(100,150,255,0)');
    ctx.fillStyle = mw;
    ctx.fillRect(0, 0, W, H);

    animFrame = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();

  // Mouse parallax on stars
  document.addEventListener('mousemove', e => {
    const mx = (e.clientX / W - 0.5) * 2;
    const my = (e.clientY / H - 0.5) * 2;
    stars.forEach((s, i) => {
      const depth = (i % 3 + 1) * 0.4;
      s.x += mx * depth * 0.08;
      s.y += my * depth * 0.08;
      if (s.x < 0) s.x += W;
      if (s.x > W) s.x -= W;
      if (s.y < 0) s.y += H;
      if (s.y > H) s.y -= H;
    });
  });
})();
