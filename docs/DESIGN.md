# Design and motion system

A premium, high-end interface with intentional 3D depth. Inspired by the craft of Skiper UI, Linear, Vercel, and Arc — **not** a copy of their code.

The product must stay completely usable. Motion is an accent that sells depth and state, never a gate in front of a task.

Related: [ARCHITECTURE.md](ARCHITECTURE.md) · [ROADMAP.md](ROADMAP.md)

## 1. Design intent

- **Calm surface, alive edges.** The workspace is quiet and readable. Depth appears in the landing, the status island, and small interactions.
- **One hero moment.** The voxel grid is the signature. Everything else supports it.
- **Accessibility is part of the aesthetic.** Large captions, high contrast, keyboard focus, and reduced motion are designed, not patched in.
- **Honesty is visible.** Amber means "AI guess / uncertain". Cyan means "tracking / ready". Never use color alone; pair it with text.

## 2. Principles

1. **Readable first.** If a motion effect hurts reading, cut the effect.
2. **Depth with restraint.** Perspective, shadow, and parallax should explain hierarchy, not decorate everything.
3. **Transform and opacity only.** No animated layout, box-shadow, or filter in hot paths.
4. **Earn the 3D.** Use Three.js only where CSS 3D cannot do it (voxel hero, ASCII, liquid).
5. **Every effect has a static fallback.**
6. **The app route stays calm.** Heavy motion lives on `/`.

## 3. Visual language

### Color tokens

**Dark neon (default)**

| Token | Value | Use |
|---|---|---|
| `--bg` | `#07080B` | page |
| `--surface` | `#0D1017` | cards, panels |
| `--surface-2` | `#12161F` | raised |
| `--border` | `rgba(255,255,255,0.08)` | hairlines |
| `--text` | `#F4F7FB` | primary |
| `--muted` | `#9AA6B6` | secondary |
| `--accent` | `#22D3EE` | tracking, primary action |
| `--accent-2` | `#2DD4BF` | secondary glow |
| `--amber` | `#F5A524` | AI guess / uncertain |
| `--danger` | `#F87171` | errors |
| `--success` | `#34D399` | confirmed |

**High contrast**

| Token | Value |
|---|---|
| `--bg` | `#000000` |
| `--surface` | `#0A0A0A` |
| `--text` | `#FFFF00` |
| `--accent` | `#FFFFFF` |
| `--border` | `#FFFF00` |
| `--amber` | `#FFB000` |

**Light**

| Token | Value |
|---|---|
| `--bg` | `#F7F8FA` |
| `--surface` | `#FFFFFF` |
| `--surface-2` | `#EEF1F5` |
| `--text` | `#0B0D12` |
| `--muted` | `#5B6575` |
| `--accent` | `#0891B2` |
| `--accent-2` | `#0D9488` |
| `--amber` | `#B45309` |
| `--border` | `rgba(11,13,18,0.10)` |

All text pairs must meet **4.5:1**. Glow is only for non-text elements.

### Typography

- **UI:** Geist Sans (fallback Inter) via `next/font`. Clean, neutral, slightly technical.
- **Captions:** Atkinson Hyperlegible via `next/font/google`. Optimized for legibility.
- **Scale:** 12, 14, 16, 18, 20, 24, 32, 40, 56, 72.
- **Captions:** 32–72 px, driven by the text-size slider.
- **Weights:** 400 body, 500 UI labels, 600 headings, 700 display.
- **Tracking:** `-0.02em` on display, `0` on body.
- **Line height:** 1.05–1.15 display, 1.5 body, 1.25 captions.

### Spacing and shape

- 4 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Radii: 10 (controls), 14 (cards), 20 (panels), 28 (hero), full (chips).
- Generous white space on `/`; denser but breathable on `/app`.

### Elevation

```css
--shadow-ambient: 0 1px 2px rgba(0,0,0,.30), 0 8px 24px rgba(0,0,0,.25);
--shadow-lifted:  0 24px 64px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.08);
--glow-accent:    0 0 40px rgba(34,211,238,.25);
--glow-amber:     0 0 32px rgba(245,165,36,.22);
```

