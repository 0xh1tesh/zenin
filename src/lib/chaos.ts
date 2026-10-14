/**
 * Deterministic failure simulation for demos and judges.
 *   ?chaos=500 | timeout | empty | malformed | offline   (?chaos=off clears it)
 *   ?snapshot=off  disables the offline fallbacks (HTML seed + bundled snapshot); ?snapshot=on re-enables them
 * Both are remembered for the browser session so in-app navigation keeps failing.
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
  const snapshot = params.get('snapshot')
  const fromUrl = params.get('chaos')
  if (snapshot !== null) {
    safeSession(() => {
      if (snapshot === 'off') sessionStorage.setItem(SNAP_KEY, 'off')
      else sessionStorage.removeItem(SNAP_KEY)
      return null
    })
  }
  if (fromUrl !== null) {
    safeSession(() => {
      if (MODES.includes(fromUrl)) sessionStorage.setItem(KEY, fromUrl)
      else sessionStorage.removeItem(KEY)
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
