import { Suspense, useEffect } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { startSmoothScroll } from '../../lib/smoothScroll'
import { EventGridSkeleton } from '../ui/Skeleton'
import BottomNav from './BottomNav'
import ErrorBoundary from './ErrorBoundary'
import Footer from './Footer'
import OfflineBanner from './OfflineBanner'
import Rail from './Rail'
import TopBar from './TopBar'
import './layout.css'

function PageFallback() {
  return (
    <div className="container section">
      <EventGridSkeleton />
    </div>
  )
}

export default function Layout() {
  const { pathname } = useLocation()

  // Inertial scrolling starts after first paint and only on desktop; see lib/smoothScroll.ts.
  useEffect(() => {
    let stop: () => void = () => undefined
    let cancelled = false
    const start = () => {
      void startSmoothScroll().then((cleanup) => {
        if (cancelled) cleanup()
        else stop = cleanup
      })
    }
    const hasIdle = typeof window.requestIdleCallback === 'function'
    const handle = hasIdle ? window.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 1500)
    return () => {
      cancelled = true
      if (hasIdle) window.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
      stop()
    }
  }, [])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <OfflineBanner />
      <TopBar />
      <Rail />
      <main id="main" className="layout-main">
        <ErrorBoundary key={pathname}>
          <div key={pathname} className="page-enter">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </ErrorBoundary>
      </main>
      <Footer />
      <BottomNav />
      <ScrollRestoration />
    </>
  )
}
