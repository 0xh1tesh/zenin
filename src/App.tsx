import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, RouterProvider, useLocation, Outlet } from 'react-router-dom'
import Layout from './components/layout/Layout'
import NotFound from './pages/NotFound'
import { EventCardSkeleton } from './components/ui/Skeleton'
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const Events = lazy(() => import('./pages/Events'))
const EventDetail = lazy(() => import('./pages/EventDetail'))

function PageFallback() {
  return (
    <div className="app-page-fallback">
      <div className="container app-page-fallback__grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function RouteTransition() {
  const { pathname } = useLocation()
  useEffect(() => {
    const el = document.getElementById('route-transition')
    if (!el) return
    el.setAttribute('data-active', 'true')
    const t = setTimeout(() => el.removeAttribute('data-active'), 350)
    return () => clearTimeout(t)
  }, [pathname])
  return null
}

function AppShell() {
  return (
    <>
      <div id="route-transition" aria-hidden="true" />
      <ScrollToTop />
      <RouteTransition />
      <Outlet />
    </>
  )
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageFallback />}>
                <Home />
              </Suspense>
            ),
          },
          {
            path: 'events',
            element: (
              <Suspense fallback={<PageFallback />}>
                <Events />
              </Suspense>
            ),
          },
          {
            path: 'events/:id',
            element: (
              <Suspense fallback={<PageFallback />}>
                <EventDetail />
              </Suspense>
            ),
          },
          {
            path: '*',
            element: <NotFound />,
          },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
