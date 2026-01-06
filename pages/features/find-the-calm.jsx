import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Topbar from '../../components/Topbar';

/*
  Reactified / inlined version of prototype/find-the-calm.js
  - Uses Web Audio API + HTMLAudioElement where available
  - Per-layer volume, mute, solo, master volume
  - Preset save/load (localStorage)
  - Breathing exercises with visual + TTS affirmations
  - Affirmations list + speak
  Notes:
    - Audio files expected at: /assets/audio/rain.mp3, /assets/audio/wind.mp3, /assets/audio/piano.mp3
*/

/* IMPORTANT: ensure these files exist in your app at public/assets/audio/ */

const TRACK_CONFIG = {
  rain: { file: '/assets/audio/rain.mp3', label: 'Rain' },
  wind: { file: '/assets/audio/wind.mp3', label: 'Wind' },
  piano: { file: '/assets/audio/piano.mp3', label: 'Piano' }
};

const DEFAULT_VOL = 0.7;
const SOLO_VOL = 1.0;
const MUTED_VOL = 0.12;

const affirmations = [
  "You are stronger than you think.",
  "This moment is temporary. You will get through this.",
  "Take it one breath at a time. You've got this.",
  "Your calm is within you. Find it now.",
  "You are capable of handling whatever comes your way.",
  "Breathe in peace, breathe out stress.",
  "You deserve to feel calm and safe.",
  "This anxiety does not define you.",
  "With each breath, you're becoming more grounded.",
  "You have overcome difficult moments before. You can do it again.",
  "Your body knows how to relax. Trust it.",
  "Peace is available to you right now.",
  "You are doing better than you think.",
  "This feeling will pass. You will be okay.",
  "Slow down. You're exactly where you need to be.",
  "You are resilient. You are brave. You are worthy.",
  "Let go of what you cannot control.",
  "Your wellbeing matters. Be kind to yourself.",
  "Focus on the present moment. It is safe.",
  "You've handled 100% of your difficult days so far. You've got this."
];

const breathingExercises = {
  box: {
    key: 'box',
    name: 'Box Breathing',
    seq: [{text:'Breathe In', seconds:4},{text:'Hold', seconds:4},{text:'Breathe Out', seconds:4},{text:'Hold', seconds:4}]
  },
  '478': {
    key: '478',
    name: '4-7-8 Breathing',
    seq: [{text:'Breathe In', seconds:4},{text:'Hold', seconds:7},{text:'Breathe Out', seconds:8}]
  },
  diaphragm: {
    key: 'diaphragm',
    name: 'Diaphragmatic Breathing',
    seq: [{text:'Breathe In', seconds:4},{text:'Breathe Out', seconds:6}]
  }
};