### Glass

Use sparingly for floating layers:

```css
background: rgba(13,16,23,.65);
backdrop-filter: blur(16px);
border: 1px solid rgba(255,255,255,.08);
box-shadow: var(--shadow-lifted);
```

Light theme uses `rgba(255,255,255,.7)` with a darker hairline.

### Gradients and glow

- One radial cyan/teal wash behind the hero, 8–12% opacity.
- Amber wash only around uncertain/gist content.
- No rainbow gradients. No glow behind body text.

## 4. Motion language

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 100 ms | press feedback |
| `--dur-fast` | 160 ms | hover, focus |
| `--dur-base` | 240 ms | chips, toggles |
| `--dur-slow` | 400 ms | panels, cards |
| `--dur-scene` | 700 ms | hero, section reveals |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | entrances, scroll |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | morphs |
| `--spring` | `{ stiffness: 260, damping: 30, mass: 0.8 }` | interactive, island |

Choreography:

- Stagger 40–80 ms; never more than 8 items at once.
- Scroll-linked values are smoothed with a spring or `useSpring`.
- Hover lifts are 2–4 px, not 20.
- Press is `scale(0.98)`.
- Focus rings are instant and visible.

### Reduced motion

- Respect `prefers-reduced-motion` by default.
- Manual toggle in settings overrides the OS setting.
- Reduced mode: opacity fades only; no scroll-linked transforms, no cursor trail, no liquid, no ASCII animation, no parallax. Static hero gradient replaces the voxel scene.
- Captions never animate position.

## 5. Motion inventory

Priority: **P0** base site v1, **P1** should, **P2** could.

| # | Effect | Where | Technique | Priority | Reduced-motion fallback |
|---|---|---|---|---|---|
| 1 | 3D perspective text on scroll | Hero + section headings | CSS `perspective` + Motion `useScroll`/`useTransform` | P0 | static text |
| 2 | 3D cylinder / rolling text | "How it works" divider | CSS 3D cylinder, scroll-linked `rotateX` | P1 | static heading |
| 3 | Voxel / cube grid hero | Landing hero | R3F + Drei, instanced meshes, orbit | P0 | static gradient + glass card |
| 4 | Coverflow carousel | Scenario packs | CSS 3D + Motion drag | P0 | simple grid |
| 5 | Scroll 3D image grid | Feature cards | Motion `whileInView` + perspective + stagger | P0 | fade-in |
| 6 | Infinite drag + wheel grid | Gesture/phrase gallery | Motion drag + wheel, wrap | P1 | horizontal scroll |
| 7 | Liquid / gooey hover | CTA or privacy orb | SVG filter or R3F shader | P2 | static gradient |
| 8 | ASCII 3D accent | Footer or hero corner | Drei `AsciiRenderer` | P2 | hide |
| 9 | Parallax + tilt cards | Problem/features | `useScroll` + pointer tilt | P0 | static |
| 10 | 3D card stack | Honesty/limits | Sticky + scroll transforms | P1 | stacked list |
| 11 | Dynamic Island status | App top bar | Motion `layout` / `layoutId` | P0 | simple badge |
| 12 | Cursor trail | Landing, desktop | rAF + Motion, cap 10 | P2 | hide |

## 6. Implementation recipes

### 1. 3D perspective text on scroll

- Wrapper: `perspective: 1200px; transform-style: preserve-3d`.
- Inner: `rotateX`, `rotateY`, `translateZ`, `translateY` mapped to scroll progress.
- Smooth with a spring; clamp to avoid extreme angles.
- Split by line, not by character, for readability.
- `backface-visibility: hidden`; avoid blur on text.

### 2. Cylinder / rolling text

- Container with `perspective: 900px`.
- Cylinder with `transform-style: preserve-3d`.
- Each line or character: `rotateX(i * angle) translateZ(radius)`.
- Rotate the cylinder with scroll progress.
- Use 4–6 lines max; more becomes unreadable.
- Provide a normal static heading for screen readers.

### 3. Voxel / cube grid hero

