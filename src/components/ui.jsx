import { binById } from '../data/bins.js'

export function BinBadge({ bin, size = 'md' }) {
  const b = binById(bin)
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${b.bg} ${pad}`}>
      <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
      {b.label}
    </span>
  )
}

export function SectionHead({ kicker, title, sub, level = 2 }) {
  const Title = level === 1 ? 'h1' : 'h2'
  return (
    <div className="max-w-2xl">
      {kicker && <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#059669]">{kicker}</p>}
      <Title className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</Title>
      {sub && <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-muted-fg)]">{sub}</p>}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, sub, delay = '' }) {
  return (
    <div className={`rise ${delay} card-hover rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5`}>
      <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-muted-fg)]">
        {Icon && <Icon size={16} className="text-[#059669]" />} {label}
      </div>
      <p className="font-display mt-1.5 text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-[13px] text-[var(--color-muted-fg)]">{sub}</p>}
    </div>
  )
}
