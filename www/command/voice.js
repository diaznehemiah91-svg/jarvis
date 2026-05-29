/* ════════════════════════════════════════════════════════════════════
   JARVIS Voice — browser-native speech (Web Speech API)
   Speaks briefings, listens for commands, no Python required.
   ════════════════════════════════════════════════════════════════════ */

const Voice = (() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;
  let recog = null;
  let listening = false;
  let preferredVoice = null;

  // Pick a premium-sounding English voice when available
  function loadVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    preferredVoice =
      voices.find(v => /Google UK English Male/i.test(v.name)) ||
      voices.find(v => /Daniel|Arthur|Microsoft (Guy|Ryan)/i.test(v.name)) ||
      voices.find(v => v.lang === 'en-GB') ||
      voices.find(v => v.lang && v.lang.startsWith('en')) ||
      voices[0] || null;
  }
  if (synth) {
    loadVoice();
    synth.onvoiceschanged = loadVoice;
  }

  function speak(text, { rate = 1.02, pitch = 0.95 } = {}) {
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (preferredVoice) u.voice = preferredVoice;
    u.rate = rate; u.pitch = pitch; u.volume = 1;
    synth.speak(u);
  }

  function setHud(open, text) {
    const hud = document.getElementById('voiceHud');
    const tr = document.getElementById('voiceTranscript');
    if (!hud) return;
    hud.classList.toggle('open', open);
    if (text != null && tr) tr.textContent = text;
  }

  function startListening(onResult) {
    if (!SR) {
      window.JARVIS?.toast('Voice unavailable', 'This browser has no Speech Recognition. Use Chrome.', 'warn');
      return;
    }
    if (listening) { stopListening(); return; }

    recog = new SR();
    recog.lang = 'en-US';
    recog.interimResults = true;
    recog.continuous = false;
    recog.maxAlternatives = 1;

    listening = true;
    document.getElementById('voiceBtn')?.classList.add('live');
    setHud(true, 'Listening…');

    recog.onresult = (e) => {
      let txt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setHud(true, txt);
      if (e.results[e.results.length - 1].isFinal) {
        setHud(true, txt);
        onResult && onResult(txt.trim());
      }
    };
    recog.onerror = (e) => { setHud(true, 'Error: ' + e.error); setTimeout(() => setHud(false), 1500); cleanup(); };
    recog.onend = () => { cleanup(); setTimeout(() => setHud(false), 1200); };
    recog.start();
  }

  function stopListening() { if (recog) recog.stop(); cleanup(); }
  function cleanup() { listening = false; document.getElementById('voiceBtn')?.classList.remove('live'); }

  return { speak, startListening, stopListening, setHud, get listening() { return listening; }, available: !!SR };
})();
