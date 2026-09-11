import { Link } from 'react-router-dom'
import { ArrowRight, BatteryCharging, Camera, ChartBar, Leaf, QrCode, Recycle, Trophy } from 'lucide-react'
import { BIN_LIST } from '../data/bins.js'
import { SectionHead } from '../components/ui.jsx'
import { Bin3D, Tilt } from '../components/fx.jsx'

export default function Landing() {
  return (
    <div>
      {/* HERO — minimal words, 3D stage */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-24 right-[-10%] h-96 w-96 rounded-full bg-[#059669]/15 blur-3xl" />
          <div className="absolute bottom-[-30%] left-[-5%] h-80 w-80 rounded-full bg-[#2563EB]/15 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-16">
          <div>
            <p className="rise inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-bold text-[var(--color-muted-fg)]">
              <Leaf size={14} className="text-[#059669]" /> Schools · SDG 11 · 12 · 13
            </p>
            <h1 className="rise rise-1 font-display mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Snap it.<br /> <span className="text-[#059669]">Sort it right.</span>
            </h1>
            <p className="rise rise-2 mt-4 max-w-xl text-[16px] leading-relaxed text-[var(--color-muted-fg)]">
              Photo → right bin → points. That's the whole app.
            </p>
            <div className="rise rise-3 mt-6 flex flex-wrap gap-3">
              <Link to="/scan" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#059669] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-[#047857]">
                <Camera size={17} /> Scan waste <ArrowRight size={16} />
              </Link>
              <Link to="/guide" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-3 text-sm font-bold transition hover:bg-[var(--color-muted)]">
                <Recycle size={17} /> Bins
              </Link>
            </div>
            <dl className="rise rise-4 mt-8 grid max-w-md grid-cols-3 gap-3">
              {[{ v: '4', l: 'bins' }, { v: '20s', l: 'per sort' }, { v: '+50', l: 'max pts' }].map((s) => (
                <div key={s.l} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-center">
                  <dt className="sr-only">{s.l}</dt>
                  <dd className="font-display text-2xl font-bold">{s.v}</dd>
                  <dd className="text-[11px] font-medium text-[var(--color-muted-fg)]">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 3D bin stage */}
          <Tilt max={10} className="rise rise-2 mx-auto w-full max-w-md">
            <div className="scene-lg preserve-3d relative flex items-end justify-center gap-1 rounded-[2rem] border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-card)] to-[var(--color-muted)] px-2 pb-6 pt-10 sm:gap-2">
              <div className="floaty-soft" style={{ transform: 'translateZ(-40px) scale(.82)' }}><Bin3D bin="WET" /></div>
              <div className="floaty" style={{ animationDelay: '.4s' }}><Bin3D bin="RECYCLABLE" /></div>
              <div className="bob"><Bin3D bin="E_WASTE" /></div>
              <div className="floaty-soft" style={{ transform: 'translateZ(-40px) scale(.82)', animationDelay: '.9s' }}><Bin3D bin="DRY" /></div>
              <div className="pop absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-xl dark:bg-white dark:text-slate-900">
                AI · 97% · +20 pts
              </div>
            </div>
          </Tilt>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead kicker="How it works" title="Snap. Sort. Score." />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: Camera, t: 'Snap', d: 'Photo of your waste.' },
            { icon: Recycle, t: 'Sort', d: 'AI names the right bin.' },
            { icon: QrCode, t: 'Score', d: 'Scan the bin QR. Points.' },
          ].map((s, i) => (
            <Tilt key={s.t} max={9} className={`rise rise-${i + 1}`}>
              <div className="card-hover h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
                <span className="pop-sm grid h-11 w-11 place-items-center rounded-xl bg-[#1E3A5F] text-white"><s.icon size={20} /></span>
                <h3 className="font-display mt-4 text-lg font-bold">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted-fg)]">{s.d}</p>
              </div>
            </Tilt>
          ))}
        </div>
      </section>

      {/* BINS */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHead kicker="4 bins" title="One home per item" />
          <Link to="/guide" className="focus-ring text-sm font-bold text-[#059669] hover:underline">Guide →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BIN_LIST.map((b, i) => (
            <Tilt key={b.id} max={11} className={`rise rise-${i + 1}`}>
              <Link to="/guide" className={`card-hover focus-ring preserve-3d block rounded-2xl border p-5 text-center ${b.bg}`}>
                <Bin3D bin={b.id} label={false} className="pop-sm mx-auto scale-[.62] !-my-5" />
                <p className="font-display font-bold">{b.label}</p>
                <p className="mt-0.5 text-xs opacity-80">{b.tagline}</p>
              </Link>
            </Tilt>
          ))}
        </div>
      </section>

      {/* PLAY + PROOF */}
      <section className="mx-auto mt-14 grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-2">
        <Tilt max={7} className="rise rise-1">
          <div className="h-full rounded-2xl border border-[var(--color-border)] bg-[#1E3A5F] p-7 text-white">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-300"><Trophy size={15} /> Play</p>
            <h3 className="font-display mt-2 text-2xl font-bold">Streaks. Ranks. Showdowns.</h3>
            <div className="mt-4 space-y-2">
              {[['Wet / Dry', '+10'], ['Recyclable', '+15–20'], ['E-waste', '+30–50']].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold">
                  <span>{k}</span><span className="text-emerald-300">{v}</span>
                </div>
              ))}
            </div>
            <Link to="/leaderboard" className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#1E3A5F] hover:bg-slate-100">Ranks <ArrowRight size={15} /></Link>
          </div>
        </Tilt>
        <Tilt max={7} className="rise rise-2">
          <div className="h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-7">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#059669]"><ChartBar size={15} /> Proof</p>
            <h3 className="font-display mt-2 text-2xl font-bold">Kilograms, not promises.</h3>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[{ v: 'Sorted', l: 'count' }, { v: 'kg', l: 'recovered' }, { v: 'CO₂e', l: 'avoided' }].map((s) => (
                <div key={s.l} className="rounded-xl bg-[var(--color-muted)] p-3"><p className="font-display text-xl font-bold">{s.v}</p><p className="text-[11px] text-[var(--color-muted-fg)]">{s.l}</p></div>
              ))}
            </div>
            <Link to="/dashboard" className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-[#059669] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#047857]">Dashboard <ArrowRight size={15} /></Link>
          </div>
        </Tilt>
      </section>

      {/* SDG */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {['SDG 11 · Cities', 'SDG 12 · Consumption', 'SDG 13 · Climate'].map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-[#1E3A5F] px-3 py-1.5 text-[11px] font-bold text-white"><Leaf size={13} /> {s}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
        <Tilt max={5}>
          <div className="rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E3A5F] via-[#1E3A5F] to-[#047857] p-8 text-center text-white sm:p-12">
            <BatteryCharging size={30} className="pop mx-auto text-emerald-300" />
            <h2 className="font-display mx-auto mt-3 max-w-xl text-3xl font-extrabold tracking-tight">Your school. This month.</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/scan" className="focus-ring rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#1E3A5F] hover:bg-slate-100">Start now</Link>
              <Link to="/verify" className="focus-ring rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Bin QRs</Link>
            </div>
          </div>
        </Tilt>
      </section>
    </div>
  )
}
