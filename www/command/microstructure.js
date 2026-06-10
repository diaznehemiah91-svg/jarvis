/* ════════════════════════════════════════════════════════════════════════
   JARVIS Microstructure — 100% free, client-side market-microstructure sim.

   Premium order-flow analytics (Cumulative Volume Delta, order-book
   absorption / imbalance) normally cost a fortune in data fees. This module
   generates plausible, deterministic-ish synthetic flow seeded by a ticker's
   conviction so the visuals correlate with the rest of the dashboard — no
   API keys, no websockets, no cost.

     MicroSim.create('cvdCanvas', { bias: net_score })
        → { start(), stop(), imbalance(), destroy() }

   • CVD delta line: a momentum random-walk drawn on a scrolling canvas, the
     line glows neon-green when delta is rising, hot-coral when falling.
   • Order-book imbalance: a 0..1 bid-share that drifts and occasionally
     prints sudden "absorption blocks" — consumed by the dual-color OBI bar.
   ════════════════════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';

  const LONG  = '#00E676';   // bids / bullish delta
  const SHORT = '#FF5252';   // asks / bearish delta
  const CYBER = '#00E5FF';   // baseline / grid

  function createSim(canvasId, opts) {
    opts = opts || {};
    const canvas = document.getElementById(canvasId);
    const bias = Math.max(-1, Math.min(1, opts.bias || 0));   // -1..1 conviction seed
    const onImbalance = opts.onImbalance || null;

    // ── state ────────────────────────────────────────────────────────────
    const MAX = 160;                 // points kept on screen
    let cvd = 0;                     // cumulative volume delta
    let vel = bias * 0.4;            // delta velocity (seeded by conviction)
    const hist = [];                 // recent CVD samples
    let imb = 0.5 + bias * 0.12;     // bid share 0..1 (seeded slightly by bias)
    let imbTarget = imb;
    let absorbTimer = 0;
    let raf = null, lastDraw = 0, lastTick = 0;
    let ctx = canvas ? canvas.getContext('2d') : null;

    // seed history flat-ish so the line starts mid-canvas
    for (let i = 0; i < MAX; i++) hist.push(0);

    function rnd(a, b) { return a + Math.random() * (b - a); }

    // ── one simulation step (advances CVD + imbalance) ────────────────────
    function step() {
      // CVD: mean-reverting momentum walk with a conviction drift
      const drift = bias * 0.18;
      vel += rnd(-0.22, 0.22) + drift * 0.15;
      vel *= 0.92;                                  // damping
      cvd += vel;
      cvd *= 0.997;                                 // gentle pull toward zero
      hist.push(cvd);
      while (hist.length > MAX) hist.shift();

      // Order-book imbalance: drift toward a target, retarget periodically,
      // and occasionally fire an "absorption block" (sharp one-sided shift).
      absorbTimer--;
      if (absorbTimer <= 0) {
        absorbTimer = Math.floor(rnd(18, 46));
        // bias nudges the centre of gravity; blocks can swing hard either way
        const block = Math.random() < 0.30;
        const centre = 0.5 + bias * 0.14;
        imbTarget = block
          ? (Math.random() < (0.5 + bias * 0.3) ? rnd(0.66, 0.9) : rnd(0.1, 0.34))
          : Math.max(0.12, Math.min(0.88, centre + rnd(-0.18, 0.18)));
      }
      imb += (imbTarget - imb) * 0.12;
      if (onImbalance) onImbalance(imb);
    }

    // ── render the CVD line ───────────────────────────────────────────────
    function draw() {
      if (!ctx) return;
      const W = canvas.width = canvas.clientWidth * (w.devicePixelRatio || 1);
      const H = canvas.height = canvas.clientHeight * (w.devicePixelRatio || 1);
      ctx.clearRect(0, 0, W, H);

      // scale to fit
      let lo = Infinity, hi = -Infinity;
      for (const v of hist) { if (v < lo) lo = v; if (v > hi) hi = v; }
      const pad = (hi - lo) * 0.18 || 1;
      lo -= pad; hi += pad;
      const span = hi - lo || 1;
      const x = i => (i / (MAX - 1)) * W;
      const y = v => H - ((v - lo) / span) * H;

      // zero baseline (cyber cyan, dashed)
      ctx.strokeStyle = 'rgba(0,229,255,0.22)';
      ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
      const yz = y(0);
      ctx.beginPath(); ctx.moveTo(0, yz); ctx.lineTo(W, yz); ctx.stroke();
      ctx.setLineDash([]);

      // delta line — color by current slope
      const rising = hist[hist.length - 1] >= hist[hist.length - 6];
      const col = rising ? LONG : SHORT;
      // area fill under the line
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, (rising ? 'rgba(0,230,118,0.28)' : 'rgba(255,82,82,0.28)'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.moveTo(x(0), y(hist[0]));
      for (let i = 1; i < hist.length; i++) ctx.lineTo(x(i), y(hist[i]));
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();

      // the glowing stroke
      ctx.beginPath();
      ctx.moveTo(x(0), y(hist[0]));
      for (let i = 1; i < hist.length; i++) ctx.lineTo(x(i), y(hist[i]));
      ctx.shadowColor = col; ctx.shadowBlur = 9 * (w.devicePixelRatio || 1);
      ctx.strokeStyle = col; ctx.lineWidth = 2 * (w.devicePixelRatio || 1);
      ctx.lineJoin = 'round'; ctx.stroke();
      ctx.shadowBlur = 0;

      // leading dot
      const lx = x(hist.length - 1), ly = y(hist[hist.length - 1]);
      ctx.beginPath(); ctx.arc(lx, ly, 3 * (w.devicePixelRatio || 1), 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (canvas && canvas.offsetParent === null) return;   // hidden → idle
      if (now - lastTick > 110) { step(); lastTick = now; }
      if (now - lastDraw > 33)  { draw(); lastDraw = now; }
    }

    return {
      start() { if (!raf) { lastTick = lastDraw = 0; raf = requestAnimationFrame(loop); } },
      stop()  { if (raf) { cancelAnimationFrame(raf); raf = null; } },
      imbalance() { return imb; },
      cvd() { return cvd; },
      destroy() { this.stop(); ctx = null; },
    };
  }

  w.MicroSim = { create: createSim, LONG, SHORT, CYBER };
})(window);
