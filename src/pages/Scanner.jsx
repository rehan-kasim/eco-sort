import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CheckCircle2, ImagePlus, Info, Loader2, QrCode, RefreshCw, Sparkles } from 'lucide-react'
import { classifyRemote } from '../lib/dataTier.js'
import { downscaleDataUrl, readFileAsDataUrl } from '../lib/image.js'
import { Tilt } from '../components/fx.jsx'
import { binById } from '../data/bins.js'
import { BinBadge, SectionHead } from '../components/ui.jsx'
import { loadState, saveState } from '../lib/store.js'

const SAMPLE_HINTS = ['plastic bottle', 'banana peel', 'old phone', 'chips packet', 'newspaper', 'battery']

  // Staged pipeline labels shown while Gemini works.
const STEPS = [
  { label: 'Preprocessing image', detail: 'Resize · denoise · normalize lighting' },
  { label: 'Detecting object', detail: 'Foreground segmentation + bounding box' },
  { label: 'Classifying material', detail: 'Gemini vision · 4-bin segregation rules' },
  { label: 'Mapping to bin', detail: 'City segregation rules · school bin map' },
]

// Backoff between attempts (then 15s forever until success, cancel, or a
// non-retryable error). Detection is Gemini-only — there is no local fallback.
const RETRY_DELAYS = [2000, 4000, 8000, 15000]
const NON_RETRYABLE = new Set([400, 401, 403, 404, 405, 413])

