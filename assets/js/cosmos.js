/* ════════════════════════════════════════════════════
   O Arcano — Cosmos Background
   Stars + floating orbs + constellations + parallax
   ════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const canvas = document.getElementById('cosmos');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W, H, dpr, raf;
  let mx = 0, my = 0;       // mouse position normalized -1..1
  let tx = 0, ty = 0;       // smoothed parallax target

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ── STARS (3 parallax depths) ─────────────────── */
  const stars = [];
  function initStars() {
    stars.length = 0;
    const total = Math.min(380, Math.round(W * H / 4800));
    for (let i = 0; i < total; i++) {
      const depth = Math.random();
      const bright = Math.random() > 0.93;
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        depth,                                    // 0..1 (closer = bigger parallax)
        r: bright ? 1.1 + Math.random() * 0.9 : 0.2 + depth * 1.1,
        a: bright ? 0.7 + Math.random() * 0.3 : 0.15 + depth * 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.012,
        cross: bright && Math.random() > 0.5,
        hue: Math.random() > 0.85 ? (Math.random() > 0.5 ? 270 : 38) : null,
      });
    }
  }

  /* ── FLOATING ORBS (mystical lights) ───────────── */
  const orbs = [];
  function initOrbs() {
    orbs.length = 0;
    const palettes = [
      { hue: 268, sat: 78, lum: 62 },  // primary purple
      { hue: 285, sat: 72, lum: 60 },  // violet
      { hue: 248, sat: 65, lum: 58 },  // indigo
      { hue: 38,  sat: 88, lum: 58 },  // gold
      { hue: 195, sat: 80, lum: 60 },  // cyan
    ];
    const count = W < 900 ? 7 : 11;
    for (let i = 0; i < count; i++) {
      const p = palettes[i % palettes.length];
      const isAccent = p.hue === 38 || p.hue === 195;
      orbs.push({
        x: Math.random() * W,
        y: Math.random() * H,
        baseX: 0, baseY: 0,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.14,
        r: isAccent ? 1.6 + Math.random() * 1.2 : 1.8 + Math.random() * 1.6,
        glow: isAccent ? 18 + Math.random() * 8 : 26 + Math.random() * 14,
        a: isAccent ? 0.6 + Math.random() * 0.25 : 0.45 + Math.random() * 0.3,
        hue: p.hue, sat: p.sat, lum: p.lum,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.012,
        depth: 0.4 + Math.random() * 0.6,
      });
    }
  }

  /* ── NEBULA ────────────────────────────────────── */
  const nebulae = [];
  function initNebula() {
    nebulae.length = 0;
    const seeds = [
      { hue: 268, x: 0.18, y: 0.30, r: 320 },
      { hue: 285, x: 0.78, y: 0.24, r: 280 },
      { hue: 248, x: 0.55, y: 0.78, r: 360 },
      { hue: 295, x: 0.05, y: 0.85, r: 240 },
      { hue: 220, x: 0.92, y: 0.65, r: 260 },
    ];
    for (const s of seeds) {
      nebulae.push({
        x: s.x * W, y: s.y * H,
        baseX: s.x * W, baseY: s.y * H,
        vx: (Math.random() - 0.5) * 0.04,
        vy: (Math.random() - 0.5) * 0.03,
        r: s.r,
        hue: s.hue,
        a: 0.05 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  /* ── DRAW LOOP ─────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Smooth mouse parallax
    tx += (mx - tx) * 0.04;
    ty += (my - ty) * 0.04;

    /* ── nebulae ── */
    for (const n of nebulae) {
      n.phase += 0.003;
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -n.r) n.x = W + n.r;
      if (n.x > W + n.r) n.x = -n.r;
      if (n.y < -n.r) n.y = H + n.r;
      if (n.y > H + n.r) n.y = -n.r;
      const breathe = 0.85 + 0.15 * Math.sin(n.phase);
      const px = n.x + tx * 18;
      const py = n.y + ty * 14;
      const g = ctx.createRadialGradient(px, py, 0, px, py, n.r);
      g.addColorStop(0,    `hsla(${n.hue}, 70%, 55%, ${n.a * breathe})`);
      g.addColorStop(0.5,  `hsla(${n.hue}, 60%, 48%, ${n.a * breathe * 0.4})`);
      g.addColorStop(1,    `hsla(${n.hue}, 55%, 45%, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    /* ── stars ── */
    for (const s of stars) {
      s.phase += s.speed;
      const alpha = s.a * (0.6 + 0.4 * Math.sin(s.phase));
      const px = s.x + tx * s.depth * 22;
      const py = s.y + ty * s.depth * 18;
      const color = s.hue
        ? `hsla(${s.hue}, 70%, 70%, ${alpha})`
        : `rgba(225, 215, 250, ${alpha})`;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.cross && alpha > 0.55) {
        ctx.strokeStyle = color.replace(/[\d.]+\)$/, (alpha * 0.55) + ')');
        ctx.lineWidth = 0.7;
        const c = s.r * 4;
        ctx.beginPath(); ctx.moveTo(px - c, py); ctx.lineTo(px + c, py); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, py - c); ctx.lineTo(px, py + c); ctx.stroke();
      }
    }

    /* ── orbs (update positions) ── */
    for (const o of orbs) {
      o.x += o.vx;
      o.y += o.vy;
      // Soft wall bounce
      if (o.x < -40) o.x = W + 40;
      if (o.x > W + 40) o.x = -40;
      if (o.y < -40) o.y = H + 40;
      if (o.y > H + 40) o.y = -40;
      o.phase += o.pulseSpeed;
    }

    /* ── constellation lines (between near orbs) ── */
    const maxDist = 280;
    ctx.lineWidth = 0.6;
    for (let i = 0; i < orbs.length; i++) {
      const a = orbs[i];
      const ax = a.x + tx * a.depth * 30;
      const ay = a.y + ty * a.depth * 24;
      for (let j = i + 1; j < orbs.length; j++) {
        const b = orbs[j];
        const bx = b.x + tx * b.depth * 30;
        const by = b.y + ty * b.depth * 24;
        const dx = ax - bx, dy = ay - by;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < maxDist) {
          const alpha = (1 - d / maxDist) * 0.16;
          const grad = ctx.createLinearGradient(ax, ay, bx, by);
          grad.addColorStop(0, `hsla(${a.hue}, 60%, 65%, ${alpha})`);
          grad.addColorStop(1, `hsla(${b.hue}, 60%, 65%, ${alpha})`);
          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
    }

    /* ── orbs (draw glow + core) ── */
    for (const o of orbs) {
      const px = o.x + tx * o.depth * 30;
      const py = o.y + ty * o.depth * 24;
      const pulse = 0.78 + 0.22 * Math.sin(o.phase);
      // outer glow
      const g = ctx.createRadialGradient(px, py, 0, px, py, o.glow);
      g.addColorStop(0,   `hsla(${o.hue}, ${o.sat}%, ${o.lum}%, ${o.a * pulse * 0.7})`);
      g.addColorStop(0.4, `hsla(${o.hue}, ${o.sat}%, ${o.lum}%, ${o.a * pulse * 0.25})`);
      g.addColorStop(1,   `hsla(${o.hue}, ${o.sat}%, ${o.lum}%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, o.glow, 0, Math.PI * 2);
      ctx.fill();
      // bright core
      ctx.beginPath();
      ctx.arc(px, py, o.r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${o.hue}, ${o.sat}%, ${o.lum + 18}%, ${0.8 * pulse})`;
      ctx.fill();
    }

    if (!reduced) raf = requestAnimationFrame(draw);
  }

  /* ── EVENTS ────────────────────────────────────── */
  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / W) * 2 - 1;
    my = (e.clientY / H) * 2 - 1;
  }, { passive: true });

  window.addEventListener('blur', () => { mx = 0; my = 0; });

  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      cancelAnimationFrame(raf);
      resize();
      initStars();
      initOrbs();
      initNebula();
      draw();
    }, 120);
  });

  resize();
  initStars();
  initOrbs();
  initNebula();
  draw();
})();
