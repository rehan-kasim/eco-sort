import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Fire-and-forget client crash reports → /api/log (Vercel function logs).
// Message-only, throttled locally, never blocks the app.
let lastReport = 0
function report(where, msg) {
  try {
    const now = Date.now()
    if (now - lastReport < 5000) return
    lastReport = now
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ where: String(where).slice(0, 120), msg: String(msg).slice(0, 500) }),
      keepalive: true,
    }).catch(() => {})
  } catch { /* reporting must never crash the app */ }
}
const hasWindow = typeof window !== 'undefined'
const hasNavigator = typeof navigator !== 'undefined'
if (hasWindow) {
  window.addEventListener('error', (e) => report((e.filename || location.pathname), e.message || 'window.onerror'))
  window.addEventListener('unhandledrejection', (e) => report(location.pathname, e.reason?.message || String(e.reason || 'unhandledrejection')))
}

// Offline shell: cache the app so corridors with dead wifi still open it.
// Queued disposals + the offline model already work without network.
// PRODUCTION ONLY: a service worker in dev fights Vite's hot-module reloads
// (stale chunks served on client-side nav = blank pages). In dev we instead
// evict any previously installed worker so it can't intercept module loads.
if (hasNavigator && hasWindow && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker
      .getRegistrations()
      .then((rs) => rs.forEach((r) => r.unregister().catch(() => {})))
      .catch(() => {})
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
      // New version takes over immediately (skipWaiting in sw.js) — but never
      // yank the page mid-scan/upload. Reload when the tab goes idle
      // (background), with a 5-minute backstop for always-visible kiosks.
      let reloaded = false
      const reloadOnce = () => {
        if (reloaded) return
        reloaded = true
        window.location.reload()
      }
      const armTimer = () => setTimeout(reloadOnce, 5 * 60 * 1000)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (document.hidden) {
          reloadOnce()
        } else {
          const onHide = () => {
            document.removeEventListener('visibilitychange', onHide)
            reloadOnce()
          }
          document.addEventListener('visibilitychange', onHide)
          armTimer()
        }
      })
    })
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
