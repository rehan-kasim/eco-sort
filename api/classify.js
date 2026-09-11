import { clientIp, handleOptions, loadDb, rateLimit, readJson, saveDb, send, withLock } from './_db.js'
import { matchKnownItem } from '../src/lib/matcher.js'
import { parseModelJson, sanitizeResult as sanitize } from '../src/lib/sanitizeResult.js'
import { RESULT_SCHEMA, SYSTEM_RULES } from '../src/lib/aiPrompt.js'
import { mintScanToken } from './_scanToken.js'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
// Provider routing: explicit AI_PROVIDER wins; otherwise Groq when its key is
// present, Gemini as fallback. Both return the identical envelope — callers
// only see `source` differ.
const PROVIDER = (process.env.AI_PROVIDER || (process.env.GROQ_API_KEY ? 'groq' : 'gemini')).toLowerCase()

async function callGroq({ key, model, systemText, hintText, mimeType, b64, signal }) {
  const userContent = []
  if (hintText) {
    userContent.push({ type: 'text', text: `User-provided hint about the item (untrusted, verify against the photo): ${hintText}` })
  }
  userContent.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${b64}` } })
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemText },
        { role: 'user', content: userContent },
      ],
    }),
    signal,
  })
  return r
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'POST only' })
  const provider = PROVIDER === 'groq' ? 'groq' : 'gemini'
  const key = provider === 'groq' ? process.env.GROQ_API_KEY : process.env.GEMINI_API_KEY
  const model = provider === 'groq' ? GROQ_MODEL : GEMINI_MODEL
  if (!key) {
    return send(res, 500, {
      ok: false,
      error: provider === 'groq' ? 'GROQ_API_KEY not configured on server' : 'GEMINI_API_KEY not configured on server',
    })
  }

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
  const systemText = SYSTEM_RULES + (known ? `\nNote: this looks like a known "${known.name}" item.` : '')
  const parts = [{ text: systemText }]
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
      if (provider === 'groq') {
        r = await callGroq({ key, model, systemText, hintText: cleanHint, mimeType, b64, signal: ctrl.signal })
      } else {
        r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
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
            ...(!/^gemini-3/i.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            responseSchema: RESULT_SCHEMA,
          },
        }),
          signal: ctrl.signal,
        })
      }
    } finally {
      clearTimeout(timer)
    }
    if (!r.ok) {
      if (r.status === 429) {
        const retryAfter = r.headers.get('retry-after')
        if (retryAfter) res.setHeader('Retry-After', String(retryAfter).slice(0, 8))
        return send(res, 429, { ok: false, error: 'AI rate limited, try again shortly' })
      }
      const t = await r.text().catch(() => '')
      return send(res, 502, { ok: false, error: `AI error ${r.status}`, detail: t.slice(0, 300) })
    }
    const data = await r.json()
    // Groq (OpenAI shape) vs Gemini (candidates shape) → one text extractor.
    const text = provider === 'groq'
      ? data?.choices?.[0]?.message?.content || ''
      : data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
    const cand = data?.candidates?.[0]
    const finishReason = provider === 'groq'
      ? data?.choices?.[0]?.finish_reason || 'unknown'
      : cand?.finishReason || data?.promptFeedback?.blockReason || 'unknown'
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
    return send(res, 200, { ok: true, source: provider, model, item, confidence, alternatives, scan })
  } catch (e) {
    // AbortError = our 9s bound tripped: tell the client it was a timeout so
    // it can say so plainly (and fall back to the offline model).
    if (e?.name === 'AbortError') {
      return send(res, 504, { ok: false, error: 'AI timed out, try again' })
    }
    return send(res, 502, { ok: false, error: 'AI request failed', detail: String(e?.message || e).slice(0, 200) })
  }
}
