import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { BadgeCheck, Printer, QrCode, Trophy } from 'lucide-react'
import { BIN_LIST, binById } from '../data/bins.js'
import { WASTE_ITEMS } from '../data/wasteItems.js'
import { addDisposal, applyServerProfile, buildBinPayload, loadState, LOCAL_PROFILE_PREFIX, MAX_HISTORY, MAX_OUTBOX, parseBinPayload, rid, saveState } from '../lib/store.js'
import { DAILY_DISPOSAL_LIMIT, DAY_MS, KG_PER_RECYCLABLE_ITEM, SCAN_MATCH_BONUS, SCAN_TTL_MINUTES, isScanFresh, scoreDisposal } from '../lib/scoring.js'
import { disposeRemote } from '../lib/dataTier.js'
import { Tilt } from '../components/fx.jsx'
import { useEcoSync } from '../lib/useEcoSync.js'
import { SectionHead } from '../components/ui.jsx'

const SITE = 'SCHOOL-01'
// The live site code is NEVER displayed: the helper shows the format with a
// masked code, so a valid bin code can't be harvested from screenshots —
// you must read it off the physical poster (presence required).
const maskSite = (site) => {
  const s = String(site || SITE)
  return s.length <= 4 ? '••••' : `${s.slice(0, 3)}••••`
}

// QR rendering is pure CPU work — memoize so typing in the code field
// doesn't re-render the posters on every keystroke.
const MemoQR = memo(function MemoQR({ value, size, ...rest }) {
  return <QRCodeSVG value={value} size={size} {...rest} />
})

