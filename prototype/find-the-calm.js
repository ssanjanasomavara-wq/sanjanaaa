// Interactive prototype JS — recorded ambient layers with per-layer controls
let ctx, tracks = {}, started = false;
let masterGain = null;
const DEFAULT_VOL = 0.7;
const SOLO_VOL = 1.0;
const MUTED_VOL = 0.12;

// Track configuration with audio file paths
const TRACK_CONFIG = {
  rain: { file: 'assets/audio/rain.mp3', label: 'Rain' },
  wind: { file: 'assets/audio/wind.mp3', label: 'Wind' },
  piano: { file: 'assets/audio/piano.mp3', label: 'Piano' }
};

// Helpers
function now(){ return ctx ? ctx.currentTime : 0 }
function linearTo(node, value, time=0.2){ try { if (node && node.gain){ node.gain.linearRampToValueAtTime(value, now()+time); } } catch(e){ debugLog('linearTo error', e.message); } }

// Debug helpers (enable with ?debug=1 or set window.FTC_DEBUG = true)
function isDebug(){ try { const url = new URL(window.location.href); return url.searchParams.get('debug') === '1' || window.FTC_DEBUG === true || localStorage.getItem('ftc_debug_visible') === '1'; } catch(e){ return false } }
function debugLog(...args){ if (!isDebug()) return; console.log('[find-the-calm]', ...args); try{ const el = window.__ftc_debug_panel; if (el){ const s = args.map(a=> (typeof a === 'string')? a : JSON.stringify(a)).join(' '); const line = document.createElement('div'); line.className='line'; line.textContent = new Date().toLocaleTimeString() + ' — ' + s; el.querySelector('.lines').appendChild(line); el.querySelector('.lines').scrollTop = el.querySelector('.lines').scrollHeight; } } catch(e){} }

// On-screen debug panel helpers
function appendDebugLine(msg){ try{
  let wrapper = document.querySelector('.ftc-debug .lines');
  if (!wrapper) return;
  const line = document.createElement('div'); line.className='line'; line.textContent = new Date().toLocaleTimeString() + ' — ' + msg;
  wrapper.appendChild(line);
  // keep scroll at bottom
  wrapper.scrollTop = wrapper.scrollHeight;
} catch(e){}
}

function createDebugPanel(){
  if (window.__ftc_debug_created) return;
  window.__ftc_debug_created = true;
  const panel = document.createElement('div'); panel.className = 'ftc-debug'; panel.setAttribute('role','log');
  panel.innerHTML = `<div class="hdr"><div class="title">Find the Calm — debug</div><div class="controls"><button data-action="clear">Clear</button><button data-action="close">Close</button></div></div><div class="lines"></div>`;
  document.body.appendChild(panel);
  window.__ftc_debug_panel = panel;
  panel.querySelector('button[data-action="clear"]').addEventListener('click', ()=>{ const w = panel.querySelector('.lines'); w.innerHTML=''; });
  panel.querySelector('button[data-action="close"]').addEventListener('click', ()=>{ panel.style.display='none'; localStorage.removeItem('ftc_debug_visible'); const btn = document.getElementById('debug-toggle'); if (btn) btn.setAttribute('aria-pressed','false'); });
  panel.style.display = 'block';
}

function showDebugPanel(){ createDebugPanel(); const panel = window.__ftc_debug_panel; if (panel) { panel.style.display = 'block'; localStorage.setItem('ftc_debug_visible','1'); const btn = document.getElementById('debug-toggle'); if (btn) btn.setAttribute('aria-pressed','true'); } }
function hideDebugPanel(){ const panel = window.__ftc_debug_panel; if (panel) { panel.style.display = 'none'; localStorage.removeItem('ftc_debug_visible'); const btn = document.getElementById('debug-toggle'); if (btn) btn.setAttribute('aria-pressed','false'); } }

// auto-create panel if debug enabled
if (isDebug() && typeof document !== 'undefined'){
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createDebugPanel); else createDebugPanel();
}

