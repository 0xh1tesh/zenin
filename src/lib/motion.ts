import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches
}

function subscribe(callback: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}

/**
 * Runs `callback` on the visitor's first scroll, tap, key press or pointer press, or after a long
 * fallback delay. Heavy animation setup waits for this so it never competes with first paint or
 * inflates blocking time. Returns a function that cancels the pending run.
 */
export function afterFirstInteraction(callback: () => void, fallbackMs = 10_000): () => void {
  const events = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const
  let done = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const cancel = () => {
    done = true
    for (const name of events) window.removeEventListener(name, run)
    if (timer !== undefined) clearTimeout(timer)
  }

  function run() {
    if (done) return
    cancel()
    callback()
  }

  for (const name of events) window.addEventListener(name, run, { passive: true })
  timer = setTimeout(run, fallbackMs)
  return cancel
}

/* ─── GSAP is loaded on demand so it never blocks first paint ───────────── */

export type GsapCore = typeof import('gsap')['gsap']
export type ScrollTriggerPlugin = typeof import('gsap/ScrollTrigger')['ScrollTrigger']

export interface GsapKit {
  gsap: GsapCore
  ScrollTrigger: ScrollTriggerPlugin
}

let corePromise: Promise<GsapKit> | null = null

export function loadGsap(): Promise<GsapKit> {
  corePromise ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([g, st]) => {
    g.gsap.registerPlugin(st.ScrollTrigger)
    return { gsap: g.gsap, ScrollTrigger: st.ScrollTrigger }
  })
  return corePromise
}

let flipPromise: Promise<typeof import('gsap/Flip')['Flip']> | null = null

export function loadFlip() {
  flipPromise ??= Promise.all([loadGsap(), import('gsap/Flip')]).then(([{ gsap }, mod]) => {
    gsap.registerPlugin(mod.Flip)
    return mod.Flip
  })
  return flipPromise
}

let splitPromise: Promise<typeof import('gsap/SplitText')['SplitText']> | null = null

export function loadSplitText() {
  splitPromise ??= Promise.all([loadGsap(), import('gsap/SplitText')]).then(([{ gsap }, mod]) => {
    gsap.registerPlugin(mod.SplitText)
    return mod.SplitText
  })
  return splitPromise
}
