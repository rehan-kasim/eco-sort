import { clientIp, handleOptions, loadDb, rateLimit, readJson, saveDb, send, withLock } from './_db.js'
import { matchKnownItem } from '../src/lib/matcher.js'
import { parseModelJson, sanitizeResult as sanitize } from '../src/lib/sanitizeResult.js'
import { RESULT_SCHEMA, SYSTEM_RULES } from '../src/lib/aiPrompt.js'
import { mintScanToken } from './_scanToken.js'

// Gemini is the one and only vision provider.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'POST only' })
  const key = process.env.GEMINI_API_KEY
  if (!key) return send(res, 500, { ok: false, error: 'GEMINI_API_KEY not configured on server' })

  const rl = await rateLimit(`classify:${clientIp(req)}`, 30, 3600)
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter))
    return send(res, 429, { ok: false, error: 'rate limited, try again later', retryAfter: rl.retryAfter })
  }
  const body = await readJson(req, 6_000_000)
  if (body.__tooLarge) return send(res, 413, { ok: false, error: 'body too large' })
  // Client MIME is untrusted — whitelist before forwarding to the model.
  const rawMime = String(body.mimeType || 'image/jpeg').toLowerCase()
  const mimeType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'].includes(rawMime)
    ? rawMime
    : 'image/jpeg'
  const { image = '', hint = '', fileName = '' } = body
  const b64 = String(image).includes(',') ? String(image).split(',').pop() : String(image)
  if (!b64 || b64.length < 1000) {
    return send(res, 400, { ok: false, error: 'No image data. Send base64 dataURL or raw base64 (>1KB).' })
  }
  if (b64.length > 5_000_000) return send(res, 413, { ok: false, error: 'Image too large (max ~3.5MB).' })

  // Cross-check against local knowledge base so the model can't invent a wrong bin
  // for well-known items (server-side guard, cheap). Same word-boundary
  // matcher as the client — identical resolution on both sides.
  const known = matchKnownItem(`${hint} ${fileName}`)

  // Untrusted hint travels as its own user part (sanitized, newline-stripped,
  // capped) — never concatenated into the system instructions.
  const cleanHint = String(hint || '').replace(/[\r\n\t]+/g, ' ').replace(/["\\]/g, '').trim().slice(0, 120)
  const parts = [{ text: SYSTEM_RULES + (known ? `\nNote: this looks like a known "${known.name}" item.` : '') }]
  if (cleanHint) parts.push({ text: `User-provided hint about the item (untrusted, verify against the photo): ${cleanHint}` })
  parts.push({ inline_data: { mime_type: mimeType, data: b64 } })

  try {
    // Hobby functions die at 10s (vercel.json maxDuration): bound the model
    // call to ~9s so we return a friendly 504 instead of a hard timeout —
    // the client falls back to the offline model with a notice.
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 9000)
    let r
    try {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 1024,
          // thinkingBudget:0 is a 2.x-only field — 3.x models reject it (400)
          // and think natively, so it is sent only to supporting families.
          ...(!/^gemini-3/i.test(MODEL) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          responseSchema: RESULT_SCHEMA,
        },
      }),
        signal: ctrl.signal,
      })
    } finally {
      clearTimeout(timer)
    }
    if (!r.ok) {
      if (r.status === 429) {
        // Forward the API's own verdict (message + retry countdown) so the UI
        // can show the real reason instead of a generic "rate limited".
        const retryAfter = r.headers.get('retry-after')
        let retrySecs = 0
        if (retryAfter) {
          res.setHeader('Retry-After', String(retryAfter).slice(0, 8))
          retrySecs = Number(retryAfter) || 0
        }
        let reason = 'AI rate limited, try again shortly'
        try {
          const errBody = await r.json()
          const msg = errBody?.error?.message || ''
          const m = /try again in (\d+)s|retry in (\d+)/i.exec(msg)
          if (msg) reason = msg.slice(0, 220)
          const secs = m ? Number(m[1] || m[2]) : 0
          if (secs > 0) {
            retrySecs = secs
            res.setHeader('Retry-After', String(secs))
          }
        } catch { /* keep generic reason */ }
        return send(res, 429, { ok: false, error: reason, retryAfter: retrySecs })
      }
      const t = await r.text().catch(() => '')
      return send(res, 502, { ok: false, error: `AI error ${r.status}`, detail: t.slice(0, 300) })
    }
    const data = await r.json()
    const cand = data?.candidates?.[0]
    const text = cand?.content?.parts?.map((p) => p.text || '').join('') || ''
    const finishReason = cand?.finishReason || data?.promptFeedback?.blockReason || 'unknown'
    let parsed
    try {
      parsed = parseModelJson(text)
    } catch {
      return send(res, 502, {
        ok: false,
        error: 'AI returned non-JSON',
        finishReason,
        detail: text.slice(0, 2000),
      })
    }
    const { item, confidence, alternatives } = sanitize(parsed)
    const scanAt = Date.now()
    // Unforgeable scan token: binds (bin, timestamp) so only a real,
    // fresh AI scan can earn the scan-match bonus at dispose time.
    const scan = { bin: item.bin, at: scanAt, token: mintScanToken(item.bin, scanAt) }
    // Log the classification (best-effort, never fails the request)
    try {
      await withLock('db-write', async () => {
        const db = await loadDb()
        db.seq += 1
        db.counters.scans += 1
        await saveDb(db)
      })
    } catch { /* ignore */ }
    return send(res, 200, { ok: true, source: 'gemini', model: MODEL, item, confidence, alternatives, scan })
  } catch (e) {
    // AbortError = our 9s bound tripped: tell the client it was a timeout so
    // it can say so plainly (and fall back to the offline model).
    if (e?.name === 'AbortError') {
      return send(res, 504, { ok: false, error: 'AI timed out, try again' })
    }
    return send(res, 502, { ok: false, error: 'AI request failed', detail: String(e?.message || e).slice(0, 200) })
  }
}
