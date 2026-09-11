// Shared Gemini-result sanitizer — used by BOTH vision paths:
//   - server:  api/classify.js (Gemini REST)
//   - client:  Firebase AI Logic (src/lib/firebase.js)
// One implementation so previews, points, CO2 and fallbacks can never drift.
import { BIN_IDS, binById } from '../data/bins.js'
import { WASTE_ITEMS } from '../data/wasteItems.js'
import { scoreDisposal } from './scoring.js'

const BINS = BIN_IDS

export function sanitizeResult(obj) {
  const bin = BINS.includes(obj?.bin) ? obj.bin : 'DRY'
  const confidence = Math.max(1, Math.min(99, Math.round(Number(obj?.confidence) || 60)))
  const previewKnown = WASTE_ITEMS.find((w) => w.name.toLowerCase() === String(obj?.item || '').toLowerCase())
  const alternatives = Array.isArray(obj?.alternatives) && obj.alternatives.length > 0
    ? obj.alternatives.slice(0, 2).map((a) => ({
        name: String(a?.name || 'Unknown item').slice(0, 60),
        bin: BINS.includes(a?.bin) ? a.bin : 'DRY',
        conf: Math.max(1, Math.min(99, Math.round(Number(a?.conf) || 20))),
      }))
    : WASTE_ITEMS.filter((w) => w.bin === bin && w.name !== obj?.item).slice(0, 2)
        .map((a, i) => ({ name: a.name, bin: a.bin, conf: 45 - i * 12 }))
  const co2raw = Number(obj?.co2)
  const item = {
    name: String(obj?.item || 'Unknown item').slice(0, 80),
    bin,
    keywords: [],
    conf: confidence,
    // Preview points come from the SAME scoring table as payouts —
    // never a separately computed number.
    points: previewKnown ? previewKnown.points : scoreDisposal(String(obj?.item || ''), bin).earned,
    co2: previewKnown ? previewKnown.co2 : (co2raw > 0 ? Math.min(5, co2raw) : bin === 'E_WASTE' ? 0.15 : bin === 'RECYCLABLE' ? 0.06 : 0.02),
    material: String(obj?.material || 'Mixed').slice(0, 40),
    recyclable: !!obj?.recyclable,
    // Knowledge-base backfill: a terse model reply still yields actionable guidance.
    how: String(obj?.how || '').trim() || `${binById(bin).tip} Rinse/clean if needed, then dispose and scan the bin QR.`,
  }
  return { item, confidence, alternatives }
}

// Tolerant model-JSON parser (fences, trailing prose, concatenated objects,
// raw control chars). Shared for the same reason.
export function parseModelJson(text) {
  const candidates = []
  const t = String(text || '').trim().replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '').trim()
  candidates.push(t)
  const greedy = t.match(/\{[\s\S]*\}/)
  if (greedy && greedy[0] !== t) candidates.push(greedy[0])
  const start = t.indexOf('{')
  if (start >= 0) {
    let depth = 0, inStr = false, esc = false, end = -1
    for (let i = start; i < t.length; i++) {
      const ch = t[i]
      if (inStr) {
        if (esc) esc = false
        else if (ch === '\\') esc = true
        else if (ch === '"') inStr = false
      } else if (ch === '"') inStr = true
      else if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          end = i
          break
        }
      }
    }
    if (end > start) candidates.push(t.slice(start, end + 1))
  }
  const errors = []
  for (const c of candidates) {
    for (const variant of [c, c.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]+/g, ' ')]) {
      try {
        return JSON.parse(variant)
      } catch (e) {
        errors.push(String(e?.message || e))
      }
    }
  }
  throw new Error('non-JSON: ' + errors[0])
}
