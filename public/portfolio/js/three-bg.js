/*
  Theme-aware hero background (no Three.js).
  Draws soft floating blobs + subtle sparkles on a 2D canvas.
  API: window.ThreeBG.init(canvas) -> { destroy() }

  Note: designed to stay readable in BOTH light and dark.
*/
(function () {
  function rand(min, max) { return Math.random() * (max - min) + min; }

  function init(canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;

    let w = 0, h = 0, raf = 0;
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const isDark = () => document.documentElement.classList.contains("theme-dark");

    const SPEED = 0.35; // slower motion (user setting)


    // Soft blobs (slow drift)
    const blobs = Array.from({ length: 6 }).map(() => ({
      x: rand(0, 1),
      y: rand(0, 1),
      r: rand(0.18, 0.34),
      vx: rand(-0.014, 0.014) * SPEED,
      vy: rand(-0.011, 0.011) * SPEED,
      hue: rand(0, 360),
    }));

    // Subtle sparkles (very low contrast)
    const sparks = Array.from({ length: 65 }).map(() => ({
      x: rand(0, 1),
      y: rand(0, 1),
      a: rand(0.03, 0.14),
      s: rand(0.6, 1.6),
      t: rand(0, Math.PI * 2),
    }));

    function resize() {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const dark = isDark();

      // Blobs: soft wash (keep it elegant)
      ctx.globalCompositeOperation = dark ? "screen" : "multiply";
      blobs.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -0.2 || b.x > 1.2) b.vx *= -1;
        if (b.y < -0.2 || b.y > 1.2) b.vy *= -1;

        const cx = b.x * w;
        const cy = b.y * h;
        const rr = b.r * Math.min(w, h);

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);

        // Theme tuning: lower saturation/alpha in dark for a softer look.
        const sat = dark ? 72 : 78;
        const l = dark ? 58 : 70;
        const a = dark ? 0.20 : 0.32;

        g.addColorStop(0, `hsla(${b.hue}, ${sat}%, ${l}%, ${a})`);
        g.addColorStop(1, `hsla(${b.hue}, ${sat}%, ${l}%, 0.0)`);

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fill();
      });

      // Sparkles: minimal, to avoid "glitter" (especially in dark)
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = dark ? "rgba(245,245,246,0.07)" : "rgba(24,24,27,0.06)";
      sparks.forEach((s) => {
        s.t += 0.009 * SPEED;
        const x = (s.x * w) + Math.sin(s.t) * 8;
        const y = (s.y * h) + Math.cos(s.t * 1.3) * 8;
        ctx.globalAlpha = s.a;
        ctx.beginPath();
        ctx.arc(x, y, s.s, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    raf = requestAnimationFrame(draw);

    return {
      destroy() {
        cancelAnimationFrame(raf);
        ro.disconnect();
      },
    };
  }

  window.ThreeBG = { init };
})();