// Wire up debug toggle button and keyboard shortcut
if (typeof document !== 'undefined'){
  const setupDebugToggle = ()=>{
    const btn = document.getElementById('debug-toggle');
    if (!btn) return;
    btn.addEventListener('click', ()=>{
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      if (pressed) { hideDebugPanel(); btn.setAttribute('aria-pressed','false'); } else { showDebugPanel(); btn.setAttribute('aria-pressed','true'); }
    });
    // set initial state
    try{ const initial = localStorage.getItem('ftc_debug_visible') === '1' || (new URL(location.href).searchParams.get('debug') === '1'); if (initial){ btn.setAttribute('aria-pressed','true'); showDebugPanel(); } } catch(e){}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupDebugToggle); else setupDebugToggle();

  // keyboard: Ctrl/Cmd + D to toggle
  document.addEventListener('keydown', (e)=>{ if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd'){ e.preventDefault(); const btn = document.getElementById('debug-toggle'); if (btn) btn.click(); } });
}

// Create audio track from recorded file
function makeRecordedTrack(name, audioFile){
  const audio = new Audio(audioFile);
  audio.loop = true;
  audio.preload = 'auto';
  
  // Create MediaElementSource when context is available
  let source = null;
  let out = null;
  let sourceCreated = false;
  
  function ensureNodes(){
    if (!sourceCreated && ctx){
      source = ctx.createMediaElementSource(audio);
      out = ctx.createGain();
      out.gain.value = DEFAULT_VOL;
      source.connect(out);
      // connect to masterGain if available, otherwise to destination
      if (masterGain) out.connect(masterGain); else out.connect(ctx.destination);
      sourceCreated = true;
    }
  }
  
  function start(){
    ensureNodes();
    audio.play().catch(e => {
      debugLog('play error', name, e.message, '- Check network connection or file availability');
    });
  }
  
  function stop(){
    audio.pause();
    audio.currentTime = 0;
  }
  
  return {
    audio,
    get out(){ ensureNodes(); return out; },
    get source(){ ensureNodes(); return source; },
    start,
    stop,
    name,
    muted: false,
    volume: DEFAULT_VOL
  };
}

// Initialize AudioContext and tracks
async function initAudio(){
  if (started) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  // create a master gain so we can adjust master volume in one place
  masterGain = ctx.createGain();
  masterGain.gain.value = masterVolume;
  masterGain.connect(ctx.destination);
  
  // Create recorded tracks
  const rain = makeRecordedTrack('rain', TRACK_CONFIG.rain.file);
  const wind = makeRecordedTrack('wind', TRACK_CONFIG.wind.file);
  const piano = makeRecordedTrack('piano', TRACK_CONFIG.piano.file);
  
  // Start playback
  rain.start(); 
  wind.start(); 
  piano.start();
  
  tracks = {rain, wind, piano};
  started = true;
  
  document.querySelector('.status').textContent = 'Audio active — use controls to adjust layers.';
  debugLog('initAudio', ctx.state);
  debugLog('tracks', Object.keys(tracks));
  
  // Load saved preset if available
  loadPreset();
  updateAllUI();
  // ensure audio node volumes match current state
  applyTrackGains();
}

// Solo logic
let solo = null;
function setSolo(name){
  debugLog('setSolo', {requested:name, previous:solo});
  if (!ctx) return;
  if (solo === name){
    // unsolo
    Object.entries(tracks).forEach(([n,t]) => {
      const targetVol = t.muted ? 0 : t.volume;
      linearTo(t.out, targetVol);
    });
    debugLog('unsolo', name);
    solo = null;
    updateAllUI();
    return;
  }
  solo = name;
  Object.entries(tracks).forEach(([n,t]) => {
    if (n === name){
      linearTo(t.out, SOLO_VOL);
    } else {
      linearTo(t.out, MUTED_VOL);
    }
  });
  debugLog('soloed', name);
  updateAllUI();
}

// Volume control per layer
function setVolume(name, value){
  if (!tracks[name]) return;
  const track = tracks[name];
  track.volume = value;
  
  // Only apply if not soloing another track
  if (solo && solo !== name){
    // Keep at MUTED_VOL
    return;
  }
  
  if (track.muted){
    // Keep muted
    return;
  }
  
  if (solo === name){
    linearTo(track.out, SOLO_VOL);
  } else {
    linearTo(track.out, value);
  }
  
  debugLog('setVolume', name, value);
}

// Mute control per layer
function setMute(name, muted){
  if (!tracks[name]) return;
  const track = tracks[name];
  track.muted = muted;
  
  if (solo && solo !== name){
    // Already muted by solo
    return;
  }
  
  if (muted){
    linearTo(track.out, 0);
  } else if (solo === name){
    linearTo(track.out, SOLO_VOL);
  } else {
    linearTo(track.out, track.volume);
  }
  
  debugLog('setMute', name, muted);
  updateAllUI();
}

// Master volume
let masterVolume = 1.0;

function setMasterVolume(value){
  masterVolume = value;
  // Apply to master gain node (if available)
  if (masterGain){
    linearTo(masterGain, masterVolume);
  }
  debugLog('setMasterVolume', value);
}

// Apply per-track gains (used after loading preset or init)
function applyTrackGains(){
  if (!ctx) return;
  Object.entries(tracks).forEach(([name, track]) => {
    let targetVol;
    if (solo && solo !== name){
      targetVol = MUTED_VOL;
    } else if (track.muted){
      targetVol = 0;
    } else if (solo === name){
      targetVol = SOLO_VOL;
    } else {
      targetVol = track.volume;
    }
    linearTo(track.out, targetVol);
  });
}

// Preset system using localStorage
function savePreset(){
  const preset = {
    tracks: {},
    master: masterVolume,
    solo: solo
  };
  
  Object.entries(tracks).forEach(([name, track]) => {
    preset.tracks[name] = {
      volume: track.volume,
      muted: track.muted
    };
  });
  
  localStorage.setItem('ftc_preset', JSON.stringify(preset));
  debugLog('savePreset', preset);
  
  // Show feedback
  const btn = document.getElementById('save-preset');
  if (btn){
    const orig = btn.textContent;
    btn.textContent = '✓ Saved';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  }
}

function loadPreset(){
  try {
    const stored = localStorage.getItem('ftc_preset');
    if (!stored) return;
    
    const preset = JSON.parse(stored);
    debugLog('loadPreset', preset);
    
    // Apply preset
    Object.entries(preset.tracks || {}).forEach(([name, settings]) => {
      if (tracks[name]){
        // Validate and sanitize preset values
        const volume = (typeof settings.volume === 'number' && settings.volume >= 0 && settings.volume <= 1) 
          ? settings.volume 
          : DEFAULT_VOL;
        const muted = typeof settings.muted === 'boolean' ? settings.muted : false;
        
        tracks[name].volume = volume;
        tracks[name].muted = muted;
        
        // Update UI controls
        const volumeSlider = document.querySelector(`input[data-track="${name}"][type="range"]`);
        if (volumeSlider) volumeSlider.value = tracks[name].volume;
        
        const muteBtn = document.querySelector(`.mute-btn[data-track="${name}"]`);
        if (muteBtn) muteBtn.setAttribute('aria-pressed', tracks[name].muted.toString());
      }
    });
    
    if (preset.master !== undefined){
      masterVolume = preset.master;
      const masterSlider = document.getElementById('master-volume');
      if (masterSlider) masterSlider.value = masterVolume;
      if (masterGain) linearTo(masterGain, masterVolume);
    }
    
    if (preset.solo){
      solo = preset.solo;
    }
    
    // Apply audio settings
    updateAllUI();
    applyTrackGains();
    
  } catch (e) {
    debugLog('loadPreset error', e.message);
  }
} 

function updateAllUI(){
  // Update solo state on cards
  document.querySelectorAll('.card').forEach(btn => {
    const n = btn.dataset.track;
    const pressed = solo === n;
    btn.setAttribute('aria-pressed', pressed.toString());
    if (pressed) btn.classList.add('is-solo'); else btn.classList.remove('is-solo');
  });
  
  // Update mute button states
  Object.entries(tracks).forEach(([name, track]) => {
    const muteBtn = document.querySelector(`.mute-btn[data-track="${name}"]`);
    if (muteBtn){
      muteBtn.setAttribute('aria-pressed', track.muted.toString());
      muteBtn.classList.toggle('active', track.muted);
    }
    
    const soloBtn = document.querySelector(`.solo-btn[data-track="${name}"]`);
    if (soloBtn){
      const isSolo = solo === name;
      soloBtn.setAttribute('aria-pressed', isSolo.toString());
      soloBtn.classList.toggle('active', isSolo);
    }
  });
}

// Haptics helper
function doHaptic(short=false){
  const disabled = document.getElementById('disable-haptics') ? document.getElementById('disable-haptics').checked : false;
  debugLog('doHaptic', {short, disabled, vibrateAvailable: ('vibrate' in navigator)});
  if (disabled) return;
  if (navigator.vibrate){ navigator.vibrate(short?30:60); debugLog('vibrated', short?30:60); }
} 

// Wire up UI
document.getElementById('start').addEventListener('click', async (e)=>{
  await initAudio();
  if (ctx.state === 'suspended') await ctx.resume();
});

// card interactions
document.querySelectorAll('.card').forEach(btn => {
  let longpress = false, timer;
  btn.addEventListener('pointerdown', (ev)=>{
    timer = setTimeout(()=>{ longpress = true; btn.classList.add('pulse'); doHaptic(false); // long press effect
      debugLog('longpress', btn.dataset.track);
      // long press toggles stronger isolation (full solo)
      setSolo(btn.dataset.track);
    }, 550);
  });
  btn.addEventListener('pointerup', (ev)=>{
    clearTimeout(timer);
    if (!longpress){
      // regular tap
      btn.classList.add('pulse');
      setTimeout(()=>btn.classList.remove('pulse'), 420);
      doHaptic(true);
      debugLog('tap', btn.dataset.track);
      setSolo(btn.dataset.track);
    }
    longpress = false;
  });
  btn.addEventListener('pointerleave', ()=>{ clearTimeout(timer); longpress=false; });
});

// Accessibility: toggle to restore mix
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape'){
    solo = null; 
    Object.entries(tracks).forEach(([name,t]) => {
      const targetVol = t.muted ? 0 : t.volume;
      linearTo(t.out, targetVol);
    });
    updateAllUI();
  }
});

