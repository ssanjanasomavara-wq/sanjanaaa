Find the Calm — Interactive Prototype

Files:
- `find-the-calm.html` — prototype page
- `find-the-calm.css` — styles
- `find-the-calm.js` — interactive logic with recorded audio layers
- `assets/audio/` — recorded ambient textures (rain, wind, piano)

## Features

### Audio Layers (Recorded Textures)
The prototype uses recorded ambient audio files for realistic soundscapes:
- **Rain**: Calm, steady ambient rain texture
- **Wind**: Gentle whoosh, airy wind texture  
- **Piano**: Soft keys with sparse, calming notes

Audio files are loaded via HTML5 Audio elements and connected to the Web Audio API for precise volume control and crossfading.

### Per-Layer Controls
Each sound layer has individual controls:
- **Volume Slider**: Adjust individual track volume (0.0 to 1.0)
- **Mute Button (M)**: Toggle mute for that layer
- **Solo Button (S)**: Isolate one layer (others fade to low volume)
- **Card Tap**: Tap any card to solo/unsolo that layer (legacy interaction)

### Master Mix Controls
- **Master Volume**: Global volume control affecting all layers
- **Save Preset**: Save current mix settings to localStorage
- **Load Preset**: Restore previously saved mix settings

Settings persist across browser sessions via localStorage.

### Interaction Modes
1. **Tap-to-solo**: Tap a card to solo/unsolo that track (smooth fade in/out)
2. **Long-press**: Hold a card for 550ms for haptic feedback and solo
3. **Button controls**: Use M (mute) and S (solo) buttons for precise control
4. **Keyboard**: Press Escape to clear solo and restore all tracks

### Haptic Feedback
- Uses `navigator.vibrate()` if available
- Short pulse (30ms) for taps and button clicks
- Long pulse (60ms) for long-press interactions
- Toggle "Disable Haptics" to turn off vibrations

## How it works

### Audio Architecture
The prototype uses MediaElementSource nodes connected to GainNodes for each track:
```
Audio Element (looping) → MediaElementSource → GainNode → AudioContext.destination
```

This allows:
- Seamless looping of recorded audio files
- Smooth volume crossfades via linearRampToValueAtTime
- Independent control of each layer
- Master volume control

### State Management
- Track state (volume, muted, solo) stored in track objects
- Preset data serialized to localStorage as JSON
- UI updated via `updateAllUI()` to keep buttons/sliders in sync

## Testing notes

### Local Testing
1. Start a local web server: `python3 -m http.server 8080`
2. Open `http://localhost:8080/find-the-calm.html`
3. Click "Start audio" (AudioContext requires user gesture)

### Audio Loading
- Audio files are preloaded with `preload="auto"`
- Playback starts immediately when "Start audio" is clicked
- All tracks loop seamlessly with `loop=true`

### Browser Compatibility
- Chrome/Edge: Full support for audio and haptics
- Firefox: Audio works, haptics may be limited
- Safari (iOS): Audio works, haptics limited to system settings
- Mobile browsers: Haptics only work on supported devices

### Haptics Testing
- **Android**: Works on most devices with Chrome/Firefox
- **iOS**: Limited by Safari restrictions and system vibration settings
- Desktop: No haptic support (message displayed)

For comprehensive mobile testing, see: `../mockups/TESTING_MOBILE.md`

## Accessibility

### ARIA Support
- All buttons have `aria-label` or visible text labels
- Sliders have `aria-label` attributes
- Solo/mute states use `aria-pressed` for screen readers
- Status updates are announced

### Keyboard Support
- Tab: Navigate through controls
- Enter/Space: Activate buttons
- Arrow keys: Adjust slider values
- Escape: Clear solo state and restore mix

### Visual Accessibility
- Sufficient color contrast (WCAG AA)
- Large touch targets (minimum 44×44px)
- Clear visual feedback for all interactive states
- Respects `prefers-reduced-motion` for animations

## Debug Panel

Enable the debug panel to monitor interactions:
- **URL parameter**: `?debug=1`
- **Keyboard shortcut**: Ctrl/Cmd + D
- **Button**: Click the "Debug" button in the header

The panel shows:
- Timestamps for all interactions
- Solo/unsolo events
- Mute state changes
- Haptic calls
- Volume adjustments

## Assets

Audio files are located in `assets/audio/`:
- `rain.mp3` — Rain ambient texture
- `wind.mp3` — Wind ambient texture
- `piano.mp3` — Piano ambient texture

**Note**: Current files are placeholder/minimal audio for prototype purposes. Replace with professional recorded textures for production.

See `assets/ATTRIBUTION.md` for licensing information and `assets/LICENSE` for asset licenses.

## Next steps

### Audio Enhancement
- Replace placeholder audio with high-quality recorded textures
- Add OGG format for better browser compatibility
- Optimize file sizes for faster loading
- Consider adding more layers (ocean, fire, birds)

### Feature Additions
- Visual equalizer/waveform display
- Multiple preset slots (not just one)
- Export/import presets as JSON files
- Crossfade time adjustment
- Individual pan controls (stereo positioning)

### Accessibility Improvements
- Add visual volume meters
- Provide alternative text descriptions of sounds
- Add closed captions for breathing exercises
- Support for high-contrast mode

Design update: A warmer palette has been applied to the mockup and prototype (accent: #D86249, bg: #FFF6F1). See `../mockups/presentation.html` for a quick comparison.

Recent updates:
- **2026-01-01**: Added recorded audio support, per-layer controls (volume, mute, solo), master mix, and preset save/load system
- **Previous**: Increased icon stroke weight and label contrast for improved readability on small screens