- `Canvas` with `dpr={[1, 1.75]}`, `gl={{ antialias: true }}`.
- `instancedMesh` for cubes; start with a 7×7 grid (49 cubes).
- Click raycast: add a cube above, or remove the top cube. Keep a max height.
- `OrbitControls` with `enablePan={false}`, damping, limited polar angle.
- Lighting: ambient + directional + soft `ContactShadows`; optional `Environment` preset.
- Pause with `frameloop="demand"` when offscreen or reduced motion.
- Lazy-load with `next/dynamic` and `ssr: false`.

### 4. Coverflow carousel

- Cards absolutely positioned around a center index.
- Offset `i - active`: `translateX(offset * 56%) rotateY(offset * -18deg) translateZ(-abs(offset) * 120px) scale(1 - abs(offset) * 0.08)`.
- Side cards: lower opacity, stronger shadow.
- Drag with Motion; snap to nearest; arrow keys and buttons for keyboard.
- Focus moves to the active card; `aria-roledescription="carousel"`.

### 5. Scroll-triggered 3D grid

- `initial={{ opacity: 0, y: 40, rotateX: 18, scale: 0.94 }}`.
- `whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}`.
- `viewport={{ once: true, margin: "-10%" }}`.
- Stagger with `delay: i * 0.06`.
- Keep `transform-style: preserve-3d` on the parent, not every child.

### 6. Infinite drag + wheel grid

- Duplicate the item list to create a seamless loop.
- Motion `drag="x"` with constraints; wrap on release.
- Wheel: normalize delta, lerp toward target, clamp.
- Keyboard: arrow keys move focus; do not trap scroll.
- Pause auto-motion on hover/focus.

### 7. Liquid / gooey hover

- Prefer an SVG filter (`feTurbulence` + `feDisplacementMap`) animated on pointer.
- Or a small R3F shader plane for the privacy orb.
- Keep displacement subtle (2–8 px) and slow.
- Disable on touch and reduced motion.
- Never put body text inside the distortion.

### 8. ASCII 3D accent

- Drei `AsciiRenderer` over a low-poly model or a simple shape.
- Small footprint, corner placement, decorative only.
- `aria-hidden`.
- Disable when reduced motion or offscreen.
- Do not use as the main hero; it fights legibility.

### 9. Parallax layers + tilt cards

- `useScroll` → `useTransform` for `y` and `scale` at different depths.
- Pointer tilt: `rotateX = (y - 0.5) * -8`, `rotateY = (x - 0.5) * 8`.
- Spring back on leave.
- Limit to 6–8 degrees; add a subtle highlight that follows the pointer.
- On touch: no tilt; use a static lift.

### 10. 3D card stack

- Sticky section; each card `position: sticky; top: 12vh`.
- Scroll progress drives `translateY`, `scale`, `rotate`, and opacity.
- Cards behind: `scale(0.94)`, `translateY(-12px)`, lower opacity.
- Keep text readable at every stage; do not rotate text more than ~6 degrees.

### 11. Dynamic Island status

- One `motion.div layout` with `layoutId="status-island"`.
- States: Idle, Tracking, Listening, Speaking, Not sure, Error.
- Collapsed: icon + short label. Expanded: detail + confidence + action.
- Width/height animate with a spring; content crossfades.
- Keyboard: Enter/Space expands; Escape collapses.
- `aria-live="polite"` for state changes.

### 12. Cursor trail

- Track pointer with rAF; spawn an icon every 60–90 ms while moving.
- Cap at 8–10 elements; remove after 600–900 ms.
- Slight random rotation and scale; fade out.
- Desktop + fine pointer only; disabled on touch and reduced motion.
- Never intercept clicks; `pointer-events: none`.

## 7. Component inventory

### Landing (`/`)

- `Nav` — glass, sticky, logo, links, "Open AirSign".
- `Hero` — 3D text, voxel grid, glass demo card, CTA.
- `ProblemSection` — parallax layers, large type.
- `HowItWorks` — cylinder text + three steps.
- `ScenarioCoverflow` — pharmacy, restaurant, transit, front desk, general.
- `FeatureGrid3D` — six feature cards with scroll stagger.
- `PrivacySection` — liquid orb or ASCII accent, "video never leaves your browser".
- `HonestySection` — card stack, limits, co-design next step.
- `FinalCTA` — dynamic island button.
- `Footer` — links, attribution, small ASCII accent.