// Wire up per-layer controls (volume sliders, mute, solo buttons)
// These will be set up after DOM is ready
function setupLayerControls(){
  // Volume sliders
  document.querySelectorAll('.volume-slider').forEach(slider => {
    const trackName = slider.dataset.track;
    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      setVolume(trackName, value);
      doHaptic(true);
    });
  });
  
  // Mute buttons
  document.querySelectorAll('.mute-btn').forEach(btn => {
    const trackName = btn.dataset.track;
    btn.addEventListener('click', (e) => {
      if (!tracks[trackName]) return;
      const newMuted = !tracks[trackName].muted;
      setMute(trackName, newMuted);
      doHaptic(true);
    });
  });
  
  // Solo buttons
  document.querySelectorAll('.solo-btn').forEach(btn => {
    const trackName = btn.dataset.track;
    btn.addEventListener('click', (e) => {
      setSolo(trackName);
      doHaptic(true);
    });
  });
  
  // Master volume
  const masterSlider = document.getElementById('master-volume');
  if (masterSlider){
    masterSlider.addEventListener('input', (e) => {
      setMasterVolume(parseFloat(e.target.value));
    });
  }
  
  // Preset buttons
  const saveBtn = document.getElementById('save-preset');
  if (saveBtn){
    saveBtn.addEventListener('click', () => {
      savePreset();
      doHaptic(true);
    });
  }
  
  const loadBtn = document.getElementById('load-preset');
  if (loadBtn){
    loadBtn.addEventListener('click', () => {
      loadPreset();
      doHaptic(true);
    });
  }
}

