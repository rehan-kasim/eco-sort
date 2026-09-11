import { clientIp, handleOptions, rateLimit, readJson, send } from './_db.js'

// Minimal client-error sink: the frontend beacons window.onerror here so
// crashes land in Vercel function logs. Message-only (1KB cap, rate-limited),
// never trust or echo the content anywhere user-visible.
export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'POST only' })
  const rl = await rateLimit(`log:${clientIp(req)}`, 60, 3600)
  if (!rl.ok) return send(res, 429, { ok: false, error: 'rate limited' })
  const body = await readJson(req, 4096)
  if (body.__tooLarge) return send(res, 413, { ok: false, error: 'body too large' })
  // readJson's byte cap only applies to streamed bodies (Vercel pre-parses
  // JSON first) — enforce the logical size after parsing, deterministically.
  if (JSON.stringify(body).length > 4096) return send(res, 413, { ok: false, error: 'body too large' })
  // Strip ALL control characters (not just newlines): ANSI escapes would
  // otherwise reach terminal-based log viewers (Vercel) as live sequences.
  const strip = (s) => String(s || '').replace(/[\u0000-\u001F\u007F]+/g, ' ')
  const msg = strip(body.msg).slice(0, 500)
  const where = strip(body.where).slice(0, 120)
  if (msg) console.error(`[client] ${where} :: ${msg}`)
  return send(res, 200, { ok: true })
}
