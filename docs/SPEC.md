# Zenith '26 — build spec (read fully before writing code)

## 1. What we are building
**Zenith '26** is the website of a fictional cosmic inter-college fest in Pune: 30 events (hackathons, coding contests, robotics/AI workshops, dance, theatre, photography, music, quizzes, food) between 26 Sep and 15 Nov 2026. All content comes from a live API. It is a submission to the **Render72** design-and-build challenge. Required pages: a landing page plus an events page. We ship `/`, `/events`, `/events/:id`, and a 404.

**Judging (from the portal, in priority order):**
- MEASURED: Performance (Lighthouse score + real load: FCP, LCP, CLS), Responsiveness (375, 768, 1280 wide, no horizontal scroll), Backend error handling (500s, timeouts, empty data), Scalability readiness (caching, lazy loading/pagination, optimized assets).
- REVIEWED: Design & creativity, Features & UX.

So: every decision is checked against *speed first, never break, then beauty*. A spectacular effect that hurts LCP/CLS loses points.

## 2. Stack and hard constraints
- `site/` — Vite 8 + React 19 + TypeScript (strict) + react-router-dom 7. Already installed: `gsap` (ScrollTrigger, Flip, SplitText), `lenis`, `motion`. **Do not install packages.** Do not use `three`/R3F (installed, unused, will be removed).
- Plain CSS, one file per area (`ui.css`, `layout.css`, `EventCard.css`, plus yours). No Tailwind, no CSS-in-JS. Class prefixes: `.ui-` shared, `.ecard` card, `.hero-` hero, `.home-` landing, `.events-` list page, `.detail-` detail page.
- Files < 400 lines (split components/CSS). No `any`. No `console.log`. Immutable updates. Named prop interfaces. Default export for pages and components.
- Only animate `transform`, `opacity`, `clip-path`. Respect `prefers-reduced-motion` (CSS tokens already collapse durations; JS-driven motion must check `useReducedMotion()` / `prefersReducedMotion()` from `src/lib/motion.ts`).
- GSAP/ScrollTrigger/Flip/SplitText are loaded **only** through `loadGsap()`, `loadFlip()`, `loadSplitText()` in `src/lib/motion.ts` (dynamic import, after first paint). Never `import 'gsap'` at module top level.

## 3. Design system (already built — reuse, do not redefine)
Dark cosmic, from the organizers' palette. Tokens live in `src/styles/tokens.css`; never hardcode colours.
`--void #101010` (page) · `--void-2 #181716` (cards) · `--void-3 #211f1d` · `--bone #EAE6DE` (body text) · `--sand #E6D5BD` (headings/rules/rings) · `--coral #EF8557` (accent, CTA bg with `--void` text) · `--vermilion #D5360C` (planet/glows, large display only) · `--blue #226192` (nebula haze, decorative only) · `--muted #9C958A` (secondary text) · status `--ok --warn --bad` · lines `--line --line-strong`.
Text contrast: use `--bone`, `--sand`, `--coral`, `--muted` for text. **`--vermilion` and `--blue` are never used for small text.**
Type: `--font-display` Unbounded (headings, wordmark, big numbers) · `--font-body` Inter Tight · `--font-mono` system mono (labels, dates, counts, uppercase, letter-spaced). Sizes `--step--1` … `--step-5`.
Shared classes (`src/index.css`): `.container` (max width, gutters; **adds left padding for the desktop rail ≥1024px**), `.section` (vertical rhythm), `.eyebrow` (mono coral label), `.mono`, `.sr-only`, `.btn` + `.btn--primary|--ghost`, `.page-enter` (route fade).
Layout (`src/components/layout`): fixed `TopBar`; floating left `Rail` (≥1024px) / `BottomNav` (<1024px); `Footer`; `OfflineBanner`; `ErrorBoundary`. `<main>` already has `padding-top: var(--topbar-h)`. A page whose hero is full-bleed under the top bar puts `className="page-bleed"` on its root element. Full-bleed sections must not be wrapped in `.container`.
Mood: festival poster meets mission control. Wide Unbounded display type, hairline sand rules, mono micro-labels, coral accents, ticket-stub cards with dashed perforation, rotated stamps. Not a template: vary scale, overlap, and rhythm.

