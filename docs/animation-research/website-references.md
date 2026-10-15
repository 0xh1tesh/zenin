# Animation research: references, catalogue, plan

## Hackathon context

The Render72 brief needs a landing page plus an events page, fed by `https://render72.pages.dev/api/test`. The **measured** criteria are:
- **Performance:** Lighthouse plus FCP, LCP and CLS.
- **Responsiveness:** viewports 375, 768 and 1280.
- **Backend error handling:** 500s, timeouts and empty data.
- **Scalability readiness.**

The **reviewed** criteria are design and creativity, plus features and UX. So motion has to impress without costing LCP, TBT or CLS.

## Website references

Live sites reviewed in a real browser (Playwright, Edge). Weights are what the network panel showed on first load.

| Site | What it does well | What we took | Why not more |
|---|---|---|---|
| Techfest, IIT Bombay (techfest.org) | Pinned ~600vh scroll track; layered parallax planes that scale at different speeds; left icon rail | The pinned layered hero "dive" and the left rail | Thin content under the hero; the track feels like a wall |
| District (district.in) | Featured hero plus themed carousels | Featured-first ordering, deadline-driven rows | Commerce styling, not a fest identity |
| Shaastra, IIT Madras | Arcade-style intro | Nothing direct | Skip button unreachable; blocks content |
| Saarang, IIT Madras | — | — | Timed out during review |
| Equinox (equinox.space) | Rich 3D space scene | Mood only | 11 MB / 113 requests: fails the performance criterion |
| Turion Space (turionspace.com) | Premium dark aerospace atmosphere at 784 KB, no canvas | Mono micro-labels, hairline rules, restraint | — |
| Codrops "Cinematic 3D Scroll" | GSAP + OGL fly-through of image planes | "Through the field": featured covers flying along z with CSS 3D | WebGL not needed for six covers |
| Obys "Experiment Space" | Monochrome 3D ring gallery | Considered as an optional ring view (not built) | Desktop-only |
| Vercel Ship '26 | Dot-matrix event site, `0D.23H.00M` countdowns | Countdown format, schedule modules | — |
| 12 Wave | — | — | Not a fit for an events catalogue |

The decision was a **hybrid** of four references:
- **Techfest:** the pinned layered hero.
- **Turion:** the atmosphere.
- **Codrops:** the fly-through.
- **Vercel Ship:** the countdowns.

Everything is code-drawn with SVG, CSS and a tiny canvas, so the first paint is text, not an image.

## Animation catalogue (what shipped)

| Effect | Where | Technique | Cost control |
|---|---|---|---|
| Camera dive through layered planes | Hero | GSAP ScrollTrigger scrub on transform/opacity of 7 layers | Created after first interaction; letters visible at first paint (LCP) |
| Orbiting moons with comet tails, pulse rings, orbit highlight, beacon satellite | Hero | One rAF loop + SVG attributes; CSS keyframes | Paused offscreen / hidden tab; static under reduced motion |
| Shooting stars, glints, atmosphere shimmer | Hero, sections, footer | CSS keyframes, transform only | `prefers-reduced-motion` disables |
| Featured fly-through | Landing §02 | CSS 3D `translateZ` scrubbed by GSAP | Desktop only; scroll-snap rail on mobile |
| Count-up numbers | Signal strip | IntersectionObserver + rAF | Once; instant under reduced motion |
| Marquee ticker bands | Landing | Duplicated track, translateX keyframes | Clipped; pause on hover; static under reduced motion |
| Scroll rocket with landing + "Launch again" | Every route | Fixed overlay; one passive scroll listener + rAF only while moving | Lazy chunk after first interaction |
| Filter result reflow | `/events` | GSAP Flip | Loaded on demand |

## Implementation rules used

1. **Transform and opacity only.** Animate only those two (plus SVG dash offsets), and keep decorative layers absolute or fixed so CLS stays 0.
2. **Nothing heavy before first paint.** GSAP, Lenis and the rocket load after first interaction.
3. **Loops stop when nobody sees them.** They pause offscreen or in a hidden tab.
4. **Reduced motion gets a still, complete composition.**
5. **Decoration is hidden from assistive tech.** It is `aria-hidden`, and important text never lives only inside an animation.
