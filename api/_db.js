import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CHALLENGES } from '../src/data/gamification.js'
import { sanitizeText } from '../src/lib/text.js'

export { sanitizeText }

// Tiered storage so the SAME code runs everywhere:
//   1. Upstash Redis — when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN exist
//      (Vercel Dashboard → Storage → Marketplace → Upstash Redis → connect;
//       legacy Vercel KV vars KV_REST_API_URL / KV_REST_API_TOKEN also work)
//   2. JSON file  — local dev, persists in ./data/ecosort.json (gitignored)
//   3. Memory     — last-resort fallback (ephemeral, e.g. Vercel without storage)
const KV_KEY = 'ecosort:db:v1'
const FILE = path.join(process.cwd(), 'data', 'ecosort.json')
let mem = null
let redis = null
// Cached client + last failure time: a down Redis is retried, not
// remembered forever (serverless instances live a long time).
let redisClient = null
let redisFailedAt = 0
const REDIS_RETRY_MS = 60_000

export function redisConfigured() {
  return !!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
    !!(process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
}

export function emptyDb() {
  return { profiles: {}, progress: {}, completed: {}, baselines: {}, schoolSites: {}, counters: { disposals: 0, co2: 0, scans: 0 }, seq: 0 }
}

export function blankBins() {
  return { WET: 0, DRY: 0, RECYCLABLE: 0, E_WASTE: 0 }
}

// Public profile shape for ALL responses: strips internals (recent[] is sent
// separately as `history`; seenQids/seenScans never leave the server).
export function publicProfile(p) {
  if (!p) return null
  const { recent, seenQids, seenScans, ...rest } = p
  return { ...rest, verifiedByBin: rest.verifiedByBin || blankBins() }
}

// One-time upgrade: fold the legacy global `disposals` array into per-profile
// recent lists + counters, so reads stay O(profiles) instead of O(disposals).
function migrate(db) {
  // Shape coercion FIRST: a poisoned document (null top-levels from manual
  // edits, foreign writes, or old bugs) must degrade to empty shapes — never
  // throw on every load and brick the app permanently.
  for (const k of ['profiles', 'progress', 'completed', 'baselines', 'schoolSites']) {
    if (!db[k] || typeof db[k] !== 'object' || Array.isArray(db[k])) db[k] = {}
  }
  if (!db.counters || typeof db.counters !== 'object' || Array.isArray(db.counters)) {
    db.counters = emptyDb().counters
  }
  if (!db.counters) db.counters = { disposals: 0, co2: 0, scans: 0 }
  if (Array.isArray(db.disposals)) {
    for (const d of db.disposals) {
      if (d.scanOnly) {
        db.counters.scans += 1
        continue
      }
      const p = d.profileId && db.profiles[d.profileId]
      if (!p) continue
      p.recent = p.recent || []
      p.verifiedByBin = p.verifiedByBin || blankBins()
      p.recent.push({ id: d.id, item: d.item, bin: d.bin, points: d.points, co2: d.co2 || 0, site: d.site || '', verified: !!d.verified, at: d.at })
      if (d.verified && p.verifiedByBin[d.bin] !== undefined) p.verifiedByBin[d.bin] += 1
      db.counters.disposals += 1
      db.counters.co2 = Math.round((db.counters.co2 + (d.co2 || 0)) * 100) / 100
    }
    for (const p of Object.values(db.profiles)) p.recent = (p.recent || []).slice(-20).reverse()
    delete db.disposals
  }
  for (const p of Object.values(db.profiles)) {
    if (!p.verifiedByBin) p.verifiedByBin = blankBins()
    if (!p.recent) p.recent = []
    if (!p.seenQids) p.seenQids = []
    if (!p.seenScans) p.seenScans = []
    if (!p.dayCount) p.dayCount = { day: null, n: 0 }
    // Defensive trims: docs written by older builds, manual edits, or oversized
    // clients must converge back to bounded shapes on load.
    if (p.recent.length > 20) p.recent = p.recent.slice(0, 20)
    if (p.seenQids.length > 1000) p.seenQids = p.seenQids.slice(-1000)
    if (p.seenScans.length > 1000) p.seenScans = p.seenScans.slice(-1000)
    // Old documents may lack newer numeric/profile fields — default them so
    // arithmetic never sees undefined (which would poison sums to NaN).
    p.points ??= 0
    p.streak ??= 0
    p.scans ??= 0
    p.correctDisposals ??= 0
    p.co2Saved ??= 0
    p.recyclableKg ??= 0
    p.klass ??= ''
    p.createdAt ??= Date.now()
    if (p.lastActiveDay === undefined) p.lastActiveDay = null
    // Re-sanitize display names (older docs predate the filter).
    p.name = sanitizeText(p.name, 40) || 'Recycler'
    p.school = sanitizeText(p.school, 60) || 'School'
    p.klass = sanitizeText(p.klass, 20)
  }
  if (!db.baselines) db.baselines = {}
  if (!db.schoolSites) db.schoolSites = {}
  for (const [school, sites] of Object.entries(db.schoolSites)) {
    if (!Array.isArray(sites)) {
      delete db.schoolSites[school]
    } else if (sites.length > 10) {
      db.schoolSites[school] = sites.slice(-10)
    }
  }
  // Profiles get re-sanitized above; remap site keys identically or lookups
  // miss and leaderboards split one school in two. Merge on collision.
  for (const oldKey of Object.keys(db.schoolSites)) {
    const clean = sanitizeText(oldKey, 60) || 'School'
    if (clean !== oldKey) {
      const merged = [...(db.schoolSites[clean] || []), ...db.schoolSites[oldKey]].filter(
        (s, i, arr) => arr.indexOf(s) === i
      )
      db.schoolSites[clean] = merged.slice(-10)
      delete db.schoolSites[oldKey]
    }
  }
  // Deep-merge counters: a shallow spread would drop new counter keys on old DBs.
  db.counters = { ...emptyDb().counters, ...(db.counters || {}) }
  // Prune orphaned challenge keys (ids removed from the catalog).
  const valid = new Set(CHALLENGES.map((c) => c.id))
  for (const store of [db.progress, db.baselines, db.completed]) {
    if (!store) continue
    for (const k of Object.keys(store)) {
      if (!valid.has(k.slice(k.indexOf(':') + 1))) delete store[k]
    }
  }
  // Legacy progress rows predate join-baselines: snapshot NOW so past
  // disposals can't be replayed for future steps. Earned progress is kept.
  for (const k of Object.keys(db.progress || {})) {
    if (db.baselines[k] === undefined) {
      const pid = k.slice(0, k.indexOf(':'))
      db.baselines[k] = { ...(db.profiles[pid]?.verifiedByBin || blankBins()) }
    }
  }
}
async function tryRedis() {
  if (!redisConfigured()) return null
  if (redisClient) return redisClient
  if (Date.now() - redisFailedAt < REDIS_RETRY_MS) return null
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
    const { Redis } = await import('@upstash/redis')
    const client = new Redis({ url, token })
    await client.ping()
    redisClient = client
    return client
  } catch {
    redisClient = null
    redisFailedAt = Date.now()
    return null
  }
}

