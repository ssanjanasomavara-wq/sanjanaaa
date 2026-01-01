/*
prototype/find-the-calm.js

Replaces makeRecordedTrack to provide WebAudio-generated fallbacks (rain/wind/piano)
when media files fail to load or play (invalid/404 MP3s). The returned track object
exposes: play(), stop(), setVolume(value 0..1), dispose().

This implementation tries to use an HTMLAudioElement -> MediaElementSource to
play real audio. If that fails (error event, decode/play failure, or promise
rejection from play()), it falls back to generating audio entirely in the
AudioContext using noise/oscillators tuned to the requested type.
*/

// Exported function used by the app to create a track representing a recorded
// media file. The `type` parameter is one of: 'rain', 'wind', 'piano'.
export async function makeRecordedTrack(audioContext, url, { type = 'rain', loop = true } = {}) {
  if (!audioContext) throw new Error('AudioContext is required');

  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0.0; // start muted
  masterGain.connect(audioContext.destination);

  let usingFallback = false;
  let audioEl = null;
  let mediaSource = null;
  let fallbackNodes = null; // object to keep track of created nodes for fallback
  let playing = false;

  // Helpers to create noise and oscillator fallbacks
  function createWhiteNoiseBuffer(durationSeconds = 2) {
    const sampleRate = audioContext.sampleRate;
    const length = Math.max(1, Math.floor(durationSeconds * sampleRate));
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1);
    return buffer;
  }

  function createLoopingNoiseSource(filterOptions = {}) {
    const buffer = createWhiteNoiseBuffer(2);
    const src = audioContext.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const gain = audioContext.createGain();
    gain.gain.value = 1.0;
    let node = src;
    src.connect(gain);

    // optional filter
    if (filterOptions.type) {
      const filter = audioContext.createBiquadFilter();
      filter.type = filterOptions.type;
      if (filterOptions.frequency) filter.frequency.value = filterOptions.frequency;
      if (filterOptions.Q) filter.Q.value = filterOptions.Q;
      gain.connect(filter);
      node = filter;
    } else {
      node = gain;
    }

    return { src, gain, output: node };
  }

  function createWindFallback() {
    // Wind: low-pass filtered noise with slow amplitude modulation
    const { src, gain, output } = createLoopingNoiseSource({ type: 'lowpass', frequency: 800 });
    const ampLfo = audioContext.createOscillator();
    const ampLfoGain = audioContext.createGain();
    ampLfo.frequency.value = 0.1 + Math.random() * 0.2; // slow wobble
    ampLfo.type = 'sine';
    ampLfoGain.gain.value = 0.5;
    ampLfo.connect(ampLfoGain);
    ampLfoGain.connect(gain.gain);

    // small secondary high-frequency noise bursts to simulate gusts
    const gustFilter = audioContext.createBiquadFilter();
    gustFilter.type = 'bandpass';
    gustFilter.frequency.value = 2500;
    gustFilter.Q.value = 1.2;
    const gustGain = audioContext.createGain();
    gustGain.gain.value = 0.0;

    const gustBuf = createWhiteNoiseBuffer(0.4);
    const gustSrc = audioContext.createBufferSource();
    gustSrc.buffer = gustBuf;
    gustSrc.loop = true;
    gustSrc.connect(gustFilter);
    gustFilter.connect(gustGain);

    // connect to final output
    output.connect(gustGain);

    return {
      start: () => {
        try { src.start(0); } catch (e) {}
        try { ampLfo.start(0); } catch (e) {}
        try { gustSrc.start(0); } catch (e) {}
        // slowly ramp gustGain to produce occasional gusts via periodic modulation
        // We'll use another slow oscillator to modulate gust gain
        const gustLfo = audioContext.createOscillator();
        gustLfo.frequency.value = 0.05 + Math.random() * 0.08;
        const gustLfoGain = audioContext.createGain();
        gustLfoGain.gain.value = 0.6;
        gustLfo.connect(gustLfoGain);
        gustLfoGain.connect(gustGain.gain);
        try { gustLfo.start(0); } catch (e) {}
        // keep references so we can stop later
        fallbackNodes._ampLfo = ampLfo;
        fallbackNodes._gustSrc = gustSrc;
        fallbackNodes._gustLfo = gustLfo;
      },
      stop: () => {
        try { src.stop(0); } catch (e) {}
        try { ampLfo.stop(0); } catch (e) {}
        try { fallbackNodes._gustSrc && fallbackNodes._gustSrc.stop(0); } catch (e) {}
        try { fallbackNodes._gustLfo && fallbackNodes._gustLfo.stop(0); } catch (e) {}
      },
      connect: (dest) => {
        output.connect(dest);
        gustGain.connect(dest);
      },
      setVolume: (v) => {
        gain.gain.value = v;
        gustGain.gain.value = Math.max(0, v * 0.6);
      }
    };
  }

  function createRainFallback() {
    // Rain: brighter, highpassed noise with short dynamics
    const { src, gain, output } = createLoopingNoiseSource({ type: 'highpass', frequency: 1500 });

    // Create rapid randomized bursts via periodic amplitude modulation
    const rainLfo = audioContext.createOscillator();
    rainLfo.type = 'square';
    rainLfo.frequency.value = 20 + Math.random() * 30; // rapid pulses
    const rainLfoGain = audioContext.createGain();
    rainLfoGain.gain.value = 0.2 + Math.random() * 0.4; // depth
    rainLfo.connect(rainLfoGain);
    rainLfoGain.connect(gain.gain);

    return {
      start: () => {
        try { src.start(0); } catch (e) {}
        try { rainLfo.start(0); } catch (e) {}
        fallbackNodes._rainLfo = rainLfo;
      },
      stop: () => {
        try { src.stop(0); } catch (e) {}
        try { fallbackNodes._rainLfo && fallbackNodes._rainLfo.stop(0); } catch (e) {}
      },
      connect: (dest) => output.connect(dest),
      setVolume: (v) => gain.gain.value = v
    };
  }

  function createPianoFallback() {
    // Piano-like background: multiple detuned oscillators with fast attack slow decay
    const baseFreq = 220 + Math.random() * 80; // A3-ish to C4-ish for background
    const oscCount = 3;
    const oscs = [];
    const oscGain = audioContext.createGain();
    oscGain.gain.value = 0.0; // controlled via envelope

    for (let i = 0; i < oscCount; i++) {
      const o = audioContext.createOscillator();
      o.type = i === 0 ? 'triangle' : (i === 1 ? 'sine' : 'sawtooth');
      o.frequency.value = baseFreq * (1 + (i - 1) * 0.01); // slight detune
      const detune = (Math.random() - 0.5) * 10;
      o.detune.value = detune;
      o.connect(oscGain);
      oscs.push(o);
    }

    // gentle lowpass to soften
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1600;
    oscGain.connect(filter);

    // create a slow amplitude modulation for subtle movement
    const lfo = audioContext.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 0.4;
    lfo.connect(lfoGain);
    lfoGain.connect(oscGain.gain);

    return {
      start: () => {
        oscs.forEach(o => { try { o.start(0); } catch (e) {} });
        try { lfo.start(0); } catch (e) {}
        fallbackNodes._oscs = oscs;
        fallbackNodes._pLfo = lfo;
      },
      stop: () => {
        oscs.forEach(o => { try { o.stop(0); } catch (e) {} });
        try { fallbackNodes._pLfo && fallbackNodes._pLfo.stop(0); } catch (e) {}
      },
      connect: (dest) => filter.connect(dest),
      setVolume: (v) => oscGain.gain.value = v
    };
  }

  function createFallbackForType(t) {
    if (t === 'wind') return createWindFallback();
    if (t === 'rain') return createRainFallback();
    // default piano
    return createPianoFallback();
  }

  // Primary attempt: use HTMLAudioElement + MediaElementAudioSourceNode
  function setupMediaElement() {
    return new Promise((resolve) => {
      audioEl = new Audio();
      audioEl.crossOrigin = 'anonymous';
      audioEl.src = url;
      audioEl.loop = !!loop;
      audioEl.preload = 'auto';

      let resolved = false;

      function onCanPlay() {
        if (resolved) return; resolved = true;
        try {
          mediaSource = audioContext.createMediaElementSource(audioEl);
          mediaSource.connect(masterGain);
        } catch (err) {
          // Some browsers disallow createMediaElementSource for certain crossOrigin cases
        }
        cleanupListeners();
        resolve({ success: true });
      }

      function onError() {
        if (resolved) return; resolved = true;
        cleanupListeners();
        resolve({ success: false });
      }

      function onPlayRejected(err) {
        // play() might be rejected by autoplay policies — we'll treat rejections as failure
        // but we'll still resolve success true if media canplaythrough (user gesture may be
        // required to actually hear it). To keep things simple: if play rejects immediately
        // we'll fallback.
        // This handler is used below.
      }

      function cleanupListeners() {
        audioEl.removeEventListener('canplaythrough', onCanPlay);
        audioEl.removeEventListener('error', onError);
      }

      audioEl.addEventListener('canplaythrough', onCanPlay);
      audioEl.addEventListener('error', onError);

      // Kick off load. Many browsers won't actually fetch until play or load() called.
      // Use load() which will trigger canplaythrough/error if reachable.
      try { audioEl.load(); } catch (e) {}

      // If load doesn't trigger, set a timeout to consider it failed after some seconds
      setTimeout(() => {
        if (resolved) return;
        // if audio element has networkState indicating no source, treat as error
        const ns = audioEl && audioEl.networkState;
        if (ns === 3 /* NETWORK_NO_SOURCE */) {
          onError();
        } else {
          // Not decisive — attempt to consider available if readyState suggests playable
          const ready = audioEl && audioEl.readyState;
          if (ready >= 3) onCanPlay(); else onError();
        }
      }, 3000);
    });
  }

  // Initialize: try media element then fallback if necessary
  async function init() {
    const res = await setupMediaElement();
    if (!res.success) {
      usingFallback = true;
      fallbackNodes = {};
      const fallback = createFallbackForType(type);
      fallbackNodes.fallback = fallback;
      // connect fallback to masterGain
      fallback.connect(masterGain);
    }
  }

  // Kick off initialization but don't await in constructor so UI can create quickly
  const initPromise = init();

  async function ensureAudioContextResumed() {
    if (audioContext.state === 'suspended') {
      try { await audioContext.resume(); } catch (e) {}
    }
  }

  async function play() {
    await ensureAudioContextResumed();
    await initPromise;

    if (!usingFallback && audioEl) {
      // Attempt to play the audio element. If it errors we'll switch to fallback.
      try {
        // connect mediaSource if not already connected (some browsers prevented earlier)
        if (mediaSource && !mediaSource.connect) {
          try { mediaSource.connect(masterGain); } catch (e) {}
        }
        const p = audioEl.play();
        if (p && typeof p.then === 'function') {
          await p.catch(async (err) => {
            // failed to play; fallback
            console.warn('Media play() rejected, switching to synthetic fallback', err);
            await switchToFallback();
          });
        }
      } catch (err) {
        console.warn('Error playing media element, switching to fallback', err);
        await switchToFallback();
      }
    }

    if (usingFallback && fallbackNodes && fallbackNodes.fallback) {
      fallbackNodes.fallback.start();
    }

    // Fade volume to default (0.9) for smoother start — caller should change if desired
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioContext.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.9, audioContext.currentTime + 0.5);

    playing = true;
  }

  async function switchToFallback() {
    if (usingFallback) return;
    usingFallback = true;
    // stop and disconnect media element
    try { audioEl && audioEl.pause(); } catch (e) {}
    try { mediaSource && mediaSource.disconnect(); } catch (e) {}

    fallbackNodes = {};
    const fallback = createFallbackForType(type);
    fallbackNodes.fallback = fallback;
    fallback.connect(masterGain);
    if (playing) fallback.start();
  }

  function stop() {
    // Fade out then stop
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioContext.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.0, audioContext.currentTime + 0.5);

    if (!usingFallback && audioEl) {
      try { audioEl.pause(); audioEl.currentTime = 0; } catch (e) {}
    }

    if (usingFallback && fallbackNodes && fallbackNodes.fallback) {
      try { fallbackNodes.fallback.stop(); } catch (e) {}
    }

    playing = false;
  }

  function setVolume(v) {
    const vol = Math.max(0, Math.min(1, v));
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setValueAtTime(vol, audioContext.currentTime);

    if (usingFallback && fallbackNodes && fallbackNodes.fallback && typeof fallbackNodes.fallback.setVolume === 'function') {
      try { fallbackNodes.fallback.setVolume(vol); } catch (e) {}
    }
  }

  function dispose() {
    try { stop(); } catch (e) {}
    try { masterGain.disconnect(); } catch (e) {}
    if (audioEl) {
      try {
        audioEl.pause();
        audioEl.src = '';
        audioEl.load();
      } catch (e) {}
      audioEl = null;
    }
    if (fallbackNodes) {
      // attempt to stop any left oscillators/buffers
      try { fallbackNodes.fallback && fallbackNodes.fallback.stop(); } catch (e) {}
      fallbackNodes = null;
    }
  }

  function isPlaying() { return playing; }

  // Return the track API
  return {
    play,
    stop,
    setVolume,
    dispose,
    isPlaying,
    // internal for debugging
    _usesFallback: () => usingFallback
  };
}
