import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from 'recharts'
import { CloudFog, History, Leaf, Recycle, ScanLine, Target, TrendingUp, Camera, User } from 'lucide-react'
import { loadState, freshState, levelFor, saveState } from '../lib/store.js'
import { useEcoSync } from '../lib/useEcoSync.js'
import { WASTE_ITEMS } from '../data/wasteItems.js'
import { BINS } from '../data/bins.js'
import { CO2_ABSORBED_PER_TREE_YEAR_KG, DAY_MS, KG_ESTIMATE_UNKNOWN, KG_ESTIMATE_WET_DRY, KG_PER_RECYCLABLE_ITEM } from '../lib/scoring.js'
import { BinBadge, StatCard } from '../components/ui.jsx'
import { Tilt } from '../components/fx.jsx'

const shortLabel = (bin) => BINS[bin].label.replace(' Bin', '')
const binColor = (bin) => BINS[bin].color

function last7Days() {
  const days = []
  const now = new Date()
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  for (let i = 6; i >= 0; i--) {
    const key = new Date(utcMidnight - i * DAY_MS).toISOString().slice(0, 10)
    // Label derived from the same UTC key used for grouping — no TZ skew.
    const d = new Date(key + 'T12:00:00Z').toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' })
    days.push({ key, d })
  }
  return days
}

function estimateKg(entry) {
  const known = WASTE_ITEMS.find((w) => w.name === entry.item)
  if (known) return known.bin === 'RECYCLABLE' || known.bin === 'E_WASTE' ? KG_PER_RECYCLABLE_ITEM : KG_ESTIMATE_WET_DRY
  return KG_ESTIMATE_UNKNOWN
}

function materialOf(entry) {
  const known = WASTE_ITEMS.find((w) => w.name === entry.item)
  return known ? known.material : 'Other'
}