// Setup controls when DOM is ready
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', setupLayerControls);
} else {
  setupLayerControls();
}

// Debug: if audio isn't allowed until gesture, we show message
if (!('vibrate' in navigator)){
  // no haptics support — add small notice
  const el = document.createElement('p'); el.textContent = 'Note: Haptics are not available in this browser.'; el.style.color='#8a98ac'; document.querySelector('.foot').appendChild(el);
}

// ===== BREATHING EXERCISES & AFFIRMATIONS =====

// Affirmations database
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

let currentAffirmationIndex = 0;

// Initialize affirmations
function initAffirmations(){
  showAffirmation(0);
}

function showAffirmation(index){
  currentAffirmationIndex = index % affirmations.length;
  const affirmationEl = document.getElementById('current-affirmation');
  if (affirmationEl){
    affirmationEl.textContent = affirmations[currentAffirmationIndex];
  }
}

function nextAffirmation(){
  showAffirmation(currentAffirmationIndex + 1);
}

function speakAffirmation(){
  const text = affirmations[currentAffirmationIndex];
  if ('speechSynthesis' in window){
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for calming effect
    utterance.pitch = 0.95;
    utterance.volume = 0.8;
    
    // Use a soothing voice if available
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0){
      // Try to find a female voice for calming effect
      const femaleVoice = voices.find(v => v.name.includes('female') || v.name.includes('Female') || v.name.includes('woman'));
      if (femaleVoice){
        utterance.voice = femaleVoice;
      } else if (voices.length > 0){
        utterance.voice = voices[0];
      }
    }
    
    speechSynthesis.speak(utterance);
    debugLog('speak affirmation', text);
  }
}

