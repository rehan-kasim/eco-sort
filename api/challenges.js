import { clientIp, handleOptions, loadDb, publicProfile, rateLimit, readJson, saveDb, send, withLock } from './_db.js'
import { CHALLENGES } from '../src/data/gamification.js'
import { binById } from '../src/data/bins.js'
import { haveSince, STEP_BINS } from '../src/lib/stepBins.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  let db
  try {
    db = await loadDb()
  } catch {
    return send(res, 503, { ok: false, error: 'storage unavailable, try again' })
  }
  const url = new URL(req.url, 'http://x')

  if (req.method === 'GET') {
    const profileId = url.searchParams.get('profileId')
    const progress = {}
    const joined = []
    const completedList = []
    // Live participant counts: distinct profiles with any progress per challenge.
    const joinsLive = {}
    for (const k of Object.keys(db.progress)) {
      const cid = k.slice(k.indexOf(':') + 1)
      joinsLive[cid] = (joinsLive[cid] || 0) + 1
    }
    const challenges = CHALLENGES.map((c) => ({ ...c, joined: joinsLive[c.id] || 0 }))
    for (const c of CHALLENGES) {
      const k = `${profileId}:${c.id}`
      if (db.progress[k] !== undefined || db.completed[k]) {
        joined.push(c.id)
        progress[c.id] = db.progress[k] || 0
        if (db.completed[k]) completedList.push(c.id)
      }
    }
    return send(res, 200, { ok: true, challenges, joined, progress, completed: completedList })
  }

  if (req.method === 'POST') {
    const rl = await rateLimit(`chall:${clientIp(req)}`, 120, 3600)
    if (!rl.ok) {
      res.setHeader('Retry-After', String(rl.retryAfter))
      return send(res, 429, { ok: false, error: 'rate limited, try again later', retryAfter: rl.retryAfter })
    }
    const body = await readJson(req)
    if (body.__tooLarge) return send(res, 413, { ok: false, error: 'body too large' })
    const { profileId, action, id } = body
    const challenge = CHALLENGES.find((c) => c.id === id)
    if (!challenge) return send(res, 404, { ok: false, error: 'challenge not found' })
    if (action !== 'join' && action !== 'step') return send(res, 400, { ok: false, error: 'action must be join|step' })

    // Serialized per profile: join/step races can't double-grant bonuses.
    // Serialized writes (single global lock shared with all mutating
    // endpoints): join/step races can't double-grant bonuses.
    let out
    try {
      out = await withLock('db-write', async () => {
        const db = await loadDb()
        const profile = db.profiles[profileId]
        if (!profile) return { status: 404, body: { ok: false, error: 'profile not found' } }
        const k = `${profileId}:${id}`

        if (action === 'join') {
          if (db.progress[k] === undefined && !db.completed[k]) {
            db.progress[k] = 0
            // Snapshot verified counts at join time: only POST-JOIN disposals earn steps.
            db.baselines[k] = { ...(profile.verifiedByBin || {}) }
          }
        } else {
          if (db.completed[k]) return { status: 200, body: { ok: true, progress: db.progress[k] || 0, completed: true, profile: publicProfile(profile) } }
          if (db.progress[k] === undefined) return { status: 403, body: { ok: false, error: 'join the challenge first' } }
          // Proof: post-join verified disposals must cover (progress+1).
          const bins = STEP_BINS[id]
          const have = haveSince(profile.verifiedByBin || {}, db.baselines[k] || {}, bins)
          const need = (db.progress[k] || 0) + 1
          if (have < need) {
            return {
              status: 403,
              body: {
                ok: false,
                error: `log a verified ${bins ? bins.map((b) => binById(b).label.toLowerCase()).join(' / ') : 'waste'} disposal first (${have}/${need})`,
                have,
                need,
              },
            }
          }
          const cur = Math.min(challenge.target, (db.progress[k] || 0) + 1)
          db.progress[k] = cur
          let bonus = 0
          if (cur >= challenge.target) {
            db.completed[k] = true
            bonus = challenge.points
            profile.points += bonus
          }
          const { store } = await saveDb(db)
          return { status: 200, body: { ok: true, store, progress: cur, completed: cur >= challenge.target, bonus, profile: publicProfile(profile), baseline: db.baselines[k] || {} } }
        }
        const { store } = await saveDb(db)
        return { status: 200, body: { ok: true, store, progress: db.progress[k] || 0, profile: publicProfile(profile), baseline: db.baselines[k] || {} } }
      })
    } catch {
      return send(res, 503, { ok: false, error: 'storage unavailable, try again' })
    }
    return send(res, out.status, out.body)
  }

  return send(res, 405, { ok: false, error: 'GET or POST only' })
}