Shared components (import, don't rebuild):
- `components/EventCard.tsx` — `<EventCard event variant?='default'|'feature'|'compact' index? priority? />`. Handles image sizing, status badge, stamp, price, seats, hover prefetch, archived styling, staggered reveal (`index`). Grid class: `.ecard-grid`. Set `priority` on **at most one** above-the-fold card.
- `components/ui/`: `StatusBadge` (+ `registrationState(event)` → `{label,tone,registrable}`: the single source of truth for "can I register"), `SeatsMeter`, `PriceTag`, `Countdown` (`to`, `compact?`, `doneLabel?`, uses one shared ticker), `Stamp`, `EmptyState`, `ErrorState`, `StaleNotice`, `Skeleton`/`EventCardSkeleton`/`EventGridSkeleton`/`RetryNote`, `Seo`.
- Layout rail/nav items are `NAV_ITEMS` in `layout/Rail.tsx`.

## 4. Data layer (already built — use it)
- Types: `src/types.ts` (`EventSummary`, `EventDetail`, …). Formatters (IST dates, INR, team size, seats, countdown math, month grouping): `src/lib/format.ts` — use them.
- Hooks (`src/lib/useAsync.ts`): `const { state, retry } = useEvents()`; `const { state, retry, summary } = useEvent(id)`.
  `state` is `{status:'loading', attempt}` | `{status:'error', error}` | `{status:'success', data, stale, source:'network'|'cache'|'snapshot', fetchedAt, isRevalidating}`.
  Cached data renders instantly (stale-while-revalidate). `summary` (detail hook) is the cached list item, usable to paint the header before the detail arrives.
- **Every data-driven view must handle all four states**, with the shared components: loading → `EventGridSkeleton`/skeletons matching the final layout + `<RetryNote attempt={state.attempt}/>`; error → `<ErrorState error onRetry/>`; empty → `<EmptyState/>`; stale → `<StaleNotice source fetchedAt onRetry/>`. The API client retries 3× with backoff, then falls back to cache, then to a bundled offline snapshot (`public/events-snapshot.json`).
- Images: never use `cover_image_url` raw. Use `responsiveImage(url, {widths, ratio, sizes})` / `resizeImage` from `src/lib/image.ts` (Pexels resizes on demand: 1200px = 133 KB, 480px = 27 KB, 360px webp = 12 KB). Always set `width`/`height` (the helper returns them), `alt` from the API, `loading="lazy"` except the single LCP image (`fetchPriority="high"`, eager).
- Failure drills for testing: open any URL with `?chaos=500`, `timeout`, `empty`, `malformed` or `offline` (add `&snapshot=off` to also disable the snapshot). Remembered per browser session.
- Calendar: `src/lib/ics.ts` (`eventToIcs`, `deadlineToIcs`, `downloadIcs`).

## 5. Quality bar (every page)
- One `<h1>`, ordered headings, landmarks, skip link exists. Buttons are `<button>`, links are `<a>`/`<Link>`, targets ≥ 44px, visible focus (global `:focus-visible`), labels on controls, `aria-live="polite"` for changing counts.
- Layouts verified at 375, 768, 1280 and 1440 wide: **no horizontal scroll**, no overlap, no clipped text.
- No layout shift: reserve space (aspect-ratio / width+height / skeletons that match the final layout).
- Per-page `<Seo title description image? />`.
- Lighthouse targets (mobile): Performance ≥ 95, A11y/Best Practices/SEO ≥ 95. The first paint must not depend on the API or on GSAP.
- Reduced motion → a fully usable static version.

## 6. Ownership (touch ONLY your files)
| Worker | Owns |
|---|---|
| hero | `src/components/hero/*` (the cosmic pinned hero, exported as `components/hero/Hero.tsx`) |
| landing | `src/pages/Home.tsx`, `src/components/home/*` (imports `Hero` from `components/hero/Hero` — until it exists, render a placeholder `<section>`; the integration step wires it) |
| events | `src/pages/Events.tsx`, `src/components/events/*` (`EventFilters.tsx`, `useEventFilters.ts`, `EventFilters.css` already exist — fix and restyle) |
| detail | `src/pages/EventDetail.tsx`, `src/components/detail/*` |
Shared/foundation files (`src/lib/*`, `src/components/ui/*`, `src/components/layout/*`, `EventCard.*`, `src/styles/*`, `src/index.css`, `App.tsx`, `index.html`, `vercel.json`) belong to the orchestrator: **do not edit them**. If you need a change there, write it as a note in your final summary.

## 7. Verify your work
From `site/`: `npx tsc -b --noEmit` (must be clean for your files), `npx vite build`, and view your page at 375/768/1280 if you can run the dev server (`npm run dev`, port 5173). Commit on your branch with a clear message when done; list what you built and any contract assumptions.