### App (`/app`)

- `TopBar` — logo, scenario picker, settings, status island.
- `CameraPanel` (P1) — video, skeleton overlay, live candidate, confidence.
- `HoldRing` (P1) — dwell progress, lock state.
- `SentenceStrip` — chips, remove, reorder, preview.
- `ConfirmBar` — confirm, clear, "nothing is spoken until you confirm".
- `GistCard` — "AI guess, please confirm", raw candidates, uncertainty.
- `Captions` — `aria-live="polite"`, large type, reply button, typed fallback.
- `SettingsBar` — theme, text size, dwell, reduced motion, voice, scenario.
- `Waveform` — speaking level.
- `KeyboardHints` — Space, C, R, 1–7.

### Motion primitives (`src/components/motion/`)

- `Reveal` — fade/slide in view.
- `TiltCard` — pointer tilt with spring.
- `Parallax` — depth wrapper.
- `SmoothScroll` — Lenis provider, disabled under reduced motion.
- `useReducedMotion` — OS + manual setting.
- `Magnetic` — subtle button attraction (optional).

## 8. Layout wireframes

**Landing**

```
[ nav: logo · how it works · scenarios · privacy · Open AirSign ]
[ hero: 3D text + voxel grid + glass card + CTA ]
[ problem: parallax layers + large statement ]
[ how it works: cylinder text + 3 steps ]
[ scenarios: coverflow ]
[ features: scroll-triggered 3D grid ]
[ privacy: liquid orb + copy ]
[ honesty: card stack + limits ]
[ final CTA: dynamic island ]
[ footer: links + ASCII accent ]
```

**App**

```
[ top bar: logo · scenario · settings · status island ]
[ left: camera + live candidate + hold ring ] [ right: sentence strip ]
                                               [ preview + confirm ]
                                               [ gist card ]
                                               [ captions + reply ]
[ bottom: keyboard hints ]
```

## 9. Performance rules

- 60fps target; 16.6 ms frame budget.
- Transform/opacity only.
- Lazy-load R3F; mount on visibility.
- DPR cap 1.5–2; lower on weak devices.
- 49 cubes max in the hero; instanced.
- No postprocessing by default.
- Pause offscreen canvases.
- No cursor trail on touch.
- Test on the demo laptop and one lower-end device.

## 10. Accessibility rules

- All interactive 3D has a keyboard path and visible focus.
- Decorative canvases are `aria-hidden`; meaningful ones have text alternatives.
- No color-only meaning: pair cyan/amber with labels.
- Captions use `aria-live="polite"`, large type, high contrast.
- Reduced motion is respected by default and toggleable.
- Contrast ≥ 4.5:1 in all themes.
- No autoplay audio.
- Run axe/Lighthouse and record results for Devpost.

## 11. References and attribution

- [Skiper UI](https://skiper-ui.com/) — interaction inspiration. Its stack is Next.js, Tailwind, Motion, and GSAP. Free components require attribution if copied; Pro components are paid. We build original components.
- [Motion docs](https://motion.dev/docs/react) — `motion` package, `motion/react`.
- [GSAP](https://gsap.com/) — free for all users, including ScrollTrigger.
- [React Three Fiber](https://r3f.docs.pmnd.rs/) and [Drei](https://drei.docs.pmnd.rs/).
- [Lenis](https://lenis.darkroom.engineering/) — optional smooth scroll.
- [Devouring Details](https://devouringdetails.com/) and [Rauno](https://rauno.me/) — craft references.

## 12. Do and don't

**Do**

- Use depth to show hierarchy.
- Keep the hero memorable and the workspace quiet.
- Give every effect a static fallback.
- Pair motion with text state.
- Test with reduced motion on.

**Don't**

- Put 3D behind body text.
- Animate box-shadow or filter across many elements.
- Use motion to hide loading or errors.
- Copy Skiper code without checking the license.
- Let the landing delay the app.
