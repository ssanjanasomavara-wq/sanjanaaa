# Mobile Device Testing - Find the Calm

This document provides a QA checklist for testing the Find the Calm prototype on mobile devices, with special focus on Android haptics and recorded audio playback.

## Test Environment

### Recommended Test Devices
- **Android**: Pixel 6+, Samsung Galaxy S21+, or similar (Android 10+)
- **iOS**: iPhone 12+ (iOS 14+) for comparison
- **Browsers**: Chrome Mobile, Safari Mobile, Firefox Mobile

### Audio Requirements
- Test in quiet environment with headphones/speakers
- Ensure device volume is at 50%+ for testing
- Test with both silent mode ON and OFF

## QA Checklist

### 1. Audio Playback (Recorded Textures)

#### Initial Load
- [ ] Page loads without errors
- [ ] "Start audio" button is visible and accessible
- [ ] Status message shows "Audio is not started"

#### Audio Initialization
- [ ] Tap "Start audio" button
- [ ] All three audio tracks (rain, wind, piano) start playing
- [ ] Status message updates to "Audio active — use controls to adjust layers"
- [ ] No audio glitches or stuttering
- [ ] Audio loops smoothly without gaps

#### Audio Quality
- [ ] Rain texture sounds realistic (not synth-like)
- [ ] Wind texture sounds natural
- [ ] Piano texture has sparse, gentle notes
- [ ] No clipping or distortion at default volume
- [ ] All tracks blend well together

### 2. Per-Layer Controls

#### Volume Sliders
- [ ] Each card has a volume slider
- [ ] Sliders are easily draggable on touch screens
- [ ] Volume changes are smooth (no crackling)
- [ ] Volume changes apply immediately
- [ ] Slider positions are visually accurate

#### Mute Buttons (M)
- [ ] Tap mute button on Rain → Rain mutes
- [ ] Button shows pressed/active state (visual feedback)
- [ ] Tap again → Rain unmutes
- [ ] Mute state persists when adjusting other controls
- [ ] Repeat for Wind and Piano tracks

#### Solo Buttons (S)
- [ ] Tap solo on Rain → Rain at full volume, others muted
- [ ] Solo button shows active state
- [ ] Tap solo again → All tracks return to previous volumes
- [ ] Only one track can be soloed at a time
- [ ] Tapping solo on different track switches solo
- [ ] Press Escape key → Clears solo state (desktop)

#### Tap-to-Solo (Card Interaction)
- [ ] Tap Rain card → Solos rain track
- [ ] Visual feedback: card lifts up (transform effect)
- [ ] Tap same card again → Unsolo
- [ ] Long-press (550ms+) on card → Same solo behavior
- [ ] Cards remain interactive when controls are visible

### 3. Master Mix Controls

#### Master Volume
- [ ] Master volume slider is accessible
- [ ] Adjusting master affects all tracks proportionally
- [ ] Master at 0 → All audio muted
- [ ] Master at 1 → All tracks at their individual volumes

#### Preset System
- [ ] Set custom volumes, mute states, and solo
- [ ] Tap "Save Preset" → Button shows "✓ Saved"
- [ ] Reload page
- [ ] Tap "Start audio"
- [ ] Tap "Load Preset" → All settings restored correctly
- [ ] Test with different preset configurations

### 4. Haptic Feedback (Android Focus)

#### Vibration Support
- [ ] Check if "Note: Haptics are not available" message appears
- [ ] If available, haptics should work for all interactions

#### Haptic Patterns
- [ ] **Short haptic (30ms)**: Regular tap on card
- [ ] **Long haptic (60ms)**: Long-press on card
- [ ] **Short haptic**: Tap mute button
- [ ] **Short haptic**: Tap solo button
- [ ] **Short haptic**: Save/Load preset

#### Haptic Toggle
- [ ] Enable "Disable Haptics" checkbox
- [ ] Interact with controls → No vibrations
- [ ] Disable checkbox → Vibrations return