export default function Breathe() {
  const router = useRouter();

  // Audio context + nodes (refs because we don't want re-renders)
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const tracksRef = useRef({});
  const startedRef = useRef(false);

  const [status, setStatus] = useState('Audio is not started.');
  const [solo, setSoloState] = useState(null);
  const [masterVolume, setMasterVolumeState] = useState(1.0);
  const [currentAffIndex, setCurrentAffIndex] = useState(0);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [activeExercise, setActiveExercise] = useState(null);
  const breathingTimersRef = useRef({});
  const [ftcDebugVisible, setFtcDebugVisible] = useState(false);

  useEffect(() => {
    loadPreset();
    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = () => {};
    }
    return () => {
      try {
        Object.values(tracksRef.current).forEach(t => {
          try { t.audio && t.audio.pause(); } catch(e){}
        });
      } catch(e){}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = () => (audioCtxRef.current ? audioCtxRef.current.currentTime : 0);
  function linearRampTo(node, value, time = 0.15) {
    try {
      if (node && node.gain) {
        node.gain.cancelScheduledValues(now());
        node.gain.linearRampToValueAtTime(value, now() + time);
      }
    } catch (e) {}
  }

  function makeTrack(name, file) {
    const audio = new Audio(file);
    audio.loop = true;
    audio.preload = 'auto';
    let source = null;
    let outGain = null;
    let usingFallback = false;
    let fallbackNodes = [];
    let sourceCreated = false;

    function createWhiteNoiseBuffer(durationSec = 2) {
      const ctx = audioCtxRef.current;
      const sr = ctx.sampleRate;
      const len = Math.max(1, Math.floor(durationSec * sr));
      const buf = ctx.createBuffer(1, len, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.25;
      return buf;
    }

    function ensureNodes() {
      if (sourceCreated) return;
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      try {
        source = ctx.createMediaElementSource(audio);
        outGain = ctx.createGain();
        outGain.gain.value = DEFAULT_VOL;
        source.connect(outGain);
        outGain.connect(masterGainRef.current || ctx.destination);
        usingFallback = false;
        sourceCreated = true;
      } catch (e) {
        usingFallback = true;
        outGain = ctx.createGain();
        outGain.gain.value = DEFAULT_VOL;
        outGain.connect(masterGainRef.current || ctx.destination);
        if (name === 'wind') {
          const b = createWhiteNoiseBuffer(4);
          const src = ctx.createBufferSource();
          src.buffer = b;
          src.loop = true;
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 1200;
          src.connect(lp);
          lp.connect(outGain);
          fallbackNodes.push(src, lp);
        } else if (name === 'rain') {
          const b = createWhiteNoiseBuffer(2);
          const src = ctx.createBufferSource();
          src.buffer = b;
          src.loop = true;
          const hp = ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.value = 700;
          src.connect(hp);
          hp.connect(outGain);
          fallbackNodes.push(src, hp);
        } else {
          const g = ctx.createGain();
          g.gain.value = 0.4;
          const freqs = [220, 262, 330];
          const oscs = freqs.map((f, i) => {
            const o = ctx.createOscillator();
            o.type = i === 0 ? 'triangle' : (i === 1 ? 'sine' : 'sawtooth');
            o.frequency.value = f;
            o.start && o.start(0);
            o.connect(g);
            return o;
          });
          g.connect(outGain);
          fallbackNodes.push(...oscs, g);
        }
        sourceCreated = true;
        try {
          fallbackNodes.forEach(n => { if (n.start) try { n.start(0); } catch(e){} });
        } catch (e) {}
      }
    }

    audio.addEventListener('error', () => {
      setTimeout(() => { if (audioCtxRef.current) ensureNodes(); }, 50);
    });

    audio.addEventListener('canplaythrough', () => {
      if (audioCtxRef.current) ensureNodes();
    });

    function start() {
      ensureNodes();
      if (!usingFallback) {
        audio.play().catch(e => { console.debug('audio play error', e); });
      }
    }
    function stop() {
      try { audio.pause(); audio.currentTime = 0; } catch(e){}
      fallbackNodes.forEach(n => { try { if (n.stop) n.stop(0); } catch(e){} });
    }

    return {
      name,
      audio,
      get out() { ensureNodes(); return outGain; },
      start,
      stop,
      muted: false,
      volume: DEFAULT_VOL,
      usingFallback
    };
  }

  async function initAudio() {
    if (startedRef.current) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      setStatus('Web Audio API not available in this browser.');
      return;
    }
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    masterGainRef.current = ctx.createGain();
    masterGainRef.current.gain.value = masterVolume;
    masterGainRef.current.connect(ctx.destination);

    const rain = makeTrack('rain', TRACK_CONFIG.rain.file);
    const wind = makeTrack('wind', TRACK_CONFIG.wind.file);
    const piano = makeTrack('piano', TRACK_CONFIG.piano.file);
    rain.start(); wind.start(); piano.start();

    tracksRef.current = { rain, wind, piano };
    startedRef.current = true;
    setStatus('Audio active — use controls to adjust layers.');
    applyTrackGains();
    updateUIFromTracks();
  }

  function setMasterVolume(value) {
    setMasterVolumeState(value);
    if (masterGainRef.current) linearRampTo(masterGainRef.current, value);
  }

  function applyTrackGains() {
    const tracks = tracksRef.current;
    Object.entries(tracks).forEach(([name, t]) => {
      let target;
      if (solo && solo !== name) target = MUTED_VOL;
      else if (t.muted) target = 0;
      else if (solo === name) target = SOLO_VOL;
      else target = t.volume;
      try { if (t.out) linearRampTo(t.out, target); } catch(e){}
    });
  }

  function updateUIFromTracks() {
    if (typeof document === 'undefined') return;
    Object.entries(tracksRef.current).forEach(([name, t]) => {
      const slider = document.querySelector(`input.volume-slider[data-track="${name}"]`);
      if (slider) slider.value = t.volume;
      const muteBtn = document.querySelector(`.mute-btn[data-track="${name}"]`);
      if (muteBtn) {
        muteBtn.setAttribute('aria-pressed', String(!!t.muted));
        muteBtn.classList.toggle('active', !!t.muted);
      }
      const soloBtn = document.querySelector(`.solo-btn[data-track="${name}"]`);
      if (soloBtn) {
        const isSolo = solo === name;
        soloBtn.setAttribute('aria-pressed', String(isSolo));
        soloBtn.classList.toggle('active', isSolo);
      }
      const card = document.querySelector(`.card[data-track="${name}"]`);
      if (card) {
        const pressed = solo === name;
        card.setAttribute('aria-pressed', String(pressed));
        card.classList.toggle('is-solo', pressed);
      }
    });
  }

  function toggleSolo(name) {
    const prev = solo;
    if (!audioCtxRef.current) return;
    if (prev === name) {
      setSoloState(null);
      Object.entries(tracksRef.current).forEach(([n, t]) => {
        const target = t.muted ? 0 : t.volume;
        try { if (t.out) linearRampTo(t.out, target); } catch(e){}
      });
      setSoloState(null);
    } else {
      setSoloState(name);
      Object.entries(tracksRef.current).forEach(([n, t]) => {
        if (n === name) {
          try { if (t.out) linearRampTo(t.out, SOLO_VOL); } catch(e){}
        } else {
          try { if (t.out) linearRampTo(t.out, MUTED_VOL); } catch(e){}
        }
      });
    }
    setTimeout(updateUIFromTracks, 160);
  }

  function setTrackVolume(name, value) {
    const t = tracksRef.current[name];
    if (!t) return;
    t.volume = value;
    if (solo && solo !== name) return;
    if (t.muted) return;
    if (solo === name) linearRampTo(t.out, SOLO_VOL);
    else linearRampTo(t.out, value);
  }

  function setTrackMute(name, muted) {
    const t = tracksRef.current[name];
    if (!t) return;
    t.muted = !!muted;
    if (solo && solo !== name) return;
    if (muted) linearRampTo(t.out, 0);
    else linearRampTo(t.out, solo === name ? SOLO_VOL : t.volume);
    updateUIFromTracks();
  }

  function doHaptic(short = false) {
    const disabledEl = document.getElementById('disable-haptics');
    const disabled = disabledEl ? disabledEl.checked : false;
    if (disabled) return;
    if (navigator.vibrate) navigator.vibrate(short ? 30 : 60);
  }

  function savePreset() {
    const preset = { tracks: {}, master: masterVolume, solo };
    Object.entries(tracksRef.current).forEach(([name, t]) => {
      preset.tracks[name] = { volume: t.volume, muted: !!t.muted };
    });
    localStorage.setItem('ftc_preset', JSON.stringify(preset));
    const btn = document.getElementById('save-preset');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Saved';
      setTimeout(() => { btn.textContent = orig; }, 1400);
    }
  }

  function loadPreset() {
    try {
      const raw = localStorage.getItem('ftc_preset');
      if (!raw) return;
      const preset = JSON.parse(raw);
      if (preset.master !== undefined) {
        setMasterVolumeState(preset.master);
        const ms = document.getElementById('master-volume');
        if (ms) ms.value = preset.master;
        if (masterGainRef.current) linearRampTo(masterGainRef.current, preset.master);
      }
      if (preset.tracks && tracksRef.current) {
        Object.entries(preset.tracks).forEach(([name, s]) => {
          const t = tracksRef.current[name];
          if (t) {
            t.volume = (typeof s.volume === 'number' ? s.volume : DEFAULT_VOL);
            t.muted = !!s.muted;
            const slider = document.querySelector(`input.volume-slider[data-track="${name}"]`);
            if (slider) slider.value = t.volume;
            const muteBtn = document.querySelector(`.mute-btn[data-track="${name}"]`);
            if (muteBtn) muteBtn.setAttribute('aria-pressed', String(!!t.muted));
          }
        });
      }
      if (preset.solo) setSoloState(preset.solo);
      applyTrackGains();
      updateUIFromTracks();
    } catch (e) {
      console.debug('loadPreset error', e);
    }
  }

  function showAffirmation(idx = 0) {
    setCurrentAffIndex(((idx % affirmations.length) + affirmations.length) % affirmations.length);
  }
  function nextAffirmation() { showAffirmation(currentAffIndex + 1); }
  function speakText(text, opts = {}) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts.rate || 1.0;
    u.pitch = opts.pitch || 1.0;
    u.volume = opts.volume || 0.9;
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) u.voice = voices[0];
    speechSynthesis.speak(u);
  }
  function speakAffirmation() {
    speakText(affirmations[currentAffIndex], { rate: 0.9, pitch: 0.95, volume: 0.85 });
  }

  function startBreathingExercise(key) {
    if (!breathingExercises[key]) return;
    if (activeExercise && activeExercise !== key) stopBreathingExercise(activeExercise);
    const btn = document.querySelector(`.breathing-btn[data-exercise="${key}"]`);
    const visualClass = (key === 'box') ? 'box-breathing' : `breathing-${key}`;
    const visual = document.querySelector(`.${visualClass}`);
    if (!btn || !visual) return;
    const isStarting = !btn.classList.contains('active');
    if (isStarting) {
      setActiveExercise(key);
      btn.classList.add('active');
      btn.textContent = 'Stop Exercise';
      visual.style.display = 'flex';
      visual.classList.add('active');
      startLabelCycle(key);
      if (autoSpeak) speakAffirmation();
    } else {
      stopBreathingExercise(key);
    }
  }

  function stopBreathingExercise(key) {
    const btn = document.querySelector(`.breathing-btn[data-exercise="${key}"]`);
    const visualClass = (key === 'box') ? 'box-breathing' : `breathing-${key}`;
    const visual = document.querySelector(`.${visualClass}`);
    if (btn) { btn.classList.remove('active'); btn.textContent = 'Start Exercise'; }
    if (visual) {
      visual.style.display = 'none';
      visual.classList.remove('active');
      const label = visual.querySelector('.breath-label');
      if (label) label.textContent = (key === 'diaphragm') ? 'Breathe In' : 'Inhale';
    }
    if (breathingTimersRef.current[key]) { clearTimeout(breathingTimersRef.current[key]); delete breathingTimersRef.current[key]; }
    if (activeExercise === key) setActiveExercise(null);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  function startLabelCycle(key) {
    const ex = breathingExercises[key];
    const visualClass = (key === 'box') ? 'box-breathing' : `breathing-${key}`;
    const visual = document.querySelector(`.${visualClass}`);
    if (!visual || !ex) return;
    const labelEl = visual.querySelector('.breath-label');
    if (!labelEl) return;
    const seq = ex.seq;
    let idx = 0;
    function step() {
      if (activeExercise !== key) return;
      const s = seq[idx];
      labelEl.textContent = s.text;
      if (autoSpeak) speakText(s.text, {rate:1.0, pitch:1.0, volume:0.9});
      breathingTimersRef.current[key] = setTimeout(() => {
        idx = (idx + 1) % seq.length;
        step();
      }, s.seconds * 1000);
    }
    if (breathingTimersRef.current[key]) clearTimeout(breathingTimersRef.current[key]);
    step();
  }

  useEffect(() => {
    const startBtn = document.getElementById('start');
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        await initAudio();
        try { if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume(); } catch(e){}
      });
    }

    document.querySelectorAll('.card').forEach(btn => {
      let longpress = false;
      let timer;
      btn.addEventListener('pointerdown', () => {
        timer = setTimeout(() => {
          longpress = true;
          btn.classList.add('pulse');
          doHaptic(false);
          toggleSolo(btn.dataset.track);
        }, 550);
      });
      btn.addEventListener('pointerup', () => {
        clearTimeout(timer);
        if (!longpress) {
          btn.classList.add('pulse');
          setTimeout(() => btn.classList.remove('pulse'), 420);
          doHaptic(true);
          toggleSolo(btn.dataset.track);
        }
        longpress = false;
      });
      btn.addEventListener('pointerleave', () => { clearTimeout(timer); longpress = false; });
    });

    document.querySelectorAll('.volume-slider').forEach(slider => {
      const trackName = slider.dataset.track;
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        setTrackVolume(trackName, val);
        doHaptic(true);
      });
    });

    document.querySelectorAll('.mute-btn').forEach(btn => {
      const trackName = btn.dataset.track;
      btn.addEventListener('click', () => {
        const t = tracksRef.current[trackName];
        if (!t) return;
        const newMuted = !t.muted;
        setTrackMute(trackName, newMuted);
        doHaptic(true);
      });
    });

    document.querySelectorAll('.solo-btn').forEach(btn => {
      const trackName = btn.dataset.track;
      btn.addEventListener('click', () => { toggleSolo(trackName); doHaptic(true); });
    });

    const masterSlider = document.getElementById('master-volume');
    if (masterSlider) masterSlider.addEventListener('input', (e) => setMasterVolume(parseFloat(e.target.value)));

    const saveBtn = document.getElementById('save-preset');
    if (saveBtn) saveBtn.addEventListener('click', () => { savePreset(); doHaptic(true); });
    const loadBtn = document.getElementById('load-preset');
    if (loadBtn) loadBtn.addEventListener('click', () => { loadPreset(); doHaptic(true); });

    const speakBtn = document.getElementById('speak-affirmation');
    const nextBtn = document.getElementById('next-affirmation');
    if (speakBtn) speakBtn.addEventListener('click', speakAffirmation);
    if (nextBtn) nextBtn.addEventListener('click', nextAffirmation);

    document.querySelectorAll('.breathing-btn').forEach(btn => {
      btn.addEventListener('click', () => startBreathingExercise(btn.dataset.exercise));
    });

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpeak, solo, activeExercise]);

  useEffect(() => { applyTrackGains(); updateUIFromTracks(); /* eslint-disable-next-line */ }, [solo]);
  useEffect(() => { showAffirmation(0); }, []);

  function handleSignOut() {
    router.replace('/');
  }

  return (
    <>
      <Head>
        <title>Breathe — Semi;colonic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="site-root">
        <Topbar links={[
          { href: '/posts', label: 'Posts' },
          { href: '/chat', label: 'Chat' },
          { href: '/features', label: 'Features' },
          { href: '/games', label: 'Games' },
          { href: '/resources', label: 'Resources' },
        ]} />

        <div className="site">
          <main className="page" style={{ maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
            <header className="hero">
              <div className="hero-inner">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href="/features" legacyBehavior>
                      <a className="btn btn-ghost" aria-label="Back to features" style={{ marginRight: 8 }}>← Back</a>
                    </Link>
                    <h1 className="title" style={{ margin: 0 }}>Find the Calm</h1>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button id="start" className="btn">Start audio</button>
                    <button id="debug-toggle" className="btn btn-ghost" aria-pressed="false" title="Toggle debug panel (Ctrl/Cmd+D)"
                      onClick={() => setFtcDebugVisible(v => !v)}>
                      Debug
                    </button>
                    <label className="toggle" style={{ marginLeft: 6 }}>
                      <input type="checkbox" id="disable-haptics" />
                      <span>Disable Haptics</span>
                    </label>
                  </div>
                </div>

                <p className="subtitle" style={{ marginTop: 8 }}>Tap a card to isolate a sound. Gentle haptic feedback on interaction.</p>
              </div>
            </header>

            <section className="grid" aria-label="Sound layers" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div className="card" data-track="rain" role="group" aria-label="Rain sound" tabIndex="0">
                <svg className="icon" viewBox="0 0 64 64" aria-hidden>
                  <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                    <path d="M21 32a9 9 0 0118 0" />
                    <path d="M24 28c-6 0-7-7-1-10A10 10 0 0138 18c6 0 9 6 6 11"/>
                    <path d="M22 44l3 6M30 44l3 6M38 44l3 6" strokeWidth="1.8"/>
                  </g>
                </svg>
                <div className="label">Rain</div>
                <div className="meta">Calm, steady • ambient</div>
                <div className="card-controls">
                  <label className="volume-control">
                    <span className="sr-only">Adjust rain volume level</span>
                    <input type="range" min="0" max="1" step="0.01" defaultValue={DEFAULT_VOL} className="volume-slider" data-track="rain" />
                  </label>
                  <div className="btn-group">
                    <button className="mute-btn btn-small" data-track="rain" aria-pressed="false" aria-label="Mute rain">M</button>
                    <button className="solo-btn btn-small" data-track="rain" aria-pressed="false" aria-label="Solo rain">S</button>
                  </div>
                </div>
              </div>

              <div className="card" data-track="wind" role="group" aria-label="Wind sound" tabIndex="0">
                <svg className="icon" viewBox="0 0 64 64" aria-hidden>
                  <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                    <path d="M8 28c6-3 14-3 20 0s14 3 20 0" />
                    <path d="M10 38c6-3 18-3 24 0s14 3 18 0" opacity="0.7"/>
                    <path d="M12 18c6-3 10-3 16 0s10 3 16 0" opacity="0.4"/>
                  </g>
                </svg>
                <div className="label">Wind</div>
                <div className="meta">Gentle whoosh • airy</div>
                <div className="card-controls">
                  <label className="volume-control">
                    <span className="sr-only">Adjust wind volume level</span>
                    <input type="range" min="0" max="1" step="0.01" defaultValue={DEFAULT_VOL} className="volume-slider" data-track="wind" />
                  </label>
                  <div className="btn-group">
                    <button className="mute-btn btn-small" data-track="wind" aria-pressed="false" aria-label="Mute wind">M</button>
                    <button className="solo-btn btn-small" data-track="wind" aria-pressed="false" aria-label="Solo wind">S</button>
                  </div>
                </div>
              </div>

              <div className="card" data-track="piano" role="group" aria-label="Piano sound" tabIndex="0">
                <svg className="icon" viewBox="0 0 64 64" aria-hidden>
                  <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                    <rect x="6" y="16" width="52" height="20" rx="2"/>
                    <path d="M14 20v12M22 20v12M30 20v12M38 20v12" strokeWidth="1.6"/>
                    <path d="M12 40h40" strokeWidth="1" opacity="0.6"/>
                  </g>
                </svg>
                <div className="label">Piano</div>
                <div className="meta">Soft keys • sparse notes</div>
                <div className="card-controls">
                  <label className="volume-control">
                    <span className="sr-only">Adjust piano volume level</span>
                    <input type="range" min="0" max="1" step="0.01" defaultValue={DEFAULT_VOL} className="volume-slider" data-track="piano" />
                  </label>
                  <div className="btn-group">
                    <button className="mute-btn btn-small" data-track="piano" aria-pressed="false" aria-label="Mute piano">M</button>
                    <button className="solo-btn btn-small" data-track="piano" aria-pressed="false" aria-label="Solo piano">S</button>
                  </div>
                </div>
              </div>
            </section>

            <section className="master-controls">
              <h2>Master Mix</h2>
              <div className="master-grid">
                <div className="master-volume-control">
                  <label htmlFor="master-volume">Master Volume</label>
                  <input id="master-volume" type="range" min="0" max="1" step="0.01" defaultValue={masterVolume} />
                </div>
                <div className="preset-controls">
                  <button id="save-preset" className="btn btn-ghost">Save Preset</button>
                  <button id="load-preset" className="btn btn-ghost">Load Preset</button>
                </div>
              </div>
            </section>

            <section className="breathing-section">
              <h2>Breathing Exercises</h2>
              <div className="breathing-grid">
                <div className="breathing-card">
                  <h3>Box Breathing</h3>
                  <p className="breathing-desc">Equal breathing pattern • 4 counts each</p>
                  <button className="breathing-btn" data-exercise="box">Start Exercise</button>
                  <div className="breathing-visual box-breathing" style={{display:'none'}}>
                    <div className="breath-circle"></div>
                    <div className="breath-label">Inhale</div>
                  </div>
                </div>

                <div className="breathing-card">
                  <h3>4-7-8 Breathing</h3>
                  <p className="breathing-desc">Calming pattern • for deep relaxation</p>
                  <button className="breathing-btn" data-exercise="478">Start Exercise</button>
                  <div className="breathing-visual breathing-478" style={{display:'none'}}>
                    <div className="breath-circle"></div>
                    <div className="breath-label">Inhale</div>
                  </div>
                </div>

                <div className="breathing-card">
                  <h3>Diaphragmatic Breathing</h3>
                  <p className="breathing-desc">Deep belly breathing • ground yourself</p>
                  <button className="breathing-btn" data-exercise="diaphragm">Start Exercise</button>
                  <div className="breathing-visual breathing-diaphragm" style={{display:'none'}}>
                    <div className="breath-circle"></div>
                    <div className="breath-label">Breathe In</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="affirmations-section">
              <h2>Motivational Affirmations</h2>
              <div className="affirmations-controls">
                <button id="speak-affirmation" className="btn" onClick={speakAffirmation}>🔊 Speak Affirmation</button>
                <button id="next-affirmation" className="btn btn-ghost" onClick={nextAffirmation}>Next Message</button>
                <label className="toggle">
                  <input id="auto-speak" type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} />
                  <span>Auto-speak during breathing</span>
                </label>
              </div>
              <div className="affirmation-display">
                <p id="current-affirmation" className="affirmation-text">{affirmations[currentAffIndex]}</p>
              </div>
            </section>

            <footer className="foot">
              <p className="status">{status}</p>
            </footer>
          </main>

          {ftcDebugVisible && (
            <div className="ftc-debug" role="log" style={{ display: 'block' }}>
              <div className="hdr">
                <div className="title">Find the Calm — debug</div>
                <div className="controls">
                  <button onClick={() => { localStorage.removeItem('ftc_preset'); alert('ftc_preset removed'); }}>Clear Preset</button>
                  <button onClick={() => setFtcDebugVisible(false)}>Close</button>
                </div>
              </div>
              <div className="lines">
                <div className="line">Audio started: {String(!!audioCtxRef.current)}</div>
                <div className="line">Tracks: {Object.keys(tracksRef.current).join(', ')}</div>
                <div className="line">Solo: {String(solo)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
