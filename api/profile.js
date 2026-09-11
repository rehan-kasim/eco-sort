import { blankBins, clientIp, handleOptions, loadDb, publicProfile, rateLimit, readJson, redisConfigured, sanitizeText, saveDb, send, uid, withLock } from './_db.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  let db
  try {
    db = await loadDb()
  } catch {
    return send(res, 503, { ok: false, error: 'storage unavailable, try again' })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://x')
    const id = url.searchParams.get('id')
    const p = id && db.profiles[id]
    if (!p) return send(res, 404, { ok: false, error: 'profile not found' })
    const history = (p.recent || []).slice(0, 20)
    return send(res, 200, { ok: true, profile: publicProfile(p), history })
  }

  if (req.method === 'POST') {
    const rl = await rateLimit(`profile:${clientIp(req)}`, 60, 3600)
    if (!rl.ok) {
      res.setHeader('Retry-After', String(rl.retryAfter))
      return send(res, 429, { ok: false, error: 'rate limited, try again later', retryAfter: rl.retryAfter })
    }
    const body = await readJson(req)
    if (body.__tooLarge) return send(res, 413, { ok: false, error: 'body too large' })
    // Return existing profile (login on a new device) — same envelope as GET.
    if (body.id && db.profiles[body.id]) {
      const p = db.profiles[body.id]
      return send(res, 200, { ok: true, profile: publicProfile(p), history: (p.recent || []).slice(0, 20) })
    }
    const name = sanitizeText(body.name, 40)
    const school = sanitizeText(body.school, 60)
    const klass = sanitizeText(body.klass, 20)
    if (!name || !school) return send(res, 400, { ok: false, error: 'name and school are required' })
    const id = uid('p')
    // Locked create: storage failure → 503 envelope (never a bare 500).
    let out
    try {
      out = await withLock('db-write', async () => {
        const fresh = await loadDb()
        fresh.profiles[id] = {
          id, name, school, klass, points: 0, streak: 0, scans: 0,
          correctDisposals: 0, co2Saved: 0, recyclableKg: 0,
          verifiedByBin: { WET: 0, DRY: 0, RECYCLABLE: 0, E_WASTE: 0 }, recent: [],
          seenQids: [], seenScans: [], dayCount: { day: null, n: 0 },
          createdAt: Date.now(), lastActiveDay: null,
        }
        const { store } = await saveDb(fresh)
        return { status: 201, body: { ok: true, store, profile: publicProfile(fresh.profiles[id]), history: [] } }
      })
    } catch {
      return send(res, 503, { ok: false, error: 'storage unavailable, try again' })
    }
    return send(res, out.status, out.body)
  }

  return send(res, 405, { ok: false, error: 'GET or POST only' })
}
