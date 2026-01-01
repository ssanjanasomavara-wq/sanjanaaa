Find the Calm — Visual mockup & Interactive Prototype

Files:
- `find-the-calm.html` — static visual mockup (mobile-first)
- `find-the-calm.css` — styles, tokens, animations
- `TESTING_MOBILE.md` — QA checklist for mobile device testing

## Design goals
- Calm, soft palette with approachable rounded cards
- Clear visual feedback for a "solo/isolated" state
- Focus on large tappable targets and subtle motion
- Per-layer controls for volume, mute, and solo

## Design tokens (quick reference)
- Colors: bg #FFF6F1, card #fffaf6, accent #E07A5F, muted #8A6F6B
- Spacing: base gap 16px, card padding 18px, radius 14–16px
- Motion: 200–260ms ease, use reduced-motion preference

Note: A warmer palette was applied on 2025-12-20; see `presentation.html` for a before/after comparison.

Recent tweaks: increased icon stroke weight and label contrast for improved readability on small screens.

## Interactive Prototype

The interactive prototype is located in `../prototype/` and includes:

### Recorded Audio Layers
- **Rain**: Recorded rain ambient texture (assets/audio/rain.mp3)
- **Wind**: Recorded wind ambient texture (assets/audio/wind.mp3)  
- **Piano**: Recorded sparse piano notes (assets/audio/piano.mp3)

Current audio files are minimal placeholders. For production, replace with:
- High-quality recorded textures (44.1kHz, stereo)
- Both OGG and MP3 formats for compatibility
- Loopable files (seamless endpoints)
- Proper attribution and licensing

See `../prototype/assets/ATTRIBUTION.md` for asset details and licensing requirements.

### Per-Layer Controls
Each layer has:
- **Volume slider**: Adjust individual track volume
- **Mute button (M)**: Toggle mute for that layer
- **Solo button (S)**: Isolate one track
- **Card interaction**: Tap to solo/unsolo (with haptic feedback)

### Master Mix
- **Master volume**: Global volume control
- **Save/Load presets**: Persist mix settings in localStorage

### Accessibility Features
- ARIA labels on all interactive controls
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Screen reader support (VoiceOver, TalkBack)
- High contrast and large touch targets
- Respects `prefers-reduced-motion`

## Figma import tips
- You can copy each `<svg>` block in `find-the-calm.html` and paste into Figma as a vector
- Alternatively, open the HTML in a browser and screenshot at 2x for raster assets

## Accessibility & behavior notes
- Add a "Disable Haptics" toggle for users who prefer no vibration
- Respect `prefers-reduced-motion` in interactions
- Keep controls accessible with `aria-pressed` and text labels
- Volume sliders should have clear min/max indicators

## Mobile Testing

For comprehensive QA on mobile devices:
- See `TESTING_MOBILE.md` for the full testing checklist
- Focus areas: Android haptics, audio loading, touch interactions
- Test on multiple devices and browsers

Key considerations:
- Haptics only work on supported mobile browsers
- Audio playback requires user gesture (autoplay restrictions)
- localStorage presets persist across sessions
- Test in both portrait and landscape orientations

## Audio Asset Guidelines

When sourcing or recording production audio:

### Technical Requirements
- Format: OGG Vorbis (primary), MP3 (fallback)
- Sample rate: 44.1kHz or 48kHz
- Bit depth: 16-bit minimum
- Channels: Stereo preferred
- Duration: 5-10 seconds (seamless loop)
- File size: < 500KB per file (compressed)

### Content Guidelines
- **Rain**: Steady rainfall, no thunder or heavy drops
- **Wind**: Gentle breeze, avoid harsh gusts
- **Piano**: Sparse notes, ambient/impressionistic style

### Licensing
- Use CC0, CC-BY, or royalty-free sources
- Document attribution in `../prototype/assets/ATTRIBUTION.md`
- Verify commercial use rights if applicable

### Recommended Sources
- Freesound.org (various CC licenses)
- BBC Sound Effects Library (personal/educational use)
- OpenGameArt.org (various CC licenses)
- Record your own (ensure copyright clearance)

## Next steps

The prototype is now feature-complete with recorded audio support. Additional enhancements could include:
- Professional recorded textures (replace placeholders)
- Additional layers (ocean, fire, birds, cafe ambience)
- Visual EQ or waveform display
- Multiple preset slots with names
- Export/import presets as JSON
- Crossfade duration settings
- Stereo pan controls for spatial audio
