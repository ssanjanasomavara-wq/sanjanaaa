import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/**
 * Full-featured "Breathe" page ported from the prototype:
 * - UI and styling based on prototype/find-the-calm.css (inlined below)
 * - Audio mixing + per-layer controls using WebAudio + HTMLAudioElement
 * - Solo / mute / per-track volume, master volume
 * - Save / load preset to localStorage
 * - Breathing exercises with visual animations and optional TTS
 * - Affirmations (display, next, speak)
 *
 * Notes:
 * - Audio files referenced from the prototype assets folder:
 *   '/prototype/assets/audio/rain.mp3', '/prototype/assets/audio/wind.mp3', '/prototype/assets/audio/piano.mp3'
 *   (If you copy audio assets into a different folder, update TRACK_CONFIG paths accordingly.)
 *
 * This file is meant to be a self-contained page — styles are included with styled-jsx global for parity
 * with the original prototype stylesheet.
 */

const TRACK_CONFIG = {
  rain: { file: '/prototype/assets/audio/rain.mp3', label: 'Rain' },
  wind: { file: '/prototype/assets/audio/wind.mp3', label: 'Wind' },
  piano: { file: '/prototype/assets/audio/piano.mp3', label: 'Piano' }
};

const DEFAULT_VOL = 0.7;
const SOLO_VOL = 1.0;
const MUTED_VOL = 0.12;

const affirmationsList = [
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
    instructions: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 }
  },
  '478': {
    key: '478',
    name: '4-7-8 Breathing',
    instructions: { inhale: 4, hold: 7, exhale: 8 }
  },
  diaphragm: {
    key: 'diaphragm',
    name: 'Diaphragmatic Breathing',
    instructions: { inhale: 4, exhale: 6 }
  }
};

export default function Breathe() {
  // Audio context & nodes refs (persist across renders)
  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const tracksRef = useRef({}); // { rain: { audio, outGain, volume, muted }, ... }
  const startedRef = useRef(false);
  const [startedUI, setStartedUI] = useState(false);

  // UI state
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [solo, setSoloState] = useState(null);
  const [tracksState, setTracksState] = useState({
    rain: { volume: DEFAULT_VOL, muted: false },
    wind: { volume: DEFAULT_VOL, muted: false },
    piano: { volume: DEFAULT_VOL, muted: false }
  });

  // Affirmations state
  const [affIndex, setAffIndex] = useState(0);
  // Breathing state
  const [activeBreathing, setActiveBreathing] = useState(null);
  const breathingTimersRef = useRef({});

  // Refs to breathing visuals for class toggles and label updates
  const boxVisualRef = useRef(null);
  const breath478VisualRef = useRef(null);
  const diaphragmVisualRef = useRef(null);

  // Helper: current time for AudioContext automation
  const now = () => (ctxRef.current ? ctxRef.current.currentTime : 0);

  function linearTo(gainNode, value, time = 0.15) {
    try {
      if (!gainNode) return;
      const g = gainNode.gain || gainNode;
      g.cancelScheduledValues(now());
      g.linearRampToValueAtTime(value, now() + time);
    } catch (e) {
      // ignore
    }
  }

  // Initialize WebAudio + create tracks
  async function initAudio() {
    if (startedRef.current) return;
    if (typeof window === 'undefined') return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // create tracks
    const tracks = {};
    for (const [name, cfg] of Object.entries(TRACK_CONFIG)) {
      const audio = new Audio(cfg.file);
      audio.loop = true;
      audio.preload = 'auto';
      let source = null;
      let outGain = ctx.createGain();
      outGain.gain.value = tracksState[name]?.volume ?? DEFAULT_VOL;
      outGain.connect(masterGain);

      try {
        source = ctx.createMediaElementSource(audio);
        source.connect(outGain);
      } catch (e) {
        // if MediaElementSource fails, fallback to simple oscillator/noise generator
        // (basic fallback; prototype uses a more advanced fallback)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 220;
        const g = ctx.createGain();
        g.gain.value = 0.02;
        osc.connect(g);
        g.connect(outGain);
        osc.start();
        source = { _fallbackOsc: osc, disconnect: () => {} };
      }

      tracks[name] = {
        audio,
        source,
        outGain,
        volume: tracksState[name].volume,
        muted: tracksState[name].muted
      };
    }

    tracksRef.current = tracks;
    startedRef.current = true;
    setStartedUI(true);

    // start playing where possible
    Object.values(tracks).forEach(t => {
      try {
        // audio.play may require gesture; will be attempted
        t.audio.play().catch(() => {});
      } catch (e) {}
    });

    applyTrackGains();
    loadPreset(); // try load preset if any
  }

  // Apply computed target gains for each track (considering solo/mute)
  function applyTrackGains() {
    const tRef = tracksRef.current;
    Object.entries(tRef).forEach(([name, t]) => {
      let target = 0;
      if (solo && solo !== name) target = MUTED_VOL;
      else if (t.muted) target = 0;
      else if (solo === name) target = SOLO_VOL;
      else target = t.volume ?? DEFAULT_VOL;
      linearTo(t.outGain, target);
    });
    // master gain handled separately
    if (masterGainRef.current) linearTo(masterGainRef.current, masterVolume);
  }

  // Per-track volume setter
  function setVolume(name, value) {
    const tRef = tracksRef.current[name];
    if (!tRef) {
      // update UI state so it persists and will be applied once audio initializes
      setTracksState(prev => ({ ...prev, [name]: { ...prev[name], volume: value } }));
      return;
    }
    tRef.volume = value;
    setTracksState(prev => ({ ...prev, [name]: { ...prev[name], volume: value } }));
    // If soloing another track, preserve muted behaviour
    if (solo && solo !== name) return;
    if (tRef.muted) return;
    if (solo === name) linearTo(tRef.outGain, SOLO_VOL);
    else linearTo(tRef.outGain, value);
  }

  // Mute handler
  function setMute(name, muted) {
    const tRef = tracksRef.current[name];
    if (tRef) {
      tRef.muted = muted;
      setTracksState(prev => ({ ...prev, [name]: { ...prev[name], muted } }));
      if (solo && solo !== name) return; // solo overrides
      linearTo(tRef.outGain, muted ? 0 : (solo === name ? SOLO_VOL : (tRef.volume ?? DEFAULT_VOL)));
    } else {
      setTracksState(prev => ({ ...prev, [name]: { ...prev[name], muted } }));
    }
  }

  // Solo toggling
  function toggleSolo(name) {
    if (solo === name) {
      setSoloState(null);
      setSolo(null);
    } else {
      setSoloState(name);
      setSolo(name);
    }
  }

  function setSolo(name) {
    // update internal states and apply gains
    const tRef = tracksRef.current;
    Object.entries(tRef).forEach(([n, t]) => {
      if (n === name) linearTo(t.outGain, SOLO_VOL);
      else linearTo(t.outGain, MUTED_VOL);
    });
    setSoloState(name);
  }

  // Master volume change
  function onMasterVolumeChange(v) {
    setMasterVolume(v);
    if (masterGainRef.current) linearTo(masterGainRef.current, v);
  }

  // Preset save/load
  function savePreset() {
    const preset = {
      master: masterVolume,
      solo,
      tracks: {}
    };
    Object.entries(tracksRef.current).forEach(([n, t]) => {
      preset.tracks[n] = { volume: t.volume ?? DEFAULT_VOL, muted: !!t.muted };
    });
    // fallback to UI state if audio not initialized
    Object.keys(TRACK_CONFIG).forEach(n => {
      if (!preset.tracks[n]) {
        preset.tracks[n] = tracksState[n];
      }
    });
    localStorage.setItem('ftc_preset', JSON.stringify(preset));
    // small feedback by toggling a saved state (could be improved)
    // we don't create button text flips here to keep React simple
  }

  function loadPreset() {
    try {
      const raw = localStorage.getItem('ftc_preset');
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.master !== undefined) {
        setMasterVolume(p.master);
        if (masterGainRef.current) linearTo(masterGainRef.current, p.master);
      }
      if (p.solo) {
        setSoloState(p.solo);
      } else {
        setSoloState(null);
      }
      if (p.tracks) {
        Object.entries(p.tracks).forEach(([n, s]) => {
          if (tracksRef.current[n]) {
            tracksRef.current[n].volume = s.volume;
            tracksRef.current[n].muted = s.muted;
            linearTo(tracksRef.current[n].outGain, s.muted ? 0 : (solo === n ? SOLO_VOL : s.volume));
          }
          // update UI state
          setTracksState(prev => ({ ...prev, [n]: { volume: s.volume, muted: s.muted } }));
        });
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  // Affirmations
  function showAff(index) {
    const idx = ((index % affirmationsList.length) + affirmationsList.length) % affirmationsList.length;
    setAffIndex(idx);
  }
  function nextAff() {
    showAff(affIndex + 1);
  }
  function speakAffirmation() {
    const text = affirmationsList[affIndex];
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 0.95;
    u.volume = 0.85;
    const voices = speechSynthesis.getVoices();
    if (voices && voices.length) u.voice = voices[0];
    speechSynthesis.speak(u);
  }

  // Breathing exercise helpers
  function startBreathingExercise(key) {
    const ex = breathingExercises[key];
    if (!ex) return;
    // toggle
    if (activeBreathing === key) {
      stopBreathingExercise(key);
      return;
    }

    // Stop any other
    if (activeBreathing && activeBreathing !== key) {
      stopBreathingExercise(activeBreathing);
    }

    setActiveBreathing(key);
    // enable visual
    const visual = visualForKey(key);
    if (visual) {
      visual.style.display = 'flex';
      visual.classList.add('active');
      // magic: breathing label cycle
      startLabelCycle(key);
    }
    // auto-speak affirmation if checkbox present
    const autoSpeak = document.getElementById('auto-speak');
    if (autoSpeak && autoSpeak.checked) speakAffirmation();
  }

  function stopBreathingExercise(key) {
    const visual = visualForKey(key);
    if (visual) {
      visual.classList.remove('active');
      visual.style.display = 'none';
      const label = visual.querySelector('.breath-label');
      if (label) label.textContent = (key === 'diaphragm' ? 'Breathe In' : 'Inhale');
    }
    // clear timers
    if (breathingTimersRef.current[key]) {
      clearTimeout(breathingTimersRef.current[key]);
      delete breathingTimersRef.current[key];
    }
    if (activeBreathing === key) setActiveBreathing(null);
    // cancel any speech
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  function visualForKey(key) {
    if (key === 'box') return boxVisualRef.current;
    if (key === '478') return breath478VisualRef.current;
    if (key === 'diaphragm') return diaphragmVisualRef.current;
    return null;
  }

  function startLabelCycle(key) {
    const ex = breathingExercises[key];
    if (!ex) return;
    const visual = visualForKey(key);
    if (!visual) return;
    const labelEl = visual.querySelector('.breath-label');
    if (!labelEl) return;

    // build sequence
    let seq = [];
    if (key === 'box') {
      seq = [
        { text: 'Breathe In', seconds: ex.instructions.inhale },
        { text: 'Hold', seconds: ex.instructions.hold1 },
        { text: 'Breathe Out', seconds: ex.instructions.exhale },
        { text: 'Hold', seconds: ex.instructions.hold2 }
      ];
    } else if (key === '478') {
      seq = [
        { text: 'Breathe In', seconds: ex.instructions.inhale },
        { text: 'Hold', seconds: ex.instructions.hold },
        { text: 'Breathe Out', seconds: ex.instructions.exhale }
      ];
    } else {
      seq = [
        { text: 'Breathe In', seconds: ex.instructions.inhale },
        { text: 'Breathe Out', seconds: ex.instructions.exhale }
      ];
    }

    let idx = 0;
    function runStep() {
      if (activeBreathing !== key) return;
      const step = seq[idx];
      labelEl.textContent = step.text;
      const autoSpeak = document.getElementById('auto-speak');
      if (autoSpeak && autoSpeak.checked) speakText(step.text);
      breathingTimersRef.current[key] = setTimeout(() => {
        idx = (idx + 1) % seq.length;
        runStep();
      }, step.seconds * 1000);
    }

    // clear previous if present
    if (breathingTimersRef.current[key]) {
      clearTimeout(breathingTimersRef.current[key]);
      delete breathingTimersRef.current[key];
    }
    runStep();
  }

  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.0;
    u.volume = 0.9;
    const voices = speechSynthesis.getVoices();
    if (voices && voices.length) u.voice = voices[0];
    speechSynthesis.speak(u);
  }

  // Setup: make sure UI state is respected if audio is already available
  useEffect(() => {
    // Clean up when unmounting: stop timers and audio
    return () => {
      Object.values(breathingTimersRef.current).forEach(t => clearTimeout(t));
      breathingTimersRef.current = {};
      // stop audio playback
      Object.values(tracksRef.current || {}).forEach(t => {
        try {
          if (t.audio) {
            t.audio.pause();
            t.audio.currentTime = 0;
          }
          if (t.source && t.source._fallbackOsc && typeof t.source._fallbackOsc.stop === 'function') {
            t.source._fallbackOsc.stop();
          }
        } catch (e) {}
      });
      if (ctxRef.current && typeof ctxRef.current.close === 'function') {
        ctxRef.current.close().catch(()=>{});
      }
    };
  }, []);

  // Update UI reflectively when solo changes
  useEffect(() => {
    applyTrackGains();
    // update minimal aria-pressed toggles for cards (DOM elements exist)
    // (we still keep state in React)
  }, [solo]);

  // Update volumes if UI state changed before audio init
  useEffect(() => {
    // propagate master
    if (masterGainRef.current) linearTo(masterGainRef.current, masterVolume);
  }, [masterVolume]);

  // Render UI
  return (
    <>
      <Head>
        <title>Breathe — Find the Calm</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style jsx global>{`
/* Inlined prototype/find-the-calm.css (trimmed where necessary for clarity) */
:root{
  --bg:#FFF6F1;
  --card:#fffaf6;
  --muted:#7B5A54;
  --accent:#D86249;
  --text:#1A1A1A;
  --shadow: 0 10px 28px rgba(224,122,95,0.12);
}
*{box-sizing:border-box}
html,body{height:100%}
body{
  background:linear-gradient(180deg,#FFF6F1,#FFF8F3);
  font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  margin:0;color:var(--text);
}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border-width:0}
.page{max-width:980px;margin:32px auto;padding:20px}
.hero{display:flex;align-items:flex-start;gap:20px;margin-bottom:12px}
.hero-inner{padding:6px}
.title{font-weight:700;margin:0;font-size:1.6rem}
.subtitle{margin:8px 0;color:var(--muted)}
.controls{margin-top:8px;display:flex;gap:12px;align-items:center}
.btn{background:var(--accent);color:#fff;border:0;padding:10px 14px;border-radius:10px;cursor:pointer;box-shadow:0 6px 18px rgba(224,122,95,0.12)}
.btn-ghost{background:transparent;color:var(--accent);border:1px solid rgba(216,98,73,0.12);padding:8px 12px;box-shadow:none}
.toggle{display:inline-flex;align-items:center;gap:10px;font-size:0.9rem;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-top:8px;margin-bottom:32px}
.card{background:var(--card);border-radius:14px;padding:18px;box-shadow:var(--shadow);border:1px solid rgba(30,40,55,0.04);display:flex;flex-direction:column;align-items:flex-start;gap:8px;cursor:pointer;transition:transform 120ms ease}
.card:active{transform:scale(.997)}
.card .icon{width:56px;height:56px;color:var(--accent);opacity:1}
.card .label{font-weight:600;color:#2B1F1E}
.card .meta{font-size:0.86rem;color:var(--muted);margin-bottom:4px}
.card{border:1px solid rgba(30,40,55,0.06)}
.card[aria-pressed="true"]{box-shadow:0 18px 42px rgba(224,122,95,0.18);border-color:var(--accent);transform:translateY(-6px);}
.card.pulse{animation:cardPulse 420ms ease}
@keyframes cardPulse{0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)}}

.card-controls{display:flex;flex-direction:column;gap:8px;width:100%;margin-top:auto}
.volume-control{display:flex;align-items:center;gap:8px;width:100%}
.volume-slider{width:100%;height:6px;border-radius:3px;background:rgba(216,98,73,0.15);outline:none;-webkit-appearance:none;appearance:none}
.volume-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:var(--accent);cursor:pointer;transition:transform 150ms ease}
.volume-slider::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--accent);cursor:pointer;border:none;transition:transform 150ms ease}
.volume-slider:hover::-webkit-slider-thumb,.volume-slider:focus::-webkit-slider-thumb{transform:scale(1.2)}
.volume-slider:hover::-moz-range-thumb,.volume-slider:focus::-moz-range-thumb{transform:scale(1.2)}

.btn-group{display:flex;gap:6px;justify-content:flex-end}
.btn-small{background:rgba(216,98,73,0.1);color:var(--accent);border:1px solid rgba(216,98,73,0.2);padding:6px 10px;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600;transition:all 200ms ease}
.btn-small:hover{background:rgba(216,98,73,0.15);transform:translateY(-2px)}
.btn-small:active{transform:scale(0.95)}
.btn-small.active,.btn-small[aria-pressed="true"]{background:var(--accent);color:#fff;border-color:var(--accent)}

.master-controls{background:var(--card);border-radius:14px;padding:20px;box-shadow:var(--shadow);border:1px solid rgba(30,40,55,0.04);margin-bottom:32px}
.master-controls h2{font-size:1.2rem;font-weight:700;margin:0 0 16px 0;color:var(--text)}
.master-grid{display:grid;gap:16px;align-items:center}
.master-volume-control{display:flex;flex-direction:column;gap:8px}
.master-volume-control label{font-size:0.95rem;font-weight:600;color:var(--text)}
.master-volume-control input[type="range"]{width:100%;height:8px;border-radius:4px;background:rgba(216,98,73,0.15);outline:none;-webkit-appearance:none;appearance:none}
.master-volume-control input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:var(--accent);cursor:pointer;transition:transform 150ms ease}
.master-volume-control input[type="range"]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:var(--accent);cursor:pointer;border:none;transition:transform 150ms ease;box-shadow:0 2px 4px rgba(0,0,0,0.06)}
.master-volume-control input[type="range"]:hover::-webkit-slider-thumb,.master-volume-control input[type="range"]:focus::-webkit-slider-thumb{transform:scale(1.15)}
.master-volume-control input[type="range"]:hover::-moz-range-thumb,.master-volume-control input[type="range"]:focus::-moz-range-thumb{transform:scale(1.15)}
.preset-controls{display:flex;gap:12px;flex-wrap:wrap}
.foot{margin-top:20px;color:var(--muted)}
.status{font-size:0.95rem}

/* Breathing Exercises Section */
.breathing-section{margin-bottom:32px}
.breathing-section h2{font-size:1.3rem;font-weight:700;margin:24px 0 16px 0;color:var(--text)}
.breathing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.breathing-card{background:var(--card);border-radius:14px;padding:20px;box-shadow:var(--shadow);border:1px solid rgba(30,40,55,0.04);display:flex;flex-direction:column;gap:12px}
.breathing-card h3{margin:0;font-size:1.1rem;color:var(--text)}
.breathing-desc{margin:0;font-size:0.9rem;color:var(--muted)}
.breathing-btn{background:var(--accent);color:#fff;border:0;padding:10px 14px;border-radius:10px;cursor:pointer;box-shadow:0 6px 18px rgba(224,122,95,0.12);font-weight:600;transition:transform 200ms ease}
.breathing-btn:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(224,122,95,0.18)}
.breathing-btn:active{transform:scale(.98)}
.breathing-btn.active{background:#10B981}

/* Breathing Visual */
.breathing-visual{display:flex !important;flex-direction:column;align-items:center;justify-content:center;height:200px;gap:16px}
.breath-circle{width:120px;height:120px;border-radius:50%;background:radial-gradient(circle at 30% 30%, rgba(216,98,73,0.2), rgba(216,98,73,0.05));border:3px solid var(--accent);}
.breath-label{font-size:1.1rem;font-weight:600;color:var(--accent);letter-spacing:1px}
.box-breathing.active .breath-circle{animation:breatheBox 16s infinite ease-in-out}
.breathing-478.active .breath-circle{animation:breathe478 18s infinite ease-in-out}
.breathing-diaphragm.active .breath-circle{animation:breatheDiaphragm 10s infinite ease-in-out}
@keyframes breatheBox{
  0%{transform:scale(1);opacity:0.6}
  20%{transform:scale(1.3);opacity:1}
  25%{transform:scale(1.3);opacity:1}
  50%{transform:scale(1.05);opacity:0.7}
  75%{transform:scale(1.25);opacity:1}
  100%{transform:scale(1);opacity:0.6}
}
@keyframes breathe478{
  0%{transform:scale(1);opacity:0.6}
  14.28%{transform:scale(1.35);opacity:1}
  28.56%{transform:scale(1.2);opacity:0.8}
  57.12%{transform:scale(1.05);opacity:0.5}
  100%{transform:scale(1);opacity:0.6}
}
@keyframes breatheDiaphragm{
  0%{transform:scale(1);opacity:0.65}
  40%{transform:scale(1.25);opacity:1}
  100%{transform:scale(1);opacity:0.65}
}

/* Affirmations Section */
.affirmations-section{margin-bottom:32px}
.affirmations-section h2{font-size:1.3rem;font-weight:700;margin:24px 0 16px 0;color:var(--text)}
.affirmations-controls{display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
.affirmation-display{background:var(--card);border-radius:14px;padding:24px;box-shadow:var(--shadow);border:1px solid rgba(30,40,55,0.04);min-height:100px;display:flex;align-items:center;justify-content:center}
.affirmation-text{margin:0;font-size:1.2rem;font-weight:500;color:var(--text);text-align:center;line-height:1.6;font-style:italic}
`}</style>

      <main className="page" role="main">
        <header className="hero">
          <div className="hero-inner">
            <h1 className="title">Find the Calm</h1>
            <p className="subtitle">Mix recorded ambient layers, run breathing exercises, and listen to affirmations.</p>
            <div className="controls">
              <button id="start" className="btn" onClick={async () => {
                await initAudio();
                if (ctxRef.current && ctxRef.current.state === 'suspended') {
                  await ctxRef.current.resume();
                }
              }}>{startedUI ? 'Audio started' : 'Start audio'}</button>
              <button id="debug-toggle" className="btn btn-ghost" aria-pressed="false" title="Toggle debug (not implemented)">Debug</button>
              <label className="toggle" style={{ alignItems: 'center' }}>
                <input type="checkbox" id="disable-haptics" />
                <span>Disable Haptics</span>
              </label>
            </div>
          </div>
        </header>

        <section className="grid" aria-label="Sound layers">
          {/* Rain */}
          <div
            className="card"
            data-track="rain"
            role="group"
            aria-label="Rain sound"
            tabIndex="0"
            onClick={() => toggleSolo('rain')}
            aria-pressed={solo === 'rain'}
          >
            <svg className="icon" viewBox="0 0 64 64" aria-hidden>
              <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 32a9 9 0 0118 0" />
                <path d="M24 28c-6 0-7-7-1-10A10 10 0 0138 18c6 0 9 6 6 11" />
                <path d="M22 44l3 6M30 44l3 6M38 44l3 6" strokeWidth="1.8" />
              </g>
            </svg>
            <div className="label">Rain</div>
            <div className="meta">Calm, steady • ambient</div>
            <div className="card-controls">
              <label className="volume-control">
                <span className="sr-only">Adjust rain volume level</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={tracksState.rain.volume}
                  className="volume-slider"
                  data-track="rain"
                  onChange={(e) => setVolume('rain', parseFloat(e.target.value))}
                />
              </label>
              <div className="btn-group">
                <button
                  className={`mute-btn btn-small ${tracksState.rain.muted ? 'active' : ''}`}
                  data-track="rain"
                  aria-pressed={tracksState.rain.muted}
                  onClick={() => setMute('rain', !tracksState.rain.muted)}
                >M</button>
                <button
                  className={`solo-btn btn-small ${solo === 'rain' ? 'active' : ''}`}
                  data-track="rain"
                  aria-pressed={solo === 'rain'}
                  onClick={() => toggleSolo('rain')}
                >S</button>
              </div>
            </div>
          </div>

          {/* Wind */}
          <div
            className="card"
            data-track="wind"
            role="group"
            aria-label="Wind sound"
            tabIndex="0"
            onClick={() => toggleSolo('wind')}
            aria-pressed={solo === 'wind'}
          >
            <svg className="icon" viewBox="0 0 64 64" aria-hidden>
              <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 28c6-3 14-3 20 0s14 3 20 0" />
                <path d="M10 38c6-3 18-3 24 0s14 3 18 0" opacity="0.7" />
                <path d="M12 18c6-3 10-3 16 0s10 3 16 0" opacity="0.4" />
              </g>
            </svg>
            <div className="label">Wind</div>
            <div className="meta">Gentle whoosh • airy</div>
            <div className="card-controls">
              <label className="volume-control">
                <span className="sr-only">Adjust wind volume level</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={tracksState.wind.volume}
                  className="volume-slider"
                  data-track="wind"
                  onChange={(e) => setVolume('wind', parseFloat(e.target.value))}
                />
              </label>
              <div className="btn-group">
                <button
                  className={`mute-btn btn-small ${tracksState.wind.muted ? 'active' : ''}`}
                  data-track="wind"
                  aria-pressed={tracksState.wind.muted}
                  onClick={() => setMute('wind', !tracksState.wind.muted)}
                >M</button>
                <button
                  className={`solo-btn btn-small ${solo === 'wind' ? 'active' : ''}`}
                  data-track="wind"
                  aria-pressed={solo === 'wind'}
                  onClick={() => toggleSolo('wind')}
                >S</button>
              </div>
            </div>
          </div>

          {/* Piano */}
          <div
            className="card"
            data-track="piano"
            role="group"
            aria-label="Piano sound"
            tabIndex="0"
            onClick={() => toggleSolo('piano')}
            aria-pressed={solo === 'piano'}
          >
            <svg className="icon" viewBox="0 0 64 64" aria-hidden>
              <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="6" y="16" width="52" height="20" rx="2" />
                <path d="M14 20v12M22 20v12M30 20v12M38 20v12" strokeWidth="1.6" />
                <path d="M12 40h40" strokeWidth="1" opacity="0.6" />
              </g>
            </svg>
            <div className="label">Piano</div>
            <div className="meta">Soft keys • sparse notes</div>
            <div className="card-controls">
              <label className="volume-control">
                <span className="sr-only">Adjust piano volume level</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={tracksState.piano.volume}
                  className="volume-slider"
                  data-track="piano"
                  onChange={(e) => setVolume('piano', parseFloat(e.target.value))}
                />
              </label>
              <div className="btn-group">
                <button
                  className={`mute-btn btn-small ${tracksState.piano.muted ? 'active' : ''}`}
                  data-track="piano"
                  aria-pressed={tracksState.piano.muted}
                  onClick={() => setMute('piano', !tracksState.piano.muted)}
                >M</button>
                <button
                  className={`solo-btn btn-small ${solo === 'piano' ? 'active' : ''}`}
                  data-track="piano"
                  aria-pressed={solo === 'piano'}
                  onClick={() => toggleSolo('piano')}
                >S</button>
              </div>
            </div>
          </div>
        </section>

        <section className="master-controls" aria-label="Master mix">
          <h2>Master Mix</h2>
          <div className="master-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
            <div className="master-volume-control">
              <label htmlFor="master-volume">Master Volume</label>
              <input
                id="master-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              />
            </div>
            <div className="preset-controls" style={{ display: 'flex', gap: 12 }}>
              <button id="save-preset" className="btn btn-ghost" onClick={savePreset}>Save Preset</button>
              <button id="load-preset" className="btn btn-ghost" onClick={loadPreset}>Load Preset</button>
            </div>
          </div>
        </section>

        <section className="breathing-section">
          <h2>Breathing Exercises</h2>
          <div className="breathing-grid">
            {/* Box Breathing */}
            <div className="breathing-card">
              <h3>Box Breathing</h3>
              <p className="breathing-desc">Equal breathing pattern • 4 counts each</p>
              <button
                className={`breathing-btn ${activeBreathing === 'box' ? 'active' : ''}`}
                data-exercise="box"
                onClick={() => startBreathingExercise('box')}
              >
                {activeBreathing === 'box' ? 'Stop Exercise' : 'Start Exercise'}
              </button>
              <div ref={boxVisualRef} className="breathing-visual box-breathing" style={{ display: 'none' }}>
                <div className="breath-circle" />
                <div className="breath-label">Inhale</div>
              </div>
            </div>

            {/* 4-7-8 */}
            <div className="breathing-card">
              <h3>4-7-8 Breathing</h3>
              <p className="breathing-desc">Calming pattern • for deep relaxation</p>
              <button
                className={`breathing-btn ${activeBreathing === '478' ? 'active' : ''}`}
                data-exercise="478"
                onClick={() => startBreathingExercise('478')}
              >
                {activeBreathing === '478' ? 'Stop Exercise' : 'Start Exercise'}
              </button>
              <div ref={breath478VisualRef} className="breathing-visual breathing-478" style={{ display: 'none' }}>
                <div className="breath-circle" />
                <div className="breath-label">Inhale</div>
              </div>
            </div>

            {/* Diaphragm */}
            <div className="breathing-card">
              <h3>Diaphragmatic Breathing</h3>
              <p className="breathing-desc">Deep belly breathing • ground yourself</p>
              <button
                className={`breathing-btn ${activeBreathing === 'diaphragm' ? 'active' : ''}`}
                data-exercise="diaphragm"
                onClick={() => startBreathingExercise('diaphragm')}
              >
                {activeBreathing === 'diaphragm' ? 'Stop Exercise' : 'Start Exercise'}
              </button>
              <div ref={diaphragmVisualRef} className="breathing-visual breathing-diaphragm" style={{ display: 'none' }}>
                <div className="breath-circle" />
                <div className="breath-label">Breathe In</div>
              </div>
            </div>
          </div>
        </section>

        <section className="affirmations-section">
          <h2>Motivational Affirmations</h2>
          <div className="affirmations-controls">
            <button id="speak-affirmation" className="btn" onClick={speakAffirmation}>🔊 Speak Affirmation</button>
            <button id="next-affirmation" className="btn btn-ghost" onClick={nextAff}>Next Message</button>
            <label className="toggle" style={{ alignItems: 'center' }}>
              <input type="checkbox" id="auto-speak" />
              <span>Auto-speak during breathing</span>
            </label>
          </div>
          <div className="affirmation-display">
            <p id="current-affirmation" className="affirmation-text">{affirmationsList[affIndex]}</p>
          </div>
        </section>

        <footer className="foot">
          <p className="status">{startedUI ? 'Audio active — use controls to adjust layers.' : 'Audio is not started.'}</p>
        </footer>
      </main>
    </>
  );
}
