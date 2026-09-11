import { Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-card)] print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1E3A5F] text-white"><Leaf size={17} /></span>
          <span className="font-display text-lg font-bold">EcoSort AI</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[var(--color-muted-fg)]" aria-label="Footer">
          <Link className="hover:text-[var(--color-foreground)]" to="/scan">Scan</Link>
          <Link className="hover:text-[var(--color-foreground)]" to="/guide">Bins</Link>
          <Link className="hover:text-[var(--color-foreground)]" to="/verify">Verify</Link>
          <Link className="hover:text-[var(--color-foreground)]" to="/challenges">Play</Link>
          <Link className="hover:text-[var(--color-foreground)]" to="/leaderboard">Ranks</Link>
          <Link className="hover:text-[var(--color-foreground)]" to="/dashboard">Impact</Link>
        </nav>
        <p className="ml-auto text-xs text-[var(--color-muted-fg)]">Snap · Sort · Score — SDG 11 · 12 · 13</p>
      </div>
    </footer>
  )
}
