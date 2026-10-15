import { lazy, Suspense, useEffect, useState } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { afterFirstInteraction, useMotionPaused } from '../../lib/motion'
import { startSmoothScroll } from '../../lib/smoothScroll'
import { EventGridSkeleton } from '../ui/Skeleton'
import BottomNav from './BottomNav'
import ErrorBoundary from './ErrorBoundary'
import Footer from './Footer'
import OfflineBanner from './OfflineBanner'
import Rail from './Rail'
import TopBar from './TopBar'
import './layout.css'

const ScrollRocket = lazy(() => import('../rocket/ScrollRocket'))
const CometSky = lazy(() => import('../ambient/CometSky'))
const DeepSky = lazy(() => import('../celestial/DeepSky'))

function PageFallback() {
  return (
    <div className="container section">
      <EventGridSkeleton />
    </div>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const [showRocket, setShowRocket] = useState(false)
  const [showComets, setShowComets] = useState(false)
  // The sky canvases pick their still or live mode on mount, so a pause/play switch remounts them.
  const motionPaused = useMotionPaused()

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
    const cancelWait = afterFirstInteraction(start)
    return () => {
      cancelled = true
      cancelWait()
      stop()
    }
  }, [])

  // Mount ScrollRocket deferred after visitor interaction so it never competes with first paint
  useEffect(() => {
    const cancelWait = afterFirstInteraction(() => setShowRocket(true))
    return cancelWait
  }, [])

  // The background sky (constellations, bodies, comets) mounts after first interaction so it never affects LCP/TBT
  useEffect(() => {
    const cancelWait = afterFirstInteraction(() => setShowComets(true))
    return cancelWait
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
      {showComets && (
        <Suspense fallback={null}>
          <DeepSky key={motionPaused ? 'still' : 'live'} />
          <CometSky key={motionPaused ? 'still' : 'live'} />
        </Suspense>
      )}
      {showRocket && (
        <Suspense fallback={null}>
          <ScrollRocket />
        </Suspense>
      )}
      <ScrollRestoration />
    </>
  )
}