export default function Dashboard() {
  const [state, setState] = useState(() => loadState())
  // Stay fresh: disposals verified on other pages/tabs update these charts.
  useEcoSync(() => setState(loadState()))
  const lvl = levelFor(state.points)
  const accuracy = state.scans ? Math.round((state.correctDisposals / state.scans) * 100) : 0
  const trees = useMemo(() => ((state.co2Saved || 0) / CO2_ABSORBED_PER_TREE_YEAR_KG).toFixed(1), [state.co2Saved])
  // Corrupt/legacy entries (missing/invalid timestamps) must never crash the page.
  const validHistory = useMemo(
    () => (state.history || []).filter((h) => h && Number.isFinite(+h.at)),
    [state.history]
  )
  const hasData = validHistory.length > 0

  const week = useMemo(() => {
    const days = last7Days()
    // Single pass: group once by UTC day-key instead of 7 full scans.
    const byDay = new Map()
    for (const h of validHistory) {
      if (h.verified === false) continue
      const k = new Date(h.at).toISOString().slice(0, 10)
      byDay.set(k, (byDay.get(k) || 0) + 1)
    }
    return days.map((day) => ({ d: day.d, sorted: byDay.get(day.key) || 0 }))
  }, [validHistory])

  const binDist = useMemo(() => {
    const counts = { RECYCLABLE: 0, WET: 0, DRY: 0, E_WASTE: 0 }
    for (const h of validHistory) if (counts[h.bin] !== undefined) counts[h.bin] += 1
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
    return Object.entries(counts).map(([bin, n]) => ({
      name: shortLabel(bin), value: Math.round((n / total) * 100), color: binColor(bin),
    }))
  }, [validHistory])

  const materials = useMemo(() => {
    const kg = {}
    for (const h of validHistory) {
      const m = materialOf(h)
      kg[m] = Math.round(((kg[m] || 0) + estimateKg(h)) * 100) / 100
    }
    return Object.entries(kg).map(([m, v]) => ({ m, kg: v })).sort((a, b) => b.kg - a.kg).slice(0, 5)
  }, [validHistory])

  const exportCsv = () => {
    // Quote fields; neutralize Excel formula injection (=,+,-,@ prefix);
    // BOM + charset keep unicode names intact in Excel.
    const q = (v) => {
      let s = String(v ?? '')
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
      return `"${s.replace(/"/g, '""')}"`
    }
    const rows = [['date_utc', 'item', 'bin', 'points', 'verified', 'co2_kg']]
    // Export RAW history (blank date for legacy invalid rows) — charts may
    // filter, but teachers must never silently lose rows. EVERY field goes
    // through q(): tampered local numbers/strings can't become Excel formulas.
    for (const h of state.history || []) {
      const date = h && Number.isFinite(+h.at) ? new Date(h.at).toISOString() : ''
      rows.push([date, q(h?.item), q(h?.bin || ''), q(h?.points ?? 0), h?.verified ? 'yes' : 'no', q(h?.co2 ?? 0)])
    }
    rows.push([])
    rows.push(['metric', 'value'])
    rows.push(['profile', q(state.profile.name)])
    rows.push(['school', q(state.profile.school)])
    rows.push(['total_points', state.points ?? 0])
    rows.push(['correct_disposals', state.correctDisposals ?? 0])
    rows.push(['accuracy_pct', accuracy])
    rows.push(['recyclable_kg', state.recyclableKg ?? 0])
    rows.push(['co2_kg', state.co2Saved ?? 0])
    const blob = new Blob(['\uFEFF' + rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ecosort-impact-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  // Shared tablets: switch profiles between classes, or wipe the device clean
  // for a fresh pilot. Server-side data is untouched by either action.
  const switchProfile = () => {
    const pending = (loadState().outbox || []).length
    if (pending > 0 && !window.confirm(`${pending} offline disposal${pending === 1 ? '' : 's'} have not synced yet and would be lost. Switch profile anyway?`)) return
    if (pending === 0 && !window.confirm('Switch profile on this device? The current profile stays saved in the database.')) return
    saveState({ ...freshState(), onboarded: false })
    window.location.href = '/'
  }
  const eraseDevice = () => {
    if (!window.confirm('Erase ALL EcoSort data on this device? This cannot be undone.')) return
    try {
      localStorage.removeItem('ecosort:v1')
      localStorage.removeItem('ecosort:theme')
    } catch { /* ignore */ }
    window.location.href = '/'
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#059669]">Impact</p>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {state.profile.name ? `Hi ${state.profile.name}` : 'Your footprint'}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
            {[state.profile.school, state.profile.klass].filter(Boolean).join(' · ') || 'No school set'} · Level: <b>{lvl.name}</b> ({Number(state.points ?? 0).toLocaleString()} pts{lvl.next == null ? ', max level' : `, ${Math.max(0, lvl.next - Number(state.points ?? 0))} to next`})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} disabled={!hasData} className="focus-ring min-h-[44px] flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm font-bold disabled:opacity-50 hover:bg-[var(--color-muted)] sm:flex-none">Export CSV</button>
          <Link to="/scan" className="focus-ring min-h-[44px] flex-1 rounded-xl bg-[#059669] px-4 py-3 text-center text-sm font-bold text-white hover:bg-[#047857] sm:flex-none">+ Log a disposal</Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tilt max={8}><StatCard icon={ScanLine} label="Segregated" value={state.correctDisposals} sub={state.scans ? `${accuracy}% · ${state.scans} scans` : 'No scans yet'} delay="rise-1" /></Tilt>
        <Tilt max={8}><StatCard icon={Recycle} label="Recovered" value={`${state.recyclableKg} kg`} sub="Paper · plastic · metal · glass" delay="rise-2" /></Tilt>
        <Tilt max={8}><StatCard icon={CloudFog} label="CO₂e avoided" value={`${state.co2Saved} kg`} sub={`≈ ${trees} trees / year`} delay="rise-3" /></Tilt>
        <Tilt max={8}><StatCard icon={TrendingUp} label="Streak" value={`${state.streak} days`} sub="1+ correct daily to grow" delay="rise-4" /></Tilt>
      </div>

      {!hasData ? (
        <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#059669]/10 text-[#059669]"><Camera size={26} /></span>
          <h3 className="font-display mt-3 text-lg font-bold">Nothing yet</h3>
          <p className="mt-1 max-w-sm text-sm text-[var(--color-muted-fg)]">Scan → dispose → verify. Charts build themselves.</p>
          <Link to="/scan" className="focus-ring mt-4 rounded-xl bg-[#1E3A5F] px-5 py-2.5 text-sm font-bold text-white">Scan first item</Link>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 lg:col-span-2">
              <h3 className="flex items-center gap-2 text-sm font-bold"><TrendingUp size={16} className="text-[#059669]" /> Last 7 days — verified disposals</h3>
              <div className="mt-3 h-64" role="img" aria-label={`Verified disposals over the last 7 days, total ${week.reduce((a, w) => a + w.sorted, 0)} items`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={week} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" stopOpacity={0.35} /><stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="d" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sorted" stroke="#059669" strokeWidth={2.5} fill="url(#g1)" name="items" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <table className="sr-only">
                <caption>Verified disposals by day</caption>
                <tbody>{week.map((w) => <tr key={w.d}><th scope="row">{w.d}</th><td>{w.sorted} items</td></tr>)}</tbody>
              </table>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold"><Target size={16} className="text-[#1E3A5F]" /> Bin distribution</h3>
              <div className="h-48" role="img" aria-label={`Bin distribution: ${binDist.map((b) => `${b.name} ${b.value}%`).join(', ')}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={binDist} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>
                      {binDist.map((b) => <Cell key={b.name} fill={b.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-1 grid grid-cols-2 gap-1.5 text-xs font-semibold">
                {binDist.map((b) => <li key={b.name} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />{b.name} · {b.value}%</li>)}
              </ul>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 lg:col-span-2">
              <h3 className="flex items-center gap-2 text-sm font-bold"><Leaf size={16} className="text-[#059669]" /> Material recovered (est. kg)</h3>
              {materials.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--color-muted-fg)]">Not enough data yet.</p>
              ) : (
                <div className="mt-3 h-56" role="img" aria-label={`Estimated kilograms recovered by material: ${materials.map((m) => `${m.m} ${m.kg} kilograms`).join(', ') || 'no data'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={materials} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="m" tick={{ fontSize: 11 }} interval={0} angle={-18} dy={8} height={52} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="kg" fill="#1E3A5F" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold"><History size={16} /> Recent</h3>
              <ul className="mt-3 space-y-2.5">
                {validHistory.slice(0, 6).map((h) => (
                  <li key={h.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-2.5 text-[13px]">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{h.item}</span>
                      <span className="text-[11px] text-[var(--color-muted-fg)]">{new Date(h.at).toLocaleString()} · {h.verified ? 'verified ✓' : 'unverified'}</span>
                    </span>
                    <BinBadge bin={h.bin} size="sm" />
                    <span className="font-bold text-[#059669]">+{h.points}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold"><User size={16} className="text-[#1E3A5F]" /> Profile</h3>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          Signed in as <b className="text-[var(--color-foreground)]">{state.profile.name || '—'}</b>
          {[state.profile.school, state.profile.klass].filter(Boolean).join(' · ') && ` · ${[state.profile.school, state.profile.klass].filter(Boolean).join(' · ')}`}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={exportCsv} disabled={!hasData} className="focus-ring rounded-xl border border-[var(--color-border)] px-4 py-2 text-[13px] font-bold disabled:opacity-50 hover:bg-[var(--color-muted)]">Export CSV</button>
          <button onClick={switchProfile} className="focus-ring min-h-[44px] rounded-xl border border-[var(--color-border)] px-4 py-2 text-[13px] font-bold hover:bg-[var(--color-muted)]">Switch profile</button>
          <button onClick={eraseDevice} className="focus-ring min-h-[44px] rounded-xl border border-red-300 px-4 py-2 text-[13px] font-bold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950">Erase this device</button>
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted-fg)]">Shared tablet? Switch profiles or wipe this device. Server data is kept.</p>
      </div>
    </div>
  )
}
