import { Link, NavLink } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Leaf, Menu, Moon, ScanLine, Sun, Trophy, UploadCloud, X, LayoutDashboard, BookOpen, QrCode, Sparkles } from 'lucide-react'
import { loadState } from '../lib/store.js'

const links = [
  { to: '/scan', label: 'Scanner', icon: ScanLine },
  { to: '/guide', label: 'Bin Guide', icon: BookOpen },
  { to: '/verify', label: 'Verify', icon: QrCode },
  { to: '/challenges', label: 'Challenges', icon: Sparkles },
  { to: '/leaderboard', label: 'Ranks', icon: Trophy },
  { to: '/dashboard', label: 'Impact', icon: LayoutDashboard },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [pts, setPts] = useState(0)
  const [queued, setQueued] = useState(0)
  const menuBtnRef = useRef(null)

  useEffect(() => {
    const sync = () => {
      try {
        const s = loadState()
        const v = Number(s.points)
        setPts(Number.isFinite(v) ? v : 0)
        setQueued(Array.isArray(s.outbox) ? s.outbox.length : 0)
      } catch { /* ignore */ }
    }
    sync()
    // Event-driven updates (saveState dispatches) + cross-tab storage events.
    // No polling — zero cost when idle.
    window.addEventListener('ecosort:update', sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('ecosort:update', sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  const toggleDark = () => {
    const el = document.documentElement
    el.classList.toggle('dark')
    setDark(el.classList.contains('dark'))
    try { localStorage.setItem('ecosort:theme', el.classList.contains('dark') ? 'dark' : 'light') } catch {}
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-card)]/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="focus-ring flex items-center gap-2.5" aria-label="EcoSort AI home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1E3A5F] text-white"><Leaf size={20} /></span>
          <span className="leading-tight">
            <span className="font-display block text-[17px] font-bold tracking-tight">EcoSort AI</span>
            <span className="block text-[11px] font-medium text-[var(--color-muted-fg)] max-sm:hidden">Smart Waste · Smarter Future</span>
          </span>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => `focus-ring rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-[#059669]/10 text-[#047857] dark:text-emerald-300' : 'text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/dashboard" title="Your points"
            className="focus-ring hidden items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1.5 text-sm font-bold sm:flex">
            <Trophy size={15} className="text-amber-500" /> {pts.toLocaleString()} pts
          </Link>
          {queued > 0 && (
            <Link to="/verify" title={`${queued} offline disposals waiting to sync`}
              className="focus-ring hidden items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-800 sm:flex dark:bg-amber-950 dark:text-amber-200">
              <UploadCloud size={15} /> {queued} queued
            </Link>
          )}
          <button onClick={toggleDark} className="focus-ring grid h-11 w-11 cursor-pointer place-items-center rounded-lg border border-[var(--color-border)] transition-colors hover:bg-[var(--color-muted)]" aria-label="Toggle theme">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link to="/scan" className="focus-ring hidden rounded-xl bg-[#059669] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#047857] sm:inline-flex">
            Scan waste
          </Link>
          <button ref={menuBtnRef} className="focus-ring grid h-11 w-11 place-items-center rounded-lg border border-[var(--color-border)] lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} aria-controls="mobile-nav">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="border-t border-[var(--color-border)] px-4 py-3 lg:hidden" aria-label="Mobile"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              menuBtnRef.current?.focus()
            }
          }}>
          <div className="mb-2 flex gap-2">
            <Link to="/dashboard" onClick={() => setOpen(false)} className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5 text-sm font-bold">
              <Trophy size={15} className="text-amber-500" /> {pts.toLocaleString()} pts
            </Link>
            {queued > 0 && (
              <Link to="/verify" onClick={() => setOpen(false)} className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <UploadCloud size={15} /> {queued} queued
              </Link>
            )}
          </div>
          <div className="grid gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-[#059669]/10 text-[#047857] dark:text-emerald-300' : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'}`}>
                <l.icon size={17} /> {l.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
