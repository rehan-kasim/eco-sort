import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

// Deferred PWA install prompt: appears only when the browser fires
// beforeinstallprompt (Chromium), never nags twice.
export default function InstallPrompt() {
  const [evt, setEvt] = useState(null)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('ecosort:install-dismissed') === '1'
    } catch {
      return true
    }
  })

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      // A fresh browser prompt resets a past dismissal — the user never
      // installed, and this session is a new chance (no permanent dead end).
      try {
        localStorage.removeItem('ecosort:install-dismissed')
      } catch {}
      setDismissed(false)
      setEvt(e)
    }
    const onInstalled = () => {
      setEvt(null)
      try {
        localStorage.setItem('ecosort:install-dismissed', '1')
      } catch {}
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!evt || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem('ecosort:install-dismissed', '1')
    } catch {}
  }

  const install = async () => {
    try {
      await evt.prompt()
      await evt.userChoice
    } catch { /* ignore */ }
    dismiss()
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#059669]/10 text-[#059669]">
          <Download size={19} />
        </span>
        <p className="min-w-0 flex-1 text-[13px] font-semibold">
          Install EcoSort AI <span className="font-medium text-[var(--color-muted-fg)]">— works offline in corridors</span>
        </p>
        <button onClick={install} className="focus-ring shrink-0 rounded-xl bg-[#1E3A5F] px-4 py-2 text-[13px] font-bold text-white hover:opacity-95">
          Install
        </button>
        <button onClick={dismiss} aria-label="Dismiss install prompt" className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--color-border)]">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
