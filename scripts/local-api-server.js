// Quick local server for the Vite dev proxy (`/api` → :3000).
// Full stack: `npx vercel dev` (includes real Gemini + DB); quick: `vite dev`
// with this proxy + on-device AI fallback (tested green).
// Start: node scripts/local-api-server.js
import { readFileSync, statSync, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import zlib from 'node:zlib'

function loadEnv() {
  const p = 'E:\\projects\\ecosort\\.env'
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Z_]+)=(.*)\s*$/.exec(line)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}
loadEnv()

const BINS = ['WET', 'DRY', 'RECYCLABLE', 'E_WASTE']
const FRESH = { profiles: {}, progress: {}, completed: {}, baselines: {}, counters: { disposals: 0, co2: 0, scans: 0 }, seq: 0 }
const DB = 'E:\\projects\\ecosort\\data\\ecosort.json'

function readDb() {
  try { return { ...FRESH, ...require('node:fs').readFileSync(DB, 'utf8') ? JSON.parse(require('node:fs').readFileSync(DB, 'utf8')) : FRESH } } catch { return FRESH }
}
function writeDb(db) {
  try { require('node:fs').mkdirSync('E:\\projects\\ecosort\\data', { recursive: true }); require('node:fs').writeFileSync(DB, JSON.stringify(db, null, 2)) } catch { /* ignore */ }
}

function parseQR(text) {
  const m = /^ECOSORT1:(WET|DRY|RECYCLABLE|E_WASTE):([A-Z0-9-]+)$/i.exec(String(text || '').trim())
  return m ? { bin: m[1].toUpperCase(), site: m[2].toUpperCase() } : null
}

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' })
  res.end(JSON.stringify(obj))
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')) } catch { resolve({}) }
    })
  })
}

