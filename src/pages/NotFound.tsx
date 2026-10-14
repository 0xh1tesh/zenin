import { Link } from 'react-router-dom'
import Seo from '../components/ui/Seo'

export default function NotFound() {
  return (
    <div className="container section">
      <Seo title="Lost in space" description="This page drifted out of orbit." noindex />
      <section className="ui-state">
        <p className="eyebrow">Error 404</p>
        <h1 className="ui-state__title">Lost in space</h1>
        <p className="ui-state__body">
          The page you were looking for drifted out of orbit. Let&apos;s get you back to something in range.
        </p>
        <div className="ui-state__actions">
          <Link className="btn btn--primary" to="/">
            Back to home
          </Link>
          <Link className="btn btn--ghost" to="/events">
            Browse events
          </Link>
        </div>
      </section>
    </div>
  )
}
