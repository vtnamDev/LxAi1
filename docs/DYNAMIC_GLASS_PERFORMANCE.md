# LX AI — Dynamic Glass Performance System

---

## 1. Design Philosophy
> "Beautiful when possible — light when necessary — never broken."

Dynamic Glass is an adaptive rendering architecture designed to provide stunning depth and cosmic glow on powerful machines while ensuring buttery-smooth 60fps typing and scrolling on mobile and low-end devices.

## 2. 4-Tier Hardware Acceleration

### Tier A: Full (Desktop Flagship)
- Heavy translucent blur: `backdrop-filter: blur(16px) saturate(130%)`
- Cosmic nebula animated gradient background with dynamic lighting
- Interactive card tilt & magnetic hover glows

### Tier B: Balanced (Default Standard)
- Moderate blur: `backdrop-filter: blur(10px) saturate(110%)`
- Static optimized cosmic gradient background
- Subdued hover elevations and reduced DOM shadow stack

### Tier C: Lite (Low-End / Mobile Battery Saver)
- Low blur: `backdrop-filter: blur(4px)` with high surface opacity (90%)
- Single-pass background, minimal transitions
- No background particle animations

### Tier D: Minimal (Accessibility & Extreme Battery Saving)
- Zero backdrop-filter (`backdrop-filter: none`)
- High contrast solid dark surfaces with crisp 1px borders
- Zero motion, strictly instantaneous UI transitions
- Fully respects `prefers-reduced-motion` and `prefers-reduced-transparency`

## 3. Surface Token Hierarchy
- `Level 0`: Cosmic Background Canvas (`#070913` with radial starlight)
- `Level 1`: App Shell (`bg-slate-950/60`, border `white/10`)
- `Level 2`: Content Surface (`bg-[#0c1022]/70`, border `white/8`)
- `Level 3`: Elevated Controls (`bg-[#161c38]/80`, border `cyan-500/20`)
- `Level 4`: Modals & Popovers (`bg-[#0d1226]/95`, border `white/15`)
- `Level 5`: Temporary Overlays & Tooltips (`bg-black/80`)