function parseStored(value) {
  if (value && typeof value === 'object') return value
  if (typeof value === 'string') {
    try {
      const p = JSON.parse(value)
      if (p && typeof p === 'object') return p
    } catch { /* fall through */ }
  }
  return null
}

export async function loadDb() {
  const r = await tryRedis()
  if (r) {
    // Redis configured: it MUST answer — serving an empty DB on read error
    // would let a later write wipe real data. Throw → handlers return 503.
    // A present-but-unparseable value (foreign key reuse) is also a hard
    // error for the same reason — never silently start over.
    const raw = await r.get(KV_KEY)
    if (raw == null) return emptyDb()
    const stored = parseStored(raw)
    if (!stored) throw new Error('storage corrupt')
    const merged = { ...emptyDb(), ...stored }
    migrate(merged)
    return merged
  }
  if (redisConfigured()) {
    // Configured but unreachable right now: fail loudly, never serve empty.
    throw new Error('storage unavailable')
  }
  let raw
  try {
    raw = await readFile(FILE, 'utf8')
  } catch (e) {
    if (e?.code === 'ENOENT') {
      if (!mem) mem = emptyDb()
      return mem
    }
    throw new Error('storage unavailable')
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Corrupt file: quarantine it (never overwrite in place) and fail loud —
    // serving empty here would let the next write destroy the evidence.
    try {
      await rename(FILE, `${FILE}.corrupt-${Date.now()}`)
    } catch { /* best effort */ }
    throw new Error('storage corrupt')
  }
  const merged = { ...emptyDb(), ...parsed }
  migrate(merged)
  return merged
}

