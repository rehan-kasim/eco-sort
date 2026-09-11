import { clientIp, handleOptions, loadDb, publicProfile, rateLimit, readJson, redisConfigured, saveDb, send, uid, withLock } from './_db.js'
import { parseBinPayload } from '../src/lib/store.js'
import { DAILY_DISPOSAL_LIMIT, DAY_MS, KG_PER_RECYCLABLE_ITEM, SCAN_MATCH_BONUS, scoreDisposal } from '../src/lib/scoring.js'
import { checkScanToken } from './_scanToken.js'
import { BIN_IDS } from '../src/data/bins.js'

const BINS = BIN_IDS

// Records a QR-verified disposal. A valid bin QR is MANDATORY — omitting it
// is rejected, so disposals cannot be logged without scanning a physical bin.
export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'POST only' })
  const rl = await rateLimit(`dispose:${clientIp(req)}`, 120, 3600)
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter))
    return send(res, 429, { ok: false, error: 'rate limited, try again later', retryAfter: rl.retryAfter })
  }
  const body = await readJson(req)
  if (body.__tooLarge) return send(res, 413, { ok: false, error: 'body too large' })
  const { profileId, item = '', bin = '', qr = '', scanToken = '', qid = '' } = body
  if (!BINS.includes(bin)) return send(res, 400, { ok: false, error: 'unknown bin' })

  // Queue ids must be parseable `q_<time36>_<rand>` and younger than 30 days;
  // anything else is ignored (processed without dedupe) rather than trusted.
  const cleanQid = (() => {
    const m = /^q_([0-9a-z]+)_([0-9a-z]+)$/i.exec(String(qid || ''))
    if (!m) return ''
    const t = parseInt(m[1], 36)
    if (!Number.isFinite(t) || t <= 0 || t > Date.now() + 60000) return ''
    if (Date.now() - t > 30 * DAY_MS) return ''
    return String(qid)
  })()

  const parsed = parseBinPayload(String(qr || ''))
  if (!parsed) return send(res, 400, { ok: false, error: 'a valid bin QR code is required' })
  if (parsed.bin !== bin) return send(res, 400, { ok: false, error: 'QR does not match claimed bin' })
  // NOTE: the site segment is intentionally NOT allow-listed. Schools run
  // multiple blocks with different codes and there is no teacher-auth role to
  // manage a registry — a hard reject would break multi-block pilots. Instead
  // every seen (school, site) pair is recorded and exposed on the leaderboard
  // so teachers can spot unknown codes and rotate the site code in the app.

  // Serialized writes (single global lock): every load-modify-save cycle in
  // every endpoint funnels through one in-instance mutex, so concurrent
  // mutations can't interleave and last-writer-wins on the same instance.
  // (Cross-instance races remain possible at high concurrency — noted.)
  // Storage errors → 503.
  let out
  try {
    out = await withLock('db-write', async () => {
      const db = await loadDb()
      const profile = db.profiles[profileId]
      if (!profile) return { status: 404, body: { ok: false, error: 'profile not found' } }
      profile.seenQids = profile.seenQids || []

      // Cross-school QR use: reject a code registered to ANOTHER school once
      // your own school has established codes. Brand-new schools (no codes yet)
      // and new blocks (code unseen anywhere) always pass — multi-block pilots
      // keep working, while typed-in foreign codes are refused.
      const ownSites = (db.schoolSites || {})[profile.school] || []
      if (ownSites.length > 0 && !ownSites.includes(parsed.site)) {
        const foreign = Object.entries(db.schoolSites || {}).some(
          ([sch, codes]) => sch !== profile.school && Array.isArray(codes) && codes.includes(parsed.site)
        )
        if (foreign) {
          return { status: 400, body: { ok: false, error: 'this bin code belongs to another school — use your own school bins' } }
        }
      }

      // Per-profile daily cap: static printed QRs can't prove physical presence,
      // so volume is the backstop — 30 verified-or-not disposals/day is far above
      // genuine use and caps couch-farming (IP limits can't: schools share NAT).
      const today = new Date().toISOString().slice(0, 10)
      if (!profile.dayCount || profile.dayCount.day !== today) {
        profile.dayCount = { day: today, n: 0 }
      }
      if (profile.dayCount.n >= DAILY_DISPOSAL_LIMIT) {
        return { status: 429, body: { ok: false, error: `daily disposal limit reached (${DAILY_DISPOSAL_LIMIT}/day), come back tomorrow` } }
      }

      // Idempotent retry: a queued offline disposal flushed twice (two tabs,
      // retry after timeout) must not award twice.
      if (cleanQid && profile.seenQids.includes(cleanQid)) {
        const store = redisConfigured() ? 'upstash-redis' : 'local-file'
        return { status: 200, body: { ok: true, store, earned: 0, correct: true, scanBonus: 0, duplicate: true, profile: publicProfile(profile), history: profile.recent || [] } }
      }

      // Points and CO2 come from the shared server-side table — client values ignored.
      // Scan-match bonus needs a VALID, FRESH, UNUSED server-issued token:
      // self-attested scanBin/scanAt are not accepted (forgeable).
      const scored = scoreDisposal(item, bin)
      const correct = scored.correct
      profile.seenScans = profile.seenScans || []
      let scanBonus = 0
      if (correct && scanToken && checkScanToken(scanToken, bin) && !profile.seenScans.includes(String(scanToken))) {
        scanBonus = SCAN_MATCH_BONUS
        profile.seenScans = [...profile.seenScans, String(scanToken)].slice(-1000)
      }
      const earned = scored.earned + scanBonus
      const co2 = scored.co2

      const entry = {
        id: uid('d'), item: String(item).slice(0, 80), bin,
        points: earned, co2, site: parsed.site,
        verified: correct, at: Date.now(),
      }
      if (cleanQid) profile.seenQids = [...profile.seenQids, cleanQid].slice(-1000)
      // Per-profile bounded storage + global counters: reads stay O(profiles),
      // the document stops growing with every disposal.
      profile.recent = [entry, ...(profile.recent || [])].slice(0, 20)
      profile.verifiedByBin = profile.verifiedByBin || { WET: 0, DRY: 0, RECYCLABLE: 0, E_WASTE: 0 }

      profile.points += earned
      profile.scans += 1
      profile.dayCount.n += 1
      // Site observability: which bin codes each school actually sees.
      const sites = (db.schoolSites[profile.school] = db.schoolSites[profile.school] || [])
      if (!sites.includes(parsed.site)) {
        sites.push(parsed.site)
        db.schoolSites[profile.school] = sites.slice(-10)
      }
      if (correct) {
        profile.correctDisposals += 1
        profile.co2Saved = Math.round((profile.co2Saved + entry.co2) * 100) / 100
        profile.verifiedByBin[bin] = (profile.verifiedByBin[bin] || 0) + 1
        if (bin === 'RECYCLABLE' || bin === 'E_WASTE') {
          profile.recyclableKg = Math.round((profile.recyclableKg + KG_PER_RECYCLABLE_ITEM) * 100) / 100
        }
      }
      db.counters.disposals += 1
      db.counters.co2 = Math.round((db.counters.co2 + entry.co2) * 100) / 100
      // Streaks reward CORRECT segregation only — wrong bins never extend it.
      if (correct) {
        const today = new Date().toISOString().slice(0, 10)
        if (profile.lastActiveDay !== today) {
          const y = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10)
          profile.streak = profile.lastActiveDay === y ? profile.streak + 1 : 1
          profile.lastActiveDay = today
        }
      }

      const { store } = await saveDb(db)
      return { status: 201, body: { ok: true, store, earned, correct, scanBonus, profile: publicProfile(profile), history: profile.recent } }
    })
  } catch {
    return send(res, 503, { ok: false, error: 'storage unavailable, try again' })
  }
  return send(res, out.status, out.body)
}