export default function Verify() {
  const [profile, setProfile] = useState(() => loadState())
  const [code, setCode] = useState('')
  const [itemName, setItemName] = useState(() => loadState().lastScan?.item || 'Plastic PET bottle')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [printBin, setPrintBin] = useState('RECYCLABLE')
  // Pilot site code: which physical location these bin QRs belong to.
  // Editable per school — persisted, used by every payload on this page.
  const [siteCode, setSiteCode] = useState(() => loadState().siteCode || SITE)

  const updateSiteCode = (raw) => {
    const clean = String(raw || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').replace(/-+/g, '-').slice(0, 24) || SITE
    setSiteCode(clean)
    const s = loadState()
    saveState({ ...s, siteCode: clean })
  }

  const item = useMemo(() => WASTE_ITEMS.find((w) => w.name === itemName) || WASTE_ITEMS[0], [itemName])
  const lastScan = profile.lastScan
  const isServerProfile = (p) => p?.profileId && !String(p.profileId).startsWith(LOCAL_PROFILE_PREFIX)

  // Offline outbox: disposals recorded without a backend are queued with their
  // original QR + scan token and flushed here (mount) and after each
  // successful online verify. The server re-validates everything on flush;
  // entries carry parseable qids (`q_<time36>_<rand>`) so double-flushes
  // (two tabs, retry after timeout) dedupe instead of double-awarding.
  const round2 = (n) => Math.round(((n || 0) + Number.EPSILON) * 100) / 100
  const stampQid = () => `q_${Date.now().toString(36)}_${rid().slice(0, 8)}`
  const flushRef = useRef(null)

  const flushOutbox = async (base) => {
    let box = [...(base.outbox || [])]
    if (!box.length || !isServerProfile(base)) return { synced: 0, dropped: 0, dups: 0 }
  // Stamp stable qids first (persisted): retries of the same entry then
  // dedupe server-side instead of double-awarding. Entries with missing or
  // >25-day-old qids are restamped — the server ignores qids older than 30
  // days, so restamping keeps long-queued entries deduplicable on flush.
  const qidAgeMs = (qid) => {
    const m = /^q_([0-9a-z]+)_/i.exec(String(qid || ''))
    if (!m) return Infinity
    const t = parseInt(m[1], 36)
    return Number.isFinite(t) ? Date.now() - t : Infinity
  }
  const needsStamp = (e) => !e.qid || qidAgeMs(e.qid) > 25 * DAY_MS
  if (box.some(needsStamp)) {
    box = box.map((e) => (needsStamp(e) ? { ...e, qid: stampQid() } : e))
    base = { ...base, outbox: box }
    saveState(base)
    setProfile(base)
  }
    let cur = base
    let synced = 0
    let dropped = 0
    let dups = 0
    for (const entry of box) {
      // Only server-known fields travel — never local award numbers.
      const r = await disposeRemote({ profileId: cur.profileId, item: entry.item, bin: entry.bin, qr: entry.qr, scanToken: entry.scanToken || '', scanId: entry.scanId || '', qid: entry.qid })
      if (r.ok) {
        if (r.duplicate) dups++
        else synced++
        cur = applyServerProfile(cur, r.profile, r.history || [])
        continue
      }
      // Retryable (offline/rate-limit/overload): stop, keep the rest queued.
      if (r.offline || r.http === 429 || r.http === 503) break
      // Permanent refusal (bad QR, unknown profile, validation): drop this one
      // so a poison entry can't head-of-line-block the whole queue.
      dropped++
    }
    const remaining = box.slice(synced + dropped + dups)
    // Nothing changed server-side: local offline awards are intact, touch nothing.
    if (synced === 0 && dropped === 0 && dups === 0) return { synced: 0, dropped: 0, dups: 0 }
    // Merge-back: server truth already includes the flushed ones; re-attach the
    // still-queued remainder. Awards are RECOMPUTED from the shared table
    // (stored numbers are untrusted localStorage), keeping at most the legit
    // scan bonus — tampered figures collapse back to table rates.
    const re = remaining.map((e) => {
      const v = scoreDisposal(e.item, e.bin)
      const keepBonus = Math.min(Math.max(0, (e.earned || 0) - v.earned), SCAN_MATCH_BONUS)
      return { ...e, earned: v.earned + keepBonus, co2: v.co2, verified: v.correct }
    })
    const reVerified = re.filter((e) => e.verified)
    const next = {
      ...cur,
      points: cur.points + re.reduce((a, e) => a + e.earned, 0),
      scans: cur.scans + remaining.length,
      correctDisposals: cur.correctDisposals + reVerified.length,
      co2Saved: round2(cur.co2Saved + reVerified.reduce((a, e) => a + (e.co2 || 0), 0)),
      recyclableKg: round2(cur.recyclableKg + reVerified.filter((e) => e.bin === 'RECYCLABLE' || e.bin === 'E_WASTE').length * KG_PER_RECYCLABLE_ITEM),
      history: [
        ...re.map((e, i) => ({ id: `q${rid().slice(0, 12)}`, item: e.item, bin: e.bin, points: e.earned, co2: e.co2, site: parseBinPayload(e.qr)?.site || '', at: Number(e.at) > 0 ? e.at : Date.now(), verified: e.verified })),
        ...(cur.history || []),
      ].slice(0, MAX_HISTORY),
      outbox: remaining,
    }
    saveState(next)
    setProfile(next)
    return { synced, dropped, dups }
  }

  // Mount-flush and post-verify flush can overlap (slow network + quick user):
  // share one in-flight run, and chain a follow-up when new outbox entries
  // arrive mid-flight so nothing queued waits for the next mount.
  const flushQueued = useRef(false)
  const guardedFlush = (base) => {
    if (flushRef.current) {
      flushQueued.current = true
      return flushRef.current
    }
    flushRef.current = flushOutbox(base).finally(() => {
      flushRef.current = null
      if (flushQueued.current) {
        flushQueued.current = false
        const s = loadState()
        if ((s.outbox || []).length) guardedFlush(s)
      }
    })
    return flushRef.current
  }

  useEffect(() => {
    const s = loadState()
    if ((s.outbox || []).length && isServerProfile(s)) {
      guardedFlush(s).then(({ synced, dropped, dups }) => {
        if (synced > 0) setMsg({ ok: true, text: `Back online — synced ${synced} queued offline disposal${synced === 1 ? '' : 's'} to your profile${dropped > 0 ? ` (${dropped} outdated ${dropped === 1 ? 'entry' : 'entries'} dropped)` : ''}${dups > 0 ? ` (${dups} already counted)` : ''}.` })
        else if (dups > 0) setMsg({ ok: true, text: 'Those disposals were already counted — nothing new to sync.' })
        else if (dropped > 0) setMsg({ ok: false, text: `${dropped} queued ${dropped === 1 ? 'entry was' : 'entries were'} outdated and skipped.` })
      })
    }
    // Network returning mid-session must also trigger a flush — mounts alone
    // would leave the queue stalled while the page just sits open.
    const onOnline = () => {
      const cur = loadState()
      if ((cur.outbox || []).length && isServerProfile(cur)) guardedFlush(cur)
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Stay fresh across tabs/pages; adopt a NEWER scan's item automatically
  // (including novel AI names — the dropdown renders them as an option below).
  useEcoSync(() => {
    const fresh = loadState()
    setProfile((prev) => {
      if (fresh.lastScan?.at !== prev.lastScan?.at && fresh.lastScan?.item) {
        setItemName(fresh.lastScan.item)
      }
      return fresh
    })
  })

  const submit = async (raw) => {
    const qrText = (raw || code).trim()
    const parsed = parseBinPayload(qrText)
    if (!parsed) {
      setMsg({ ok: false, text: 'That QR code is not an EcoSort bin code. It must look like the format shown below the field.' })
      return
    }
    setBusy(true)
    // One qid per submit ATTEMPT, shared by the online call and the queued
    // fallback: if the online call succeeds server-side but its response is
    // lost (offline branch queues a retry), the flush dedupes on this qid
    // instead of awarding twice.
    const attemptQid = stampQid()
    // The scan token (server-issued at classify time) is the ONLY proof the
    // server accepts for the bonus — raw bin/timestamp claims are forgeable.
    // Offline we still show the indicative bonus; the server re-decides on sync.
    const scanToken = lastScan?.token || ''
    const scanBin = lastScan?.bin || ''
    const scanFresh = isScanFresh(lastScan)
    // Server first: validates the QR + bin and records the disposal in the database.
    // scanToken serves the /api tier, scanId the Firebase tier — each backend
    // uses its own and ignores the other. Every submit carries a qid so a
    // client retry after a timeout dedupes instead of double-awarding.
    const remote = isServerProfile(profile)
      ? await disposeRemote({ profileId: profile.profileId, item: item.name, bin: parsed.bin, qr: qrText, scanToken, scanId: lastScan?.scanId || '', qid: attemptQid })
      : { ok: false, offline: true }

    if (remote.ok) {
      // Consume the scan bonus so it can't be claimed twice.
      const next = { ...applyServerProfile(profile, remote.profile, remote.history || []), lastScan: null }
      saveState(next)
      setProfile(next)
      setCode('')
      setMsg({
        ok: remote.correct,
        challengeCta: remote.correct,
        text: remote.correct
          ? `Verified! ${item.name} → ${binById(parsed.bin).label}. +${remote.earned} pts saved to your profile${remote.scanBonus ? ' (includes scan-match bonus)' : ''}.`
          : `${item.name} belongs in ${binById(item.bin).label}, but you scanned ${binById(parsed.bin).label}. +${remote.earned} pts for trying — check the guide and try again!`,
      })
      // Opportunistically flush anything queued while offline.
      if ((next.outbox || []).length) guardedFlush(next)
    } else if (!remote.offline) {
      // Server refused (rate limit, validation, …) — surface it, record nothing.
      const wait = Number(remote.retryAfter)
      const suffix = remote.http === 429 && Number.isFinite(wait) && wait > 0 ? ` Retry in ${wait}s.` : ''
      setMsg({ ok: false, text: `${remote.error || 'Verification failed. Try again.'}${suffix}` })
    } else {
      // Offline fallback: SAME shared scoring table as the server, queued for
      // automatic sync (outbox) when the backend is reachable again.
      const s = scoreDisposal(item.name, parsed.bin)
      const matchesScan = scanFresh && scanBin === parsed.bin
      const bonus = s.correct && matchesScan ? SCAN_MATCH_BONUS : 0
      const pts = s.earned + bonus
      const next = {
        ...addDisposal(profile, { item: item.name, bin: parsed.bin, points: pts, co2: s.co2, verified: s.correct, site: parsed.site }),
        lastScan: matchesScan ? null : profile.lastScan,
        outbox: [...(profile.outbox || []), { qid: attemptQid, at: Date.now(), item: item.name, bin: parsed.bin, qr: qrText, scanToken: scanToken || '', scanId: lastScan?.scanId || '', earned: pts, co2: s.co2, verified: s.correct }].slice(-MAX_OUTBOX),
      }
      saveState(next)
      setProfile(next)
      setCode('')
      setMsg({
        ok: s.correct,
        challengeCta: s.correct,
        text: s.correct
          ? `Verified offline! ${item.name} → ${binById(parsed.bin).label}. +${pts} pts${bonus ? ' (includes scan-match bonus)' : ''} (queued — syncs automatically when back online).`
          : `${item.name} belongs in ${binById(item.bin).label}, but you scanned ${binById(parsed.bin).label}. +${pts} pts for trying.`,
      })
    }
    setBusy(false)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHead level={1} kicker="Verify" title="Scan. Earn." sub="Dispose right, enter the bin QR, get points. Same-bin scan within 30 min: +10." />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 print:hidden">
          <h3 className="font-display flex items-center gap-2 font-bold"><QrCode size={18} className="text-[#059669]" /> Verify</h3>
          {lastScan && (
            <p className="mt-2 rounded-xl bg-[var(--color-muted)] p-3 text-[13px] font-medium">
              Last scan: <b>{lastScan.item}</b> → {binById(lastScan.bin).label}.{' '}
              {isScanFresh(lastScan)
                ? `Same bin, ${SCAN_TTL_MINUTES} min → +${SCAN_MATCH_BONUS}.`
                : 'Too old for bonus.'}
            </p>
          )}
          <label className="mt-3 block text-sm font-semibold">What did you throw?
            <select value={itemName} onChange={(e) => setItemName(e.target.value)}
              className="focus-ring mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm font-medium">
              {itemName && !WASTE_ITEMS.some((w) => w.name === itemName) && (
                <option value={itemName}>{itemName} (AI scan)</option>
              )}
              {WASTE_ITEMS.map((w) => <option key={w.name} value={w.name}>{w.name} → {binById(w.bin).label}</option>)}
            </select>
          </label>
          <label className="mt-3 block text-sm font-semibold">Bin QR code
            <input value={code} onChange={(e) => setCode(e.target.value)}
              aria-describedby="qr-help" autoComplete="off" spellCheck={false}
              className="focus-ring mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 font-mono text-sm outline-none" />
            <span id="qr-help" className="mt-1 block text-xs font-medium text-[var(--color-muted-fg)]">
              Format example (don't submit this — read the code off the printed poster): <code className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 font-mono">ECOSORT1:&lt;BIN&gt;:{maskSite(siteCode)}</code>
            </span>
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {import.meta.env.DEV && BIN_LIST.map((b) => (
              <button key={b.id} disabled={busy} onClick={() => submit(buildBinPayload(b.id, siteCode))}
                className="focus-ring rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold disabled:opacity-50 hover:border-[#059669] hover:text-[#059669]">
                Demo: {b.label} QR
              </button>
            ))}
          </div>
          <button onClick={() => submit()} disabled={busy}
            className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#059669] px-4 py-3 text-sm font-bold text-white disabled:opacity-50 hover:bg-[#047857]">
            <BadgeCheck size={17} /> {busy ? 'Verifying…' : 'Verify & claim points'}
          </button>
          <p className="mt-1.5 text-center text-[11px] font-medium text-[var(--color-muted-fg)]">Up to {DAILY_DISPOSAL_LIMIT} disposals count per day · wrong bins earn consolation points only</p>
          {msg && (
            <div className={`mt-3 rounded-xl border p-3 ${msg.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200'}`}>
              <p role={msg.ok ? 'status' : 'alert'} className="flex items-start gap-2 text-sm font-semibold">
                <Trophy size={16} className="mt-0.5 shrink-0" /> {msg.text}
              </p>
              {msg.challengeCta && (
                <Link to="/challenges" className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A5F] px-3 py-2 text-xs font-bold text-white hover:opacity-95">
                  Claim a challenge step →
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h3 className="font-display flex items-center gap-2 font-bold"><Printer size={18} className="text-[#1E3A5F]" /> Bin posters</h3>
          <label className="mt-3 block text-sm font-semibold">Pilot site code
            <input value={siteCode} onChange={(e) => updateSiteCode(e.target.value)} maxLength={24}
              aria-describedby="site-help" autoComplete="off" spellCheck={false}
              className="focus-ring mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 font-mono text-sm uppercase outline-none" />
            <span id="site-help" className="mt-1 block text-xs font-medium text-[var(--color-muted-fg)]">One code per school. Posters + scans must match.</span>
          </label>
          <div className="mt-3 flex flex-wrap gap-2 print:hidden">
            {BIN_LIST.map((b) => (
              <button key={b.id} onClick={() => setPrintBin(b.id)}
                className={`focus-ring rounded-lg px-3 py-1.5 text-xs font-bold ${printBin === b.id ? 'bg-[#1E3A5F] text-white' : 'bg-[var(--color-muted)]'}`}>{b.label}</button>
            ))}
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--color-border)] text-center">
            <div className="px-4 py-3 text-white" style={{ background: binById(printBin).color }}>
              <p className="font-display text-xl font-extrabold tracking-tight">{binById(printBin).label}</p>
              <p className="text-[13px] font-medium opacity-90">{binById(printBin).tagline}</p>
            </div>
            <Tilt max={10}>
            <div className="grid place-items-center p-6">
              <div className="rounded-2xl bg-white p-4 shadow">
                <MemoQR value={buildBinPayload(printBin, siteCode)} size={180} role="img" aria-label={`${binById(printBin).label} QR code. Scan it with your camera to verify disposal.`} />
              </div>
              <div className="mt-2 flex max-w-xs flex-wrap justify-center gap-1.5">
                {binById(printBin).examples.slice(0, 4).map((e) => (
                  <span key={e} className="rounded-full bg-[var(--color-muted)] px-2.5 py-1 text-[11px] font-bold">{e}</span>
                ))}
              </div>
              <p className="mt-2 max-w-xs text-xs font-medium text-[var(--color-muted-fg)]">{binById(printBin).tip}</p>
              <p className="mt-1 max-w-xs text-xs text-[var(--color-muted-fg)]">Stick on the bin. Dispose, scan, earn.</p>
              <button onClick={() => window.print()} className="focus-ring mt-3 rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-bold hover:bg-[var(--color-muted)] print:hidden">Print</button>
            </div>
            </Tilt>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 print:hidden">
            {BIN_LIST.filter((b) => b.id !== printBin).slice(0, 2).map((b) => (
              <div key={b.id} className="grid place-items-center rounded-xl bg-[var(--color-muted)] p-3">
                <MemoQR value={buildBinPayload(b.id, siteCode)} size={72} aria-hidden="true" />
                <p className="mt-1 text-[11px] font-bold">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
