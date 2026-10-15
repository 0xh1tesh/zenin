import { useEffect, useState, type RefObject } from 'react'

export interface UseInViewOptions {
  rootMargin?: string
  threshold?: number | number[]
}

/**
 * Lightweight IntersectionObserver hook that tracks when an element is in view.
 * Automatically pauses state when document is hidden (tab switch) to conserve CPU/GPU.
 */
export function useInView(
  targetRef: RefObject<HTMLElement | null>,
  options: UseInViewOptions = {},
): boolean {
  const { rootMargin = '100px 0px', threshold = 0.05 } = options
  const [isInView, setIsInView] = useState(true)

  useEffect(() => {
    const el = targetRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      return
    }

    let isIntersecting = false

    const updateState = () => {
      const active = isIntersecting && !document.hidden
      setIsInView(active)
      el.setAttribute('data-inview', active ? 'true' : 'false')
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting
        updateState()
      },
      { rootMargin, threshold },
    )

    observer.observe(el)

    const handleVisibility = () => {
      updateState()
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [targetRef, rootMargin, threshold])

  return isInView
}
