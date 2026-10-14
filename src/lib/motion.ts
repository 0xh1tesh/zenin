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
