# Zenin '26

The website of a fictional cosmic inter-college fest in Coimbatore: thirty hackathons, workshops, performances and contests between 26 Sep and 15 Nov 2026. Built for the **Render72** design-and-build challenge.

**Live:** https://zenin26.vercel.app · **Pages:** `/` landing · `/events` all events · `/events/:id` event detail

All content comes from the Render72 Events API (`GET /api/test/events`, `GET /api/test/events/{id}`).

## How it answers the judging criteria

| Criterion | What was built |
|---|---|
| **Performance** | The headline is real text in the first render (it is the LCP element), so first paint never waits for the API or any animation library. GSAP, ScrollTrigger and Lenis load after first paint through dynamic imports. Fonts are self-hosted Latin subsets and preloaded. Cover images are resized on demand (`srcset`, WebP, explicit `width`/`height`): a card cover is ~12–27 KB instead of 133 KB. Only transform and opacity are animated. Routes are code-split. |
| **Responsiveness** | Designed and tested at 375, 768, 1280 and 1440 px with no horizontal scroll (automated check). A floating icon rail on desktop becomes a thumb-reach bottom navigation on phones and tablets. |
| **Backend error handling** | Every request has a 6 s timeout and retries up to 3 times with backoff and jitter (5xx, 429, network, timeout). Then it falls back to the last good cached copy, then to a bundled offline snapshot. Malformed responses are validated: broken items are dropped, the rest render. Empty data, server errors, slow servers, unreadable data and not-found each have their own designed state with a retry. Failures can be demonstrated on demand, see below. |
| **Scalability readiness** | In-memory + `localStorage` cache with stale-while-revalidate (5 min freshness), one shared in-flight request per resource, detail prefetch on hover/focus, 12-at-a-time pagination with an IntersectionObserver sentinel, `content-visibility: auto` on off-screen cards, long-lived immutable caching headers for assets. |
| **Design & creativity** | A cosmic festival-poster language in the Render72 palette: a pinned, layered 3D hero you dive through on scroll (drawn entirely in SVG/CSS/canvas, no image assets) with glowing moons that orbit behind and in front of the planet trailing comet tails; a little rocket that flies down the page with you on every route and touches down at the end ("Launch again" returns to the top); live ticker bands, shooting stars, twinkling dust and constellation tiles; ticket-stub event cards, mono micro-labels, hairline rules. All motion is transform/opacity only, pauses offscreen, loads after first interaction where it needs JavaScript, and becomes a still composition under `prefers-reduced-motion`. |
| **Features & UX** | URL-driven filters (shareable and deep-linkable), search, sort, grid/list, month grouping, live countdowns to deadlines, seats meters, add-to-calendar, share, clear archive handling (finished events never offer registration). |

## Demonstrating failures

Append a mode to any URL; it is remembered for the browser session.

| URL | Simulates |
|---|---|
| `/events?chaos=500` | Server error on every attempt (shows retries, then the offline snapshot) |
| `/events?chaos=500&snapshot=off` | Same, but with the snapshot disabled, to show the error state |
| `/events?chaos=timeout&snapshot=off` | A server that never answers |
| `/events?chaos=empty` | The API returns no events |
| `/events?chaos=malformed` | The API returns unreadable data |
| `/events?chaos=offline` | A dead network |
| `/events` (no param) | Clears the mode |

## Stack

Vite 8 · React 19 · TypeScript (strict) · react-router 7 · GSAP (ScrollTrigger, Flip) · Lenis (desktop smooth scroll only) · plain CSS. No UI framework.

## Project layout

```
src/
  lib/            api client (retry, cache, snapshot), validation, formatters, images, calendar, motion helpers
  components/
    ui/           shared primitives: badges, meters, countdown, skeletons, error/empty/stale states, SEO
    layout/       top bar, rail, bottom nav, footer, error boundary
    hero/         the pinned 3D hero, orbiting moons, shooting stars
    rocket/       the scroll-following rocket (lazy chunk) and its flight maths
    ambient/      marquee, sparkles, shooting stars, in-view pausing
    home/ events/ detail/   page-specific components
  pages/          Home, Events, EventDetail, NotFound
scripts/          build-time snapshot of the API (offline fallback + sitemap)
e2e/              Playwright: flows, responsiveness, accessibility, failure drills
```

## Scripts

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # snapshots the API, type-checks, builds
npm test             # unit tests (Vitest)
npm run test:cov     # with coverage
npx playwright test  # end-to-end tests (needs the dev server; starts it if absent)
```

## Accessibility

Semantic landmarks, a skip link, visible focus, labelled controls, 44 px touch targets, live regions for result counts, `inert` for closed overlays, and `prefers-reduced-motion` support (the pinned scroll scene and all looping motion are disabled). Text colours are checked for contrast against the dark background; the two accent colours that fail for small text (vermilion, blue) are used only decoratively.

## Credits

Event data: Render72 Events API. Photos: Pexels (via the API). Palette from the Render72 brand. Design references reviewed during research: IIT Bombay Techfest, District, Turion, Codrops, Vercel Ship.