#### Device-Specific Testing
- [ ] **Pixel devices**: Test with Vibration & haptics settings at different levels
- [ ] **Samsung**: Test with "Vibration intensity" settings
- [ ] **Other**: Document any device-specific behavior

### 5. Accessibility

#### Screen Reader Support
- [ ] VoiceOver (iOS) or TalkBack (Android) enabled
- [ ] All buttons have clear labels
- [ ] Slider values are announced
- [ ] Pressed states are announced (mute/solo)
- [ ] Status messages are read aloud

#### Keyboard Navigation (External Keyboard)
- [ ] Tab through all controls
- [ ] Enter/Space activates buttons
- [ ] Arrow keys adjust sliders
- [ ] Escape clears solo state
- [ ] Focus indicators are visible

#### Visual Accessibility
- [ ] Text is readable on small screens
- [ ] Contrast meets WCAG AA standards
- [ ] Touch targets are at least 44×44 px
- [ ] Visual feedback is clear for all states

### 6. Breathing Exercises (Existing Feature)

- [ ] Breathing exercises still work correctly
- [ ] Audio layers continue playing during exercises
- [ ] Animations are smooth
- [ ] Text-to-speech works if enabled

### 7. Performance & Compatibility

#### Performance
- [ ] Page load time < 3 seconds on 4G
- [ ] Audio starts within 1 second of button tap
- [ ] No UI lag when adjusting multiple controls
- [ ] Smooth scrolling on long page
- [ ] Battery drain is reasonable (< 5% per 15min)

#### Browser Compatibility
- [ ] Chrome Mobile (Android/iOS)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile
- [ ] Samsung Internet Browser

#### Edge Cases
- [ ] Phone call interruption → Audio pauses gracefully
- [ ] Switch to background → Audio continues (expected)
- [ ] Return to foreground → Controls still responsive
- [ ] Rotate device → Layout adapts correctly
- [ ] Low battery mode → Audio still works

### 8. Audio-Specific Edge Cases

#### Recorded Audio Loading
- [ ] Slow network (3G) → Audio buffers without error
- [ ] Offline → Clear error message displayed
- [ ] Partial load → No playback until ready
- [ ] Multiple quick taps on "Start audio" → No duplicate playback

#### Looping Behavior
- [ ] All tracks loop seamlessly
- [ ] No gap/click at loop point
- [ ] Loops remain synchronized after hours of playback

## Bug Reporting Template

When reporting issues, include:
```
Device: [Model + OS version]
Browser: [Name + version]
Issue: [Brief description]
Steps to reproduce:
1. 
2. 
3. 
Expected: [What should happen]
Actual: [What actually happened]
Screenshot/Recording: [If applicable]
```

## Test Results Summary

**Date**: [YYYY-MM-DD]  
**Tester**: [Name]  
**Device**: [Model]  
**OS**: [Version]  
**Browser**: [Name + Version]

### Pass/Fail Summary
- Audio Playback: ☐ Pass ☐ Fail
- Per-Layer Controls: ☐ Pass ☐ Fail
- Master Mix: ☐ Pass ☐ Fail
- Haptics: ☐ Pass ☐ Fail ☐ N/A
- Accessibility: ☐ Pass ☐ Fail
- Performance: ☐ Pass ☐ Fail

### Notes
[Additional observations, performance metrics, or concerns]

---

## Known Limitations

1. **Audio files**: Current placeholder MP3 files are minimal/silent. Replace with recorded textures for production testing.
2. **Haptics**: Not supported in all browsers. Safari iOS has limited support.
3. **Master volume**: Works by scaling individual track gains. Some precision loss possible.
4. **Preset storage**: Uses localStorage. Clearing browser data will reset presets.

## Next Steps

After completing mobile QA:
1. Document any device-specific issues
2. Test with real recorded audio files (when available)
3. Validate haptic patterns feel appropriate on different devices
4. Create video demos of key interactions for documentation
