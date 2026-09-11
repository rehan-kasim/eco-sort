import { clientIp, handleOptions, loadDb, rateLimit, send } from './_db.js'
import { pseudonym as displayName } from '../src/lib/text.js'

// Live ranks computed ONLY from real recorded disposals + profiles.
// Schools rank by AVERAGE points per student (accuracy-weighted), so a 2000-
// student school can't coast past a brilliant 200-student one on raw totals.
export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'GET only' })
  const rl = await rateLimit(`lb:${clientIp(req)}`, 120, 60)
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter))
    return send(res, 429, { ok: false, error: 'rate limited, try again later', retryAfter: rl.retryAfter })
  }
  let db
  try {
    db = await loadDb()
  } catch {
    return send(res, 503, { ok: false, error: 'storage unavailable, try again' })
  }
  const url = new URL(req.url, 'http://x')
  const viewerId = url.searchParams.get('profileId')
  const profiles = Object.values(db.profiles)

  const bySchool = {}
  for (const p of profiles) {
    const s = bySchool[p.school] || { name: p.school, points: 0, students: 0, scans: 0, correct: 0 }
    s.points += p.points
    s.students += 1
    s.scans += p.scans
    s.correct += p.correctDisposals
    bySchool[p.school] = s
  }
  // School sites are MASKED here: the raw codes would defeat QR secrecy
  // (anyone could harvest every school's code from this public endpoint).
  const maskSite = (s) => {
    const t = String(s || '')
    return t.length <= 4 ? '••••' : `${t.slice(0, 3)}••••`
  }
  const schools = Object.values(bySchool)
    .map((s) => {
      const accuracy = s.scans ? Math.round((s.correct / s.scans) * 100) : 0
      const avg = Math.round((s.points / Math.max(1, s.students)) * 10) / 10
      // Ranking score: per-student average scaled by accuracy (50-100% → 0.5-1x).
      const score = Math.round(avg * (0.5 + accuracy / 200) * 10) / 10
      return { ...s, accuracy, avg, score, sites: (db.schoolSites?.[s.name] || []).map(maskSite) }
    })
    .sort((a, b) => b.score - a.score || b.accuracy - a.accuracy)
    .map((s, i) => ({ rank: i + 1, ...s }))

  // Students are PSEUDONYMIZED (first name + last initial): a public,
  // unauthenticated board must not publish minors' full names. The viewer's
  // own row is flagged via ?profileId= so the client can highlight it without
  // comparing (already-anonymized) names.
  const students = [...profiles]
    .sort((a, b) => b.points - a.points)
    .slice(0, 20)
    .map((p, i) => ({
      rank: i + 1,
      name: displayName(p.name),
      school: p.school,
      points: p.points,
      streak: p.streak,
      you: !!viewerId && p.id === viewerId,
    }))

  return send(res, 200, {
    ok: true,
    schools,
    students,
    empty: profiles.length === 0,
    totals: {
      disposals: db.counters?.disposals || 0,
      co2: Math.round((db.counters?.co2 || 0) * 100) / 100,
    },
  })
}
