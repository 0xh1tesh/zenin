import { Component, type ErrorInfo, type ReactNode } from 'react'
import '../ui/ui.css'

interface State {
  failed: boolean
}

/** Last line of defence: a render error in one page never blanks the whole app. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface in the console for debugging; the UI below is the user-facing handling.
    console.error('Render error', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="container section">
        <section className="ui-state" role="alert">
          <h2 className="ui-state__title">Something broke on our side</h2>
          <p className="ui-state__body">This page hit an unexpected error. Reloading usually fixes it.</p>
          <div className="ui-state__actions">
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <a className="btn btn--ghost" href="/">
              Back to home
            </a>
          </div>
        </section>
      </div>
    )
  }
}
