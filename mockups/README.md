Find the Calm — Visual mockup

Files:
- `find-the-calm.html` — static visual mockup (mobile-first)
- `find-the-calm.css` — styles, tokens, animations

Design goals:
- Calm, soft palette with approachable rounded cards
- Clear visual feedback for a "solo/isolated" state
- Focus on large tappable targets and subtle motion

Design tokens (quick reference):
- Colors: bg #FFF6F1, card #fffaf6, accent #E07A5F, muted #8A6F6B
- Spacing: base gap 16px, card padding 18px, radius 14–16px
- Motion: 200–260ms ease, use reduced-motion preference

Note: A warmer palette was applied on 2025-12-20; see `presentation.html` for a before/after comparison.

Recent tweaks: increased icon stroke weight and label contrast for improved readability on small screens.

Figma import tips:
- You can copy each `<svg>` block in `find-the-calm.html` and paste into Figma as a vector
- Alternatively, open the HTML in a browser and screenshot at 2x for raster assets

Accessibility & behavior notes:
- Add a "Disable Haptics" toggle for users who prefer no vibration
- Respect `prefers-reduced-motion` in interactions
- Keep controls accessible with `aria-pressed` and text labels

Next steps:
- If this mockup looks good, I can convert the layout into an interactive prototype (HTML/JS) that toggles solo states and implements haptics.
