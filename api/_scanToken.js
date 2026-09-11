import { createHmac, timingSafeEqual } from 'node:crypto'
import { CLOCK_SKEW_MS, SCAN_TTL_MS } from '../src/lib/scoring.js'

// Scan tokens make the +10 scan-match bonus unforgeable. The AI backend mints
// a token binding (bin, timestamp) with an HMAC keyed by a server-side secret;
// /api/dispose verifies it, enforces TTL + single-use. Clients can neither
// mint tokens, extend timestamps, replay them, nor move them across bins.
function secret() {
  if (process.env.SCAN_TOKEN_SECRET) return process.env.SCAN_TOKEN_SECRET
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY
  console.warn('[ecosort] SCAN_TOKEN_SECRET and GEMINI_API_KEY both unset — scan tokens use an insecure dev secret')
  return 'dev-only-insecure'
}

// Format `s1.<BIN>.<at36>.<sig32>` — parseable without trusting the client.
export function mintScanToken(bin, at) {
  const stamp = Number(at) > 0 ? Number(at) : Date.now()
  const body = `${bin}.${stamp.toString(36)}`
  const sig = createHmac('sha256', secret()).update(body).digest('hex').slice(0, 32)
  return `s1.${body}.${sig}`
}

// Returns the authenticated timestamp, or 0 when invalid/stale/future.
// Same rule as scoring.isScanFresh (shared CLOCK_SKEW_MS) — the two must
// never disagree on what "fresh" means.
export function checkScanToken(token, bin) {
  try {
    const m = /^s1\.([A-Z_]+)\.([0-9a-z]+)\.([0-9a-f]{32})$/.exec(String(token || ''))
    if (!m || m[1] !== bin) return 0
    const at = parseInt(m[2], 36)
    if (!Number.isFinite(at) || at <= 0 || at > Date.now() + CLOCK_SKEW_MS) return 0
    if (Date.now() - at > SCAN_TTL_MS) return 0
    const expect = createHmac('sha256', secret()).update(`${m[1]}.${m[2]}`).digest('hex').slice(0, 32)
    const a = Buffer.from(m[3], 'utf8')
    const b = Buffer.from(expect, 'utf8')
    return a.length === b.length && timingSafeEqual(a, b) ? at : 0
  } catch {
    return 0
  }
}