// Wire up affirmation controls
document.getElementById('speak-affirmation').addEventListener('click', speakAffirmation);
document.getElementById('next-affirmation').addEventListener('click', nextAffirmation);

// Breathing exercises configuration
const breathingExercises = {
  box: {
    name: 'Box Breathing',
    duration: 16, // 16 seconds per cycle (4-4-4-4)
    instructions: {
      inhale: 4,
      hold1: 4,
      exhale: 4,
      hold2: 4
    }
  },
  '478': {
    name: '4-7-8 Breathing',
    duration: 18, // 4-7-8 seconds
    instructions: {
      inhale: 4,
      hold: 7,
      exhale: 8
    }
  },
  diaphragm: {
    name: 'Diaphragmatic Breathing',
    duration: 10, // 4 second inhale, 6 second exhale
    instructions: {
      inhale: 4,
      exhale: 6
    }
  }
};

let activeBreathingExercise = null;
const breathingTimers = {}; // store timers for label cycles

function startBreathingExercise(exerciseKey){
  const exercise = breathingExercises[exerciseKey];
  if (!exercise) return;

  // If another exercise is running, stop it first
  if (activeBreathingExercise && activeBreathingExercise !== exerciseKey){
    stopBreathingExercise(activeBreathingExercise);
  }

  const btn = document.querySelector(`.breathing-btn[data-exercise="${exerciseKey}"]`);
  // Fix selector: box uses 'box-breathing', others use 'breathing-{type}'
  const visualClass = (exerciseKey === 'box') ? 'box-breathing' : `breathing-${exerciseKey}`;
  const visual = document.querySelector(`.${visualClass}`);

  if (!btn || !visual) return;

  // Toggle behavior
  const isStarting = !btn.classList.contains('active');

  if (isStarting){
    // Start
    activeBreathingExercise = exerciseKey;
    btn.classList.add('active');
    btn.textContent = 'Stop Exercise';
    visual.style.display = 'flex';
    visual.classList.add('active'); // enables CSS animation

    // Start label cycle for this exercise
    startLabelCycle(exerciseKey);

    // Auto-speak affirmation if enabled
    if (document.getElementById('auto-speak').checked){
      speakAffirmation();
    }

  } else {
    // Stop
    stopBreathingExercise(exerciseKey);
  }

  debugLog('toggled breathing', exerciseKey, isStarting ? 'started' : 'stopped');
}