export async function saveDb(db) {
  const r = await tryRedis()
  if (r) {
    await r.set(KV_KEY, db) // throws on failure → 503, no silent forked state
    return { store: 'upstash-redis' }
  }
  if (redisConfigured()) throw new Error('storage unavailable')
  try {
    await mkdir(path.dirname(FILE), { recursive: true })
    await writeFile(FILE, JSON.stringify(db, null, 2))
    return { store: 'local-file' }
  } catch {
    mem = db
    return { store: 'memory' }
  }
}

// In-memory per-key promise chain: serializes concurrent mutations on one
// instance (local dev + warm Lambdas). Cross-instance races remain possible at
// high concurrency — noted; human-paced QR scans make them negligible.
const locks = new Map()
export function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve()
  const task = prev.catch(() => {}).then(fn)
  const tracked = task.then(
    (v) => {
      if (locks.get(key) === tracked) locks.delete(key)
      return v
    },
    (e) => {
      if (locks.get(key) === tracked) locks.delete(key)
      throw e
    }
  )
  locks.set(key, tracked.catch(() => {}))
  return tracked
}

export function send(res, code, obj) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  // Permissive CORS is deliberate here, not an oversight: this API carries no
  // cookies/sessions — access is by unguessable capability IDs (128-bit
  // profile ids), so cross-origin reads gain an attacker nothing that direct
  // curl wouldn't. The wildcard keeps vercel-dev, previews on other hosts,
  // and file:// mobile wrappers working.
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.end(code === 204 ? '' : JSON.stringify(obj))
}

// Returns true when this was a CORS preflight (already answered).
export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    send(res, 204, {})
    return true
  }
  return false
}

export async function readJson(req, maxBytes = 1_000_000) {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  let size = 0
  for await (const c of req) {
    size += c.length
    if (size > maxBytes) return { __tooLarge: true }
    chunks.push(c)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function clientIp(req) {
  // X-Forwarded-For is client-spoofable (rotating it would defeat every rate
  // limit), so it is never trusted. On Vercel, x-real-ip is set by the edge;
  // elsewhere fall back to the socket address.
  const real = req.headers?.['x-real-ip']
  const ip = (Array.isArray(real) ? real[0] : String(real || '') || req.socket?.remoteAddress || 'unknown').trim()
  return ip.slice(0, 64) || 'unknown'
}

const memHits = new Map()

// Best-effort sliding-window limiter (Redis-backed on Vercel, memory locally).
// Returns { ok:true } or { ok:false, retryAfter }.
export async function rateLimit(key, limit, windowSec) {
  const now = Date.now()
  const r = await tryRedis()
  if (r) {
    try {
      const k = `rl:${key}`
      const n = await r.incr(k)
      if (n === 1) await r.expire(k, windowSec)
      if (n > limit) {
        const ttl = await r.ttl(k)
        return { ok: false, retryAfter: ttl > 0 ? ttl : windowSec }
      }
      return { ok: true }
    } catch {
      /* fall through to memory */
    }
  }
  const arr = (memHits.get(key) || []).filter((t) => now - t < windowSec * 1000)
  if (arr.length >= limit) return { ok: false, retryAfter: windowSec }
  arr.push(now)
  memHits.set(key, arr)
  // Lazy sweep: bound map growth on long-lived instances (local dev, warm Lambdas).
  if (memHits.size > 1000) {
    for (const [k, v] of memHits) {
      if (k === key) continue
      const live = v.filter((t) => now - t < windowSec * 1000)
      if (live.length === 0) memHits.delete(k)
      else memHits.set(k, live)
    }
  }
  return { ok: true }
}

export function uid(prefix) {
  // crypto.randomUUID: unguessable ids (no Math.random predictability).
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}
