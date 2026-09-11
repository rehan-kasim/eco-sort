import React from 'react'

// Top-level safety net: a render crash anywhere in route content used to
// unmount the whole app into a blank screen. Now it becomes a readable card
// with the actual error plus recovery actions.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    try {
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: 'react-boundary',
          msg: `${error?.message || error} :: ${info?.componentStack || ''}`.slice(0, 500),
        }),
        keepalive: true,
      }).catch(() => {})
    } catch { /* ignore */ }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="mx-auto grid w-full max-w-md place-items-center px-4 py-16 text-center">
        <div className="w-full rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-xl">
          <p className="font-display text-2xl font-extrabold tracking-tight">Something broke</p>
          <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
            The app hit an error instead of this page. Your points and data are safe.
          </p>
          <p className="mt-3 rounded-xl bg-[var(--color-muted)] p-3 font-mono text-xs break-all text-[var(--color-muted-fg)]">
            {String(error?.message || error)}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="focus-ring flex-1 rounded-xl bg-[#059669] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#047857]"
            >
              Reload page
            </button>
            <button
              onClick={() => {
                this.setState({ error: null })
                window.location.href = '/'
              }}
              className="focus-ring flex-1 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold hover:bg-[var(--color-muted)]"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    )
  }
}