function stopBreathingExercise(exerciseKey){
  const btn = document.querySelector(`.breathing-btn[data-exercise="${exerciseKey}"]`);
  // Fix selector: box uses 'box-breathing', others use 'breathing-{type}'
  const visualClass = (exerciseKey === 'box') ? 'box-breathing' : `breathing-${exerciseKey}`;
  const visual = document.querySelector(`.${visualClass}`);
  if (btn){
    btn.classList.remove('active');
    btn.textContent = 'Start Exercise';
  }
  if (visual){
    visual.style.display = 'none';
    visual.classList.remove('active');
    // reset label to default
    const label = visual.querySelector('.breath-label');
    if (label) label.textContent = (exerciseKey === 'diaphragm') ? 'Breathe In' : 'Inhale';
  }

  // Clear any timers
  if (breathingTimers[exerciseKey]){
    clearTimeout(breathingTimers[exerciseKey]);
    delete breathingTimers[exerciseKey];
  }

  // If stopping the currently active exercise, clear activeBreathingExercise
  if (activeBreathingExercise === exerciseKey){
    activeBreathingExercise = null;
  }

  // Stop any TTS speaking
  if ('speechSynthesis' in window){
    speechSynthesis.cancel();
  }
}

// Create a label sequence based on exercise instructions and loop it
function startLabelCycle(exerciseKey){
  const exercise = breathingExercises[exerciseKey];
  // Fix selector: box uses 'box-breathing', others use 'breathing-{type}'
  const visualClass = (exerciseKey === 'box') ? 'box-breathing' : `breathing-${exerciseKey}`;
  const visual = document.querySelector(`.${visualClass}`);
  if (!visual || !exercise) return;
  const labelEl = visual.querySelector('.breath-label');
  if (!labelEl) return;

  // Build sequence array: {text, seconds}
  let seq = [];
  if (exerciseKey === 'box'){
    seq = [
      {text: 'Breathe In', seconds: exercise.instructions.inhale},
      {text: 'Hold', seconds: exercise.instructions.hold1},
      {text: 'Breathe Out', seconds: exercise.instructions.exhale},
      {text: 'Hold', seconds: exercise.instructions.hold2}
    ];
  } else if (exerciseKey === '478' || exerciseKey === '4-7-8'){
    seq = [
      {text: 'Breathe In', seconds: exercise.instructions.inhale},
      {text: 'Hold', seconds: exercise.instructions.hold},
      {text: 'Breathe Out', seconds: exercise.instructions.exhale}
    ];
  } else if (exerciseKey === 'diaphragm' || exerciseKey === 'diaphragm'){
    seq = [
      {text: 'Breathe In', seconds: exercise.instructions.inhale},
      {text: 'Breathe Out', seconds: exercise.instructions.exhale}
    ];
  } else {
    // fallback: single inhale/exhale
    seq = [{text: 'Breathe In', seconds: 4}, {text: 'Breathe Out', seconds: 4}];
  }

  // Helper to run the sequence in a loop using setTimeout chaining
  let index = 0;
  function runStep(){
    // If exercise stopped, bail out
    if (activeBreathingExercise !== exerciseKey) return;

    const step = seq[index];
    labelEl.textContent = step.text;
    // optional: announce step with TTS when auto-speak is enabled
    if (document.getElementById('auto-speak').checked){
      speakText(step.text);
    }

    // Schedule next step
    breathingTimers[exerciseKey] = setTimeout(() => {
      index = (index + 1) % seq.length;
      runStep();
    }, step.seconds * 1000);
  }

  // Clear any existing timer and start
  if (breathingTimers[exerciseKey]){
    clearTimeout(breathingTimers[exerciseKey]);
    delete breathingTimers[exerciseKey];
  }
  runStep();
}

// small helper to speak step text (non-blocking)
function speakText(text){
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.0;
  u.pitch = 1.0;
  u.volume = 0.9;
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) u.voice = voices[0];
  speechSynthesis.speak(u);
}

// Wire up breathing exercise buttons
document.querySelectorAll('.breathing-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const exerciseKey = btn.dataset.exercise;
    startBreathingExercise(exerciseKey);
  });
});

// Load voices when available (for TTS)
if ('speechSynthesis' in window){
  speechSynthesis.onvoiceschanged = () => {
    debugLog('voices loaded');
  };
}

// Initialize affirmations on page load
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initAffirmations);
} else {
  initAffirmations();
}
