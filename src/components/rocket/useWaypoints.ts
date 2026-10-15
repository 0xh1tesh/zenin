import { useCallback, useEffect, useState } from 'react'
import { calculateWaypointProgress, type WaypointSection } from './flight'

/**
 * Custom hook to discover and map page section headings ('main h2') to normalized scroll progress.
 * Computes once on mount, on resize, on body size changes, and on route transition.
 * Never computes per animation frame.
 */
export function useWaypoints(pathname: string): {
  beacons: WaypointSection[]
  updateBeacons: () => void
} {
  const [beacons, setBeacons] = useState<WaypointSection[]>([])

  const updateBeacons = useCallback(() => {
    if (typeof document === 'undefined') return
    const headings = document.querySelectorAll<HTMLElement>('main h2')
    if (headings.length === 0) {
      setBeacons([])
      return
    }

    const scrollY = window.scrollY || window.pageYOffset || 0
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0
    const innerHeight = window.innerHeight || 800
    const maxScroll = scrollHeight - innerHeight

    const newBeacons: WaypointSection[] = []
    headings.forEach((heading, idx) => {
      const rect = heading.getBoundingClientRect()
      const headingTop = rect.top + scrollY
      const p = calculateWaypointProgress(headingTop, innerHeight, maxScroll)
      const title = heading.textContent?.trim() || `SECTION ${idx + 1}`
      newBeacons.push({
        id: heading.id || `h2-${idx}`,
        title,
        progress: Number(p.toFixed(3)),
      })
    })

    newBeacons.sort((a, b) => a.progress - b.progress)
    setBeacons(newBeacons)
  }, [])

  useEffect(() => {
    updateBeacons()
    window.addEventListener('resize', updateBeacons, { passive: true })
    return () => window.removeEventListener('resize', updateBeacons)
  }, [updateBeacons])

  useEffect(() => {
    updateBeacons()
  }, [pathname, updateBeacons])

  return { beacons, updateBeacons }
}
