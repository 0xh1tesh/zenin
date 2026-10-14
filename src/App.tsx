import { lazy } from 'react'
import { createBrowserRouter, Link, RouterProvider, useRouteError } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Events from './pages/Events'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import './components/ui/ui.css'

// The two entry routes are bundled with the app shell: a lazy chunk would add a request
// round trip before the first card (and its image) could render. Detail stays lazy.
const EventDetail = lazy(() => import('./pages/EventDetail'))

/** Router-level failures (e.g. a lazy chunk that failed to load while offline). */
function RouteError() {
  const error = useRouteError()
  const chunkFailed = error instanceof Error && /dynamically imported module|Failed to fetch/i.test(error.message)
  return (
    <div className="container section">
      <section className="ui-state" role="alert">
        <h1 className="ui-state__title">{chunkFailed ? 'Couldn’t load this page' : 'Something went wrong'}</h1>
        <p className="ui-state__body">
          {chunkFailed
            ? 'Your connection dropped while the page was loading. Reload to try again.'
            : 'An unexpected error stopped this page from rendering.'}
        </p>
        <div className="ui-state__actions">
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <Link className="btn btn--ghost" to="/">
            Back to home
          </Link>
        </div>
      </section>
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: 'events', element: <Events /> },
      { path: 'events/:id', element: <EventDetail /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
