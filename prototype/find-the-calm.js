// Interactive prototype JS — synth-based ambient layers
let ctx, tracks = {}, started = false;
const DEFAULT_VOL = 0.7;
const SOLO_VOL = 1.0;
const MUTED_VOL = 0.12;

// Helpers
function now(){ return ctx.currentTime }
function linearTo(node, value, time=0.2){ node.gain.linearRampToValueAtTime(value, now()+time) }

// Debug helpers (enable with ?debug=1 or set window.FTC_DEBUG = true)
function isDebug(){ try { const url = new URL(window.location.href); return url.searchParams.get('debug') === '1' || window.FTC_DEBUG === true || localStorage.getItem('ftc_debug_visible') === '1'; } catch (e){ return !!window.FTC_DEBUG || localStorage.getItem('ftc_debug_visible') === '1'; } }
function debugLog(...args){ if (!isDebug()) return; console.log('[find-the-calm]', ...args); try{ const el = window.__ftc_debug_panel; if (el){ const s = args.map(a=> (typeof a === 'string')? a : JSON.stringify(a)).join(' '); appendDebugLine(s); } }catch(e){} }

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
  panel.innerHTML = `<div class="hdr"><div class="title">Find the Calm — debug</div><div class="controls"><button data-action="clear">Clear</button><button data-action="close">Close</button></div></div><div class="lines" aria-live="polite"></div>`;
  document.body.appendChild(panel);
  window.__ftc_debug_panel = panel;
  panel.querySelector('button[data-action="clear"]').addEventListener('click', ()=>{ const w = panel.querySelector('.lines'); w.innerHTML=''; });
  panel.querySelector('button[data-action="close"]').addEventListener('click', ()=>{ panel.style.display='none'; localStorage.removeItem('ftc_debug_visible'); const btn = document.getElementById('debug-toggle'); if (btn) btn.setAttribute('aria-pressed','false'); });
  panel.style.display = 'block';
}

function showDebugPanel(){ createDebugPanel(); const panel = window.__ftc_debug_panel; if (panel) { panel.style.display = 'block'; localStorage.setItem('ftc_debug_visible','1'); const btn = document.getElementById('debug-toggle'); if (btn) btn.setAttribute('aria-pressed','true'); }}
function hideDebugPanel(){ const panel = window.__ftc_debug_panel; if (panel) { panel.style.display = 'none'; localStorage.removeItem('ftc_debug_visible'); const btn = document.getElementById('debug-toggle'); if (btn) btn.setAttribute('aria-pressed','false'); }}

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
    try{ const initial = localStorage.getItem('ftc_debug_visible') === '1' || (new URL(location.href).searchParams.get('debug') === '1'); if (initial){ btn.setAttribute('aria-pressed','true'); showDebugPanel(); } }catch(e){}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupDebugToggle); else setupDebugToggle();

  // keyboard: Ctrl/Cmd + D to toggle
  document.addEventListener('keydown', (e)=>{ if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd'){ e.preventDefault(); const btn = document.getElementById('debug-toggle'); if (btn) btn.click(); }});
}

// Create noise buffer
function createNoiseBuffer(duration=1){
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, sr*duration, sr);
  const data = buf.getChannelData(0);
  for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * (Math.random()*0.5);
  return buf;
}

// Rain: filtered white noise + light amplitude modulation
function makeRain(){
  const out = ctx.createGain(); out.gain.value = DEFAULT_VOL;
  const buff = createNoiseBuffer(2);
  const src = ctx.createBufferSource(); src.buffer = buff; src.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000; lp.Q.value = 0.8;
  // gentle tremolo
  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.5;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.25; // depth
  lfo.connect(lfoGain); lfoGain.connect(out.gain);

  src.connect(hp); hp.connect(lp); lp.connect(out);
  function start(){ src.start(); lfo.start(); }
  function stop(){ try{ src.stop() }catch{}; try{ lfo.stop() }catch{} }
  return {out, start, stop};
}

// Wind: filtered noise with lowcut and slow evolving filter
function makeWind(){
  const out = ctx.createGain(); out.gain.value = DEFAULT_VOL * 0.85;
  const buff = createNoiseBuffer(3);
  const src = ctx.createBufferSource(); src.buffer = buff; src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 80;
  src.connect(lp); lp.connect(hp); hp.connect(out);
  // slow filter sweep
  const sweep = () => {
    const f = 800 + Math.random()*800;
    lp.frequency.linearRampToValueAtTime(f, now()+6 + Math.random()*4);
  }
  let sweepInterval;
  function start(){ src.start(); sweepInterval = setInterval(sweep, 4000); sweep(); }
  function stop(){ clearInterval(sweepInterval); try{ src.stop() }catch{} }
  return {out, start, stop};
}