export default function Scanner() {
  const [preview, setPreview] = useState('')
  const [fileName, setFileName] = useState('')
  const [hint, setHint] = useState('')
  const [stage, setStage] = useState('idle') // idle | scanning | done
  const [stepIdx, setStepIdx] = useState(0)
  const [result, setResult] = useState(null)
  const [notice, setNotice] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [fileError, setFileError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const fileRef = useRef(null)
  const camRef = useRef(null)
  const scanningRef = useRef(false)
  const cancelRef = useRef(false)
  const nav = useNavigate()

  const onFile = async (f) => {
    if (!f || scanningRef.current) return
    setFileError('')
    try {
      // Reject monsters before FileReader/downscale churn (downscaled anyway).
      if (f.size > 8 * 1024 * 1024) {
        setFileError('That photo is over 8MB. Take a smaller photo or screenshot it first.')
        return
      }
      if (!/^image\//.test(f.type || '') && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(f.name || '')) {
        setFileError('That file is not an image. Choose a JPG, PNG or WebP photo.')
        return
      }
      const raw = await readFileAsDataUrl(f)
      // Downscale before preview + upload: phones shoot 12MP+, the model needs ~1MP.
      const url = await downscaleDataUrl(raw)
      setPreview(url); setFileName(f.name || 'upload.jpg')
      run(url, f.name || '')
    } catch {
      setFileError('Could not read that photo. Try a different file.')
    }
  }

  // hintText param: callers with a fresh hint (chip click) pass it directly —
  // reading `hint` state here would see the pre-click value.
  // Gemini is the only detector: on retryable failures (offline, rate limit,
  // 5xx, timeout) this loops with backoff until the AI answers, the user
  // cancels, or a non-retryable error (bad image) stops it.
  const run = async (dataUrl, name, hintText = hint) => {
    if (scanningRef.current) return
    scanningRef.current = true
    cancelRef.current = false
    setStage('scanning'); setStepIdx(0); setResult(null); setNotice(''); setElapsed(0); setAttempt(0)
    const tick = setInterval(() => setStepIdx((i) => Math.min(i + 1, 3)), 900)
    // The staged checklist finishes in ~3.6s but the AI call can take up to
    // ~10s — after 4s show an honest "still working" line with a live timer.
    const t0 = Date.now()
    const clock = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 500)
    const finish = (r, scan) => {
      const s = loadState()
      // The scan token (server-issued, unforgeable) is what earns the
      // scan-match bonus at dispose time — plain timestamps are not trusted.
      // On the Firebase tier the equivalent is scanId (consumed server-time).
      saveState({ ...s, lastScan: { item: r.item.name, bin: r.item.bin, at: scan?.at || Date.now(), token: scan?.token || null, scanId: scan?.id || null } })
      setResult(r)
      setStage('done')
    }
    const wait = (ms) => new Promise((res) => setTimeout(res, ms))
    const stop = () => {
      clearInterval(tick); clearInterval(clock); setStepIdx(3); scanningRef.current = false
    }
    try {
      const mime = /^data:(image\/[a-zA-Z+.-]+);base64,/.exec(dataUrl || '')?.[1] || 'image/jpeg'
      let n = 0
      for (;;) {
        if (cancelRef.current) {
          setNotice('Cancelled — your photo is still loaded, run it again any time.')
          setStage('done')
          return
        }
        n += 1
        setAttempt(n)
        const remote = await classifyRemote({ image: dataUrl, mimeType: mime, hint: hintText, fileName: name })
        if (remote.ok) {
          finish({ item: remote.item, confidence: remote.confidence, alternatives: remote.alternatives || [], steps: STEPS }, remote.scan)
          return
        }
        // Non-retryable: retrying the same image can never succeed.
        if (!remote.offline && NON_RETRYABLE.has(remote.http)) {
          setNotice(`Couldn't classify that photo (${remote.error || 'invalid image'}). Try another photo.`)
          setStage('done')
          return
        }
        // Honor the server's countdown when present (the AI tells us exactly how
        // long the rate-limit window lasts) — blind fixed-interval retries are
        // what keep a limited window slammed shut.
        const serverWaitMs = (Number(remote.retryAfter) || 0) * 1000
        const waitMs = Math.max(RETRY_DELAYS[Math.min(n - 1, RETRY_DELAYS.length - 1)], serverWaitMs)
        const reason = remote.offline
          ? 'No connection to the AI backend'
          : remote.http === 429
            ? (remote.error && remote.error !== 'AI rate limited, try again shortly' ? remote.error : 'AI is rate-limited')
            : remote.http === 504
              ? 'AI took too long'
              : `AI service issue (${remote.error || 'server error'})`
        setNotice(`${reason} — attempt ${n} failed, retrying in ${Math.round(waitMs / 1000)}s… (Gemini keeps trying until it answers)`)
        await wait(waitMs)
      }
    } finally {
      if (!cancelRef.current) stop()
      else { clearInterval(tick); clearInterval(clock); scanningRef.current = false }
    }
  }

  const cancel = () => { cancelRef.current = true }

  const retryHint = (h) => { setHint(h); if (preview) run(preview, fileName, h) }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHead level={1} kicker="Scanner" title="Snap it. Sort it." sub="Photo in → bin out. Never stored." />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* input card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files?.[0]) }}
            onClick={() => fileRef.current?.click()}
            role="button" tabIndex={0} aria-label="Upload waste photo"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click() } }}
            className={`focus-ring grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-6 text-center transition ${dragOver ? 'border-[#059669] bg-emerald-50 dark:bg-emerald-950' : 'border-[var(--color-border)] hover:border-[#059669]'}`}>
            {preview
              ? <img src={preview} alt="Uploaded waste preview" onError={() => { setPreview(''); setFileError('That photo could not be displayed. Try a different file.') }} className="max-h-72 w-full rounded-xl object-cover" />
              : (
                <div className="py-8">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#059669]/10 text-[#059669]"><ImagePlus size={26} /></span>
                  <p className="font-display mt-3 font-bold">Drop a photo here</p>
                  <p className="mt-1 text-sm text-[var(--color-muted-fg)]">JPG / PNG / WebP</p>
                </div>
              )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
          </div>
          {fileError && <p role="alert" className="mt-2 rounded-xl border border-red-300 bg-red-50 p-3 text-[13px] font-semibold text-red-800 dark:bg-red-950 dark:text-red-200">{fileError}</p>}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="focus-ring flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1E3A5F] px-4 py-3 text-sm font-bold text-white hover:opacity-95">
              <Camera size={16} /> Use camera
              <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
            </label>
            <button onClick={() => fileRef.current?.click()} className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-bold hover:bg-[var(--color-muted)]">
              <ImagePlus size={16} /> Choose file
            </button>
          </div>

          <label className="mt-4 block text-sm font-semibold">
            Think you know it?
            <input value={hint} onChange={(e) => setHint(e.target.value)}
              aria-describedby="hint-help"
              className="focus-ring mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm outline-none" />
            <span id="hint-help" className="mt-1 block text-xs font-medium text-[var(--color-muted-fg)]">Optional. Boosts accuracy.</span>
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SAMPLE_HINTS.map((h) => (
              <button key={h} onClick={() => retryHint(h)} className="focus-ring inline-flex min-h-[44px] items-center rounded-full border border-[var(--color-border)] px-3.5 py-2 text-xs font-semibold text-[var(--color-muted-fg)] hover:border-[#059669] hover:text-[#059669]">{h}</button>
            ))}
          </div>
          {preview && stage !== 'scanning' && (
            <button onClick={() => run(preview, fileName)} className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#059669] px-4 py-3 text-sm font-bold text-white hover:bg-[#047857]">
              <RefreshCw size={16} /> Re-run AI classification
            </button>
          )}
        </div>

        {/* result card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5" aria-live="polite">
          {stage === 'idle' && !result && (
            <div className="grid h-full min-h-72 place-items-center text-center">
              <div>
                <Sparkles size={28} className="mx-auto text-[#059669]" />
                <p className="font-display mt-2 font-bold">Your AI result appears here</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--color-muted-fg)]">Upload a photo to see the bin, confidence, how-to steps and points you can earn.</p>
              </div>
            </div>
          )}
          {stage === 'scanning' && (
            <div>
              <p className="flex items-center gap-2 font-bold"><Loader2 size={18} className="animate-spin text-[#059669]" /> Analysing{attempt > 1 ? ` (attempt ${attempt})` : ''}…</p>
              {notice && <p role="status" className="mt-2 text-[13px] font-medium text-[var(--color-muted-fg)]">{notice}</p>}
              {elapsed >= 4 && !notice && (
                <p role="status" className="mt-2 text-[13px] font-medium text-[var(--color-muted-fg)]">
                  Still contacting the AI ({elapsed}s) — big photos can take a few seconds.
                </p>
              )}
              <ol className="mt-4 space-y-2.5">
                {['Preprocessing image', 'Detecting object', 'Classifying material', 'Mapping to bin'].map((s, i) => (
                  <li key={s} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${i <= stepIdx ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950' : 'border-[var(--color-border)] opacity-60'}`}>
                    {i < stepIdx ? <CheckCircle2 size={17} className="text-[#059669]" /> : i === stepIdx ? <Loader2 size={17} className="animate-spin text-[#059669]" /> : <span className="h-[17px] w-[17px] rounded-full border" />}
                    <span className="font-semibold">{s}</span>
                  </li>
                ))}
              </ol>
              <button onClick={cancel} className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold hover:bg-[var(--color-muted)]">
                Cancel
              </button>
            </div>
          )}
          {stage === 'done' && (
            <>
              {notice && <p role="status" className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[13px] font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">{notice}</p>}
              {result
                ? <ResultView result={result} onVerify={() => nav('/verify')} />
                : (
                  <div className="grid place-items-center py-10 text-center">
                    <p className="font-display font-bold">No result yet</p>
                    <p className="mt-1 max-w-xs text-sm text-[var(--color-muted-fg)]">Upload a photo and Gemini will keep trying until it answers.</p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[var(--color-muted-fg)]">
        <Info size={14} className="mt-0.5 shrink-0" />
        Gemini vision via backend. Never stored. Retries automatically until it answers.
      </p>
    </div>
  )
}

function ResultView({ result, onVerify }) {
  const { item, confidence, alternatives } = result
  const bin = binById(item.bin)
  return (
    <div className="rise">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BinBadge bin={item.bin} />
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            Gemini AI
          </span>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-900">{confidence}% confident</span>
        </span>
      </div>
      <h3 className="font-display mt-3 text-2xl font-bold tracking-tight">{item.name}</h3>
      <Tilt max={10}>
      <div className={`mt-3 rounded-2xl border p-4 ${bin.bg}`}>
        <p className="pop-sm font-bold">→ {bin.label}</p>
        <p className="mt-1 text-sm font-medium">{item.how}</p>
      </div>
      </Tilt>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[13px]">
        <div className="rounded-xl bg-[var(--color-muted)] p-3"><p className="font-display text-lg font-bold">+{item.points}</p><p className="text-[11px] text-[var(--color-muted-fg)]">pts</p></div>
        <div className="rounded-xl bg-[var(--color-muted)] p-3"><p className="font-display text-lg font-bold">{item.co2}kg</p><p className="text-[11px] text-[var(--color-muted-fg)]">CO₂e</p></div>
        <div className="rounded-xl bg-[var(--color-muted)] p-3"><p className="font-display text-lg font-bold">{item.recyclable ? 'Yes' : 'No'}</p><p className="text-[11px] text-[var(--color-muted-fg)]">recyclable</p></div>
      </div>
      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-fg)]">Also considered</p>
        <ul className="mt-1.5 space-y-1.5">
          {alternatives.map((a) => (
            <li key={a.name} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-[13px] font-medium">
              <span>{a.name} · <span className="text-[var(--color-muted-fg)]">{binById(a.bin).label}</span></span>
              <span className="font-bold">{a.conf}%</span>
            </li>
          ))}
        </ul>
      </div>
      <button onClick={onVerify} className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A5F] px-4 py-3 text-sm font-bold text-white hover:opacity-95">
        <QrCode size={17} /> I disposed it — scan bin QR to earn points
      </button>
    </div>
  )
}
