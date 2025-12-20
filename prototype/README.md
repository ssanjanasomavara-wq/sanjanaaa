Find the Calm — Interactive Prototype

Files:
- `find-the-calm.html` — prototype page
- `find-the-calm.css` — styles
- `find-the-calm.js` — interactive logic, synth-based layers

How it works:
- The prototype synthesizes three ambient layers (rain, wind, piano) using the Web Audio API.
- Tap a card to solo/unsolo that track (others fade down). Long-press does a stronger isolation and longer haptic.
- Haptics: uses `navigator.vibrate()` if available. Toggle "Disable Haptics" to turn off vibrations.

Testing notes:
- AudioContext must be started from a user gesture (click "Start audio").
- Haptics only works on supported mobile devices/browsers.

Next steps:
- Replace synth layers with recorded samples if you prefer recorded ambient textures.
- Add per-layer volume sliders and a master mix control.
- Add a small settings panel for accessibility: disable haptics, reduce motion, and an "audio-only" mode.

Design update: A warmer palette has been applied to the mockup and prototype (accent: #D86249, bg: #FFF6F1). See `mockups/presentation.html` for a quick comparison.

Recent tweaks: increased icon stroke weight and label contrast for improved readability on small screens.

Debug panel: you can enable an on-screen debug log by opening the prototype with `?debug=1` (e.g., `prototype/find-the-calm.html?debug=1`) or by toggling the **Debug** button in the header. The panel shows timestamps, taps, long-presses, solo/unsolo, and haptic calls; it has Clear and Close controls. You can also press **Ctrl/Cmd + D** to quickly toggle the panel. The panel state persists in the browser.