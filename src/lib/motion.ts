import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** Phones get a calmer version of the ambient sky so scrolling stays smooth; tablets and desktop get it all. */
export const PHONE_QUERY = '(max-width: 767px)'

function subscribePhone(callback: () => void) {
  const mq = window.matchMedia(PHONE_QUERY)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

export function usePhoneLayout(): boolean {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false)
}
const PAUSE_KEY = 'zenin-motion'

/* ─── Visitor's own "pause animations" switch (WCAG 2.2.2), remembered per browser ─── */

const pauseListeners = new Set<() => void>()

function readStoredPause(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(PAUSE_KEY) === 'paused'
  } catch {
    return false
  }
}

let userPaused = readStoredPause()

const SWEEP_MS = 1000
let sweepTimer: ReturnType<typeof setInterval> | undefined

/**
 * Pauses (or resumes) every endlessly looping CSS animation. One-shot entrance reveals are left alone,
 * because freezing an element that starts hidden would leave it invisible.
 */
export function sweepLoopingAnimations(paused: boolean): void {
  if (typeof document === 'undefined' || typeof document.getAnimations !== 'function') return
  for (const animation of document.getAnimations()) {
    if (animation.effect?.getTiming().iterations !== Infinity) continue
    if (paused) animation.pause()
    else if (animation.playState === 'paused') animation.play()
  }
}

/** Applies the switch: <html data-motion="paused"> for styling hooks, plus the loop sweep. */
export function applyMotionAttribute(): void {
  if (typeof document === 'undefined') return
  if (sweepTimer !== undefined) clearInterval(sweepTimer)
  sweepTimer = undefined
  if (userPaused) {
    document.documentElement.dataset.motion = 'paused'
    sweepLoopingAnimations(true)
    // Layers mounted later (lazy sky, route changes) are caught by the next sweep.
    sweepTimer = setInterval(() => sweepLoopingAnimations(true), SWEEP_MS)
  } else {
    delete document.documentElement.dataset.motion
    sweepLoopingAnimations(false)
  }
}

export function setMotionPaused(paused: boolean): void {
  userPaused = paused
  try {
    if (paused) window.localStorage.setItem(PAUSE_KEY, 'paused')
    else window.localStorage.removeItem(PAUSE_KEY)
  } catch {
    // Storage can be unavailable (private mode); the choice still applies for this visit.
  }
  applyMotionAttribute()
  for (const listener of pauseListeners) listener()
}

function subscribePause(callback: () => void) {
  pauseListeners.add(callback)
  return () => {
    pauseListeners.delete(callback)
  }
}

export function useMotionPaused(): boolean {
  return useSyncExternalStore(subscribePause, () => userPaused, () => false)
}

/** True when the OS asks for reduced motion or the visitor paused animations on this site. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && (window.matchMedia(QUERY).matches || userPaused)
}

function subscribe(callback: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', callback)
  const unsubscribePause = subscribePause(callback)
  return () => {
    mq.removeEventListener('change', callback)
    unsubscribePause()
  }
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