// Piano: sparse plucked notes using oscillators + envelope
function makePiano(){
  const master = ctx.createGain(); master.gain.value = DEFAULT_VOL * 0.9;
  let intervalId;
  const notes = [220, 262, 196, 330, 246]; // A3, C4, G3, E4, B3
  function playNote(freq){
    const osc = ctx.createOscillator(); osc.type = 'triangle';
    const g = ctx.createGain();
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, now());
    g.gain.exponentialRampToValueAtTime(0.2, now()+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now()+1.2);
    osc.connect(g); g.connect(master);
    osc.start(); osc.stop(now()+1.3);
  }
  function start(){
    intervalId = setInterval(()=>{
      const n = notes[Math.floor(Math.random()*notes.length)];
      playNote(n * (0.5 + Math.random()*1.0));
    }, 700 + Math.random()*700);
  }
  function stop(){ clearInterval(intervalId); }
  return {out: master, start, stop};
}

// Initialize AudioContext and tracks
let masterGain;
const volumes = {rain: DEFAULT_VOL, wind: DEFAULT_VOL, piano: DEFAULT_VOL};
async function initAudio(){
  if (started) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain(); masterGain.gain.value = 1; masterGain.connect(ctx.destination);
  const rain = makeRain();
  const wind = makeWind();
  const piano = makePiano();
  // connect to master
  rain.out.connect(masterGain);
  wind.out.connect(masterGain);
  piano.out.connect(masterGain);
  rain.start(); wind.start(); piano.start();
  tracks = {rain, wind, piano};
  started = true;
  document.querySelector('.status').textContent = 'Audio active — tap a card to isolate a sound.';
  // wire up UI controls
  setupLayerControls();
  setupMasterControl();
  debugLog('initAudio', ctx.state);
  debugLog('tracks', Object.keys(tracks));
}

// Solo logic
let solo = null;
function setSolo(name){
  debugLog('setSolo', {requested:name, previous:solo});
  if (!ctx) return;
  if (solo === name){
    // unsolo: restore to user volumes
    Object.entries(tracks).forEach(([n,t]) => linearTo(t.out, volumes[n] ?? DEFAULT_VOL));
    debugLog('unsolo', name);
    solo = null;
    updateUI();
    return;
  }
  solo = name;
  Object.entries(tracks).forEach(([n,t]) => {
    linearTo(t.out, n===name? Math.max(volumes[n] || DEFAULT_VOL, SOLO_VOL):MUTED_VOL);
  });
  debugLog('soloed', name);
  updateUI();
}  

function updateUI(){
  document.querySelectorAll('.card').forEach(btn => {
    const n = btn.dataset.track;
    const pressed = solo === n;
    btn.setAttribute('aria-pressed', pressed.toString());
    if (pressed) btn.classList.add('is-solo'); else btn.classList.remove('is-solo');
  });
}

// Haptics helper
function doHaptic(short=false){
  const disabled = document.getElementById('disable-haptics').checked;
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
    solo = null; Object.entries(tracks).forEach(([n,t]) => linearTo(t.out, volumes[n] || DEFAULT_VOL)); updateUI();
  }
});

// Layer controls wiring
function setupLayerControls(){
  document.querySelectorAll('.card').forEach(card=>{
    const name = card.dataset.track;
    const volEl = card.querySelector('.volume');
    if (volEl){
      volEl.value = volumes[name];
      volEl.addEventListener('input', (e)=>{
        const v = parseFloat(e.target.value);
        volumes[name] = v;
        linearTo(tracks[name].out, v);
        debugLog('volume-change', name, v);
      });
    }
    const muteBtn = card.querySelector('.mute');
    if (muteBtn){
      muteBtn.addEventListener('click', ()=>{
        const pressed = muteBtn.getAttribute('aria-pressed') === 'true';
        if (pressed){
          // unmute: restore previous volume
          muteBtn.setAttribute('aria-pressed','false');
          linearTo(tracks[name].out, volumes[name] || DEFAULT_VOL);
          debugLog('unmute', name);
        } else {
          muteBtn.setAttribute('aria-pressed','true');
          linearTo(tracks[name].out, 0);
          debugLog('mute', name);
        }
      });
    }
    const soloBtn = card.querySelector('.solo');
    if (soloBtn){
      soloBtn.addEventListener('click', ()=>{
        setSolo(name);
      });
    }
  });
}

function setupMasterControl(){
  const master = document.getElementById('master-volume');
  if (!master) return;
  master.addEventListener('input', (e)=>{
    const v = parseFloat(e.target.value);
    masterGain.gain.linearRampToValueAtTime(v, now()+0.1);
    debugLog('master', v);
  });
}


// Debug: if audio isn't allowed until gesture, we show message
if (!('vibrate' in navigator)){
  // no haptics support — add small notice
  const el = document.createElement('p'); el.textContent = 'Note: Haptics are not available in this browser.'; el.style.color='#8a98ac'; document.querySelector('.foot').appendChild(el);
}
