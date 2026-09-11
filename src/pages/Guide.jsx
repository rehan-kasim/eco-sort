import { Check, Lightbulb, X } from 'lucide-react'
import { BIN_LIST } from '../data/bins.js'
import { SectionHead } from '../components/ui.jsx'
import { Bin3D, Tilt } from '../components/fx.jsx'

export default function Guide() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHead level={1} kicker="Guide" title="What goes where" sub="Four bins. Zero guessing." />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {BIN_LIST.map((b, i) => (
          <Tilt key={b.id} max={8} className={`rise rise-${(i % 4) + 1}`}>
            <article className="h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
              <div className="flex items-center gap-4">
                <Bin3D bin={b.id} label={false} className="pop-sm w-20 shrink-0 scale-[.55] !-my-7" />
                <div>
                  <h2 className="font-display text-xl font-bold">{b.label}</h2>
                  <p className="text-sm font-medium text-[var(--color-muted-fg)]">{b.tagline}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {b.examples.slice(0, 4).map((e) => (
                  <span key={e} className="rounded-full bg-[var(--color-muted)] px-2.5 py-1 text-xs font-semibold">{e}</span>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Do</p>
                  <ul className="mt-1.5 space-y-1 text-[13px] font-medium">
                    {b.dos.slice(0, 2).map((d) => <li key={d} className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />{d}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl bg-red-50 p-3 dark:bg-red-950">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-300">Don't</p>
                  <ul className="mt-1.5 space-y-1 text-[13px] font-medium">
                    {b.donts.slice(0, 2).map((d) => <li key={d} className="flex gap-1.5"><X size={14} className="mt-0.5 shrink-0 text-red-500" />{d}</li>)}
                  </ul>
                </div>
              </div>
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3 text-[13px] font-medium text-[var(--color-muted-fg)]"><Lightbulb size={15} className="mt-0.5 shrink-0 text-[#059669]" aria-hidden /> {b.tip}</p>
            </article>
          </Tilt>
        ))}
      </div>

      <Tilt max={5} className="mt-6">
        <div className="rounded-2xl bg-[#1E3A5F] p-6 text-white">
          <h3 className="font-display text-lg font-bold">5-second rule</h3>
          <ol className="mt-2 grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
            <li>Food / peel? → <b className="text-white">Wet.</b></li>
            <li>Battery / wire / gadget? → <b className="text-white">E-Waste.</b></li>
            <li>Clean paper / plastic / metal / glass? → <b className="text-white">Recyclable.</b></li>
            <li>Dirty / mixed / foamy? → <b className="text-white">Dry.</b></li>
          </ol>
        </div>
      </Tilt>
    </div>
  )
}