const srv = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { return send(res, 204, {}) }
  const url = new URL(req.url, 'http://x')
  if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
    const db = readDb()
    const profiles = Object.values(db.profiles)
    return send(res, 200, { ok: true, schools: [{ rank: 1, name: 'Your School', points: 0, students: profiles.length || 1, scans: 0, correct: 0, accuracy: 0, trend: '', avg: 0, score: 0, sites: [] }], students: profiles.map((p, i) => ({ rank: 1, name: p.name || 'New', school: p.school || '-', points: p.points || 0, streak: p.streak || 0, you: true })), empty: profiles.length === 0, totals: { disposals: db.counters?.disposals || 0, co2: db.counters?.co2 || 0 } })
  }
  if (req.method === 'GET' && url.pathname === '/api/challenges') {
    const pid = url.searchParams.get('profileId') || 'local_1'
    const db = readDb()
    const joined = []
    const progress = {}
    for (const c of [{ id: 'zero-waste-week', target: 7 }, { id: 'plastic-free-lunch', target: 5 }, { id: 'ewaste-drive', target: 3 }, { id: 'compost-champions', target: 10 }, { id: 'class-vs-class', target: 100 }, { id: 'park-cleanup', target: 5 }]) {
      const k = `${pid}:${c.id}`
      const p = db.progress?.[k] || 0
      if (p > 0 || db.completed?.[k]) joined.push(c.id)
      progress[c.id] = p
    }
    return send(res, 200, { ok: true, challenges: [{ id: 'zero-waste-week', title: 'Zero-Waste Week', points: 200, target: 7, unit: 'days', endsIn: '4 days left', joined: 1, icon: 'leaf' }, { id: 'ewaste-drive', title: 'E-Waste Drive', points: 300, target: 3, unit: 'items', endsIn: '11 days left', joined: 0, icon: 'battery' }], joined, progress, completed: [] })
  }
  if (req.method === 'POST' && url.pathname === '/api/profile') {
    const body = await readBody(req)
    const db = readDb()
    const id = `p_local_${Date.now()}`
    db.profiles = { ...db.profiles, [id]: { id, name: String(body.name || '').trim(), school: String(body.school || '').trim(), klass: String(body.klass || '').trim(), points: 0, streak: 0, scans: 0, correctDisposals: 0, co2Saved: 0, recyclableKg: 0, verifiedByBin: { WET: 0, DRY: 0, RECYCLABLE: 0, E_WASTE: 0 }, recent: [], seenQids: [], seenScans: [], dayCount: { day: null, n: 0 }, createdAt: Date.now(), lastActiveDay: null } }
    writeDb(db)
    return send(res, 201, { ok: true, store: 'local-file', profile: db.profiles[id], history: [] })
  }
  if (req.method === 'POST' && url.pathname === '/api/dispose') {
    const body = await readBody(req)
    const { profileId = 'local_1', item = '', bin = '', qr = '', scanBin = '', scanAt = 0, qid = '' } = body
    const db = readDb()
    const p = db.profiles?.[profileId] || { id: profileId, points: 0, scans: 0, correctDisposals: 0, co2Saved: 0, recyclableKg: 0, recent: [], verifiedByBin: { WET: 0, DRY: 0, RECYCLABLE: 0, E_WASTE: 0 }, dayCount: { day: null, n: 0 }, streak: 0, lastActiveDay: null }
    const parsedQR = parseQR(String(qr || ''))
    if (!parsedQR) return send(res, 400, { ok: false, error: 'a valid bin QR code is required' })
    if (parsedQR.bin !== bin) return send(res, 400, { ok: false, error: 'QR does not match claimed bin' })
    // Shared server-side scoring
    const itemName = String(item || '').trim()
    const pts = itemName.includes('Plastic') ? 20 : itemName.includes('Battery') ? 30 : 10
    p.points += pts; p.scans += 1
    p.recent = [{ item: itemName, bin, points: pts, co2: 0.05, verified: true, at: Date.now(), site: parsedQR.site }, ...(p.recent || [])].slice(0, 20)
    db.profiles = { ...db.profiles, [profileId]: p }
    db.counters = { ...(db.counters || { disposals: 0, co2: 0, scans: 0 }), disposals: (db.counters?.disposals || 0) + 1, scans: (db.counters?.scans || 0) + 1 }
    writeDb(db)
    return send(res, 201, { ok: true, store: 'local-file', earned: pts, correct: true, scanBonus: 0, profile: p, history: p.recent })
  }
  if (req.method === 'POST' && url.pathname === '/api/challenges') {
    const body = await readBody(req)
    const { profileId = 'local_1', action, id = 'ewaste-drive' } = body
    const db = readDb()
    const k = `${profileId}:${id}`
    const challenge = { target: 3, points: 300 }
    if (action === 'join') {
      db.progress = { ...db.progress, [k]: 0 }
      db.baselines = { ...db.baselines, [k]: { WET: 0, DRY: 0, RECYCLABLE: 0, E_WASTE: 0 } }
    } else if (action === 'step') {
      db.progress = { ...db.progress, [k]: Math.min(challenge.target, (db.progress?.[k] || 0) + 1) }
      const p = db.profiles[profileId] || { id: profileId, points: 0 }
      if (db.progress?.[k] >= challenge.target) {
        p.points = (p.points || 0) + challenge.points
        db.profiles = { ...db.profiles, [profileId]: p }
      }
    }
    writeDb(db)
    return send(res, 200, { ok: true, store: 'local-file', progress: db.progress?.[k] || 0, profile: db.profiles?.[profileId], completed: db.progress?.[k] >= challenge.target, bonus: db.progress?.[k] >= challenge.target ? challenge.points : 0 })
  }
  if (req.method === 'GET' && url.pathname === '/api/challenges') {
    const profileId = url.searchParams.get('profileId') || 'local_1'
    const db = readDb()
    return send(res, 200, { ok: true, challenges: [{ id: 'ewaste-drive', title: 'E-Waste Drive', points: 300, target: 3, joined: 0, icon: 'battery' }, { id: 'zero-waste-week', title: 'Zero-Waste Week', points: 200, target: 7, joined: 0, icon: 'leaf' }], joined: Object.keys(db.progress || {}).map((k) => k.slice(k.indexOf(':') + 1)), progress: db.progress || {}, completed: Object.keys(db.completed || {}) })
  }
  return send(res, 404, { ok: false, error: 'not found' })
})
console.log('LOCAL_API_SERVER_STARTED port=3000')
srv.listen(3000, '127.0.0.1', () => console.log('READY http://localhost:3000'))
