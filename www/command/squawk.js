/* ════════════════════════════════════════════════════════════════════════
   JARVIS Squawk Box — synthetic AI voice + tactical chime.

   100% free: a low-latency digitized chime synthesized with the Web Audio
   API, followed by a clean Web-Speech-API announcement. Used for breaking
   headlines and high-conviction (STRONG BUY) ticker alerts.

   Muting is persisted in localStorage and gates BOTH the chime and the
   spoken announcement. Controlled by the toggle in the ⚙ KEYS panel.
   ════════════════════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';

  const LS_KEY = 'jarvis_squawk';
  let enabled = (localStorage.getItem(LS_KEY) ?? '1') !== '0';
  let actx = null;

  function ensureCtx() {
    if (!actx) {
      const AC = w.AudioContext || w.webkitAudioContext;
      if (AC) actx = new AC();
    }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }

  // A short two-tone "terminal" chime via oscillators + gain envelope.
  function chime(kind) {
    const ctx = ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    // bullish = rising interval, bearish = falling, neutral = flat ping
    const tones = kind === 'bear' ? [740, 560]
                : kind === 'bull' ? [660, 990]
                : [880, 880];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      g.gain.setValueAtTime(0.0001, now + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.22, now + i * 0.09 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.16);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.18);
    });
  }

  // Chime, then speak. kind ∈ 'bull' | 'bear' | 'neutral' tunes the chime.
  function announce(text, kind) {
    if (!enabled) return;
    chime(kind);
    if (w.Voice && typeof Voice.speak === 'function') {
      // small delay so the chime is heard before the voice starts
      setTimeout(() => Voice.speak(text, { rate: 1.04, pitch: 0.95 }), 240);
    }
  }

  function setEnabled(on) {
    enabled = !!on;
    localStorage.setItem(LS_KEY, enabled ? '1' : '0');
    if (w.Voice && typeof Voice.setMuted === 'function') Voice.setMuted(!enabled);
    if (enabled) ensureCtx();   // unlock audio on user gesture (toggle click)
  }

  // Reflect persisted state into Voice on load.
  if (w.Voice && typeof Voice.setMuted === 'function') Voice.setMuted(!enabled);

  w.Squawk = {
    chime, announce, setEnabled,
    get enabled() { return enabled; },
  };
})(window);
