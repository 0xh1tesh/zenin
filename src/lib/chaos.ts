/**
 * Deterministic failure simulation for demos and judges.
 *   ?chaos=500 | timeout | empty | malformed | offline   (add &snapshot=off to also disable the offline snapshot)
 * The mode is remembered for the browser session so in-app navigation keeps failing.
 * Off by default: a normal visit never reads this.
 */
export type ChaosMode = '500' | 'timeout' | 'empty' | 'malformed' | 'offline'

const KEY = 'z26:chaos'
const SNAP_KEY = 'z26:chaos-snapshot'
const MODES: readonly string[] = ['500', 'timeout', 'empty', 'malformed', 'offline']

function safeSession(op: () => string | null): string | null {
  try {
    return op()
  } catch {
    return null
  }
}

export function chaosMode(): ChaosMode | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('chaos')
  if (fromUrl !== null) {
    safeSession(() => {
      if (MODES.includes(fromUrl)) {
        sessionStorage.setItem(KEY, fromUrl)
        const snap = params.get('snapshot')
        if (snap === 'off') sessionStorage.setItem(SNAP_KEY, 'off')
        else sessionStorage.removeItem(SNAP_KEY)
      } else {
        sessionStorage.removeItem(KEY)
        sessionStorage.removeItem(SNAP_KEY)
      }
      return null
    })
    return MODES.includes(fromUrl) ? (fromUrl as ChaosMode) : null
  }
  const stored = safeSession(() => sessionStorage.getItem(KEY))
  return stored && MODES.includes(stored) ? (stored as ChaosMode) : null
}

export function snapshotDisabled(): boolean {
  return safeSession(() => sessionStorage.getItem(SNAP_KEY)) === 'off'
}
