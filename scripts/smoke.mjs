// EcoSort API smoke test — safe for CI and local runs.
// - Reads GEMINI_API_KEY from env (or local .env, gitignored, never printed).
// - Skips the live Gemini call when no key is configured.
// - Resets the local JSON DB before/after so runs are hermetic.
// Run: node scripts/smoke.mjs   (cwd = repo root)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import zlib from 'node:zlib'

const ROOT = process.cwd()
const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href)
const DB = path.join(ROOT, 'data', 'ecosort.json')

try {
  const envPath = path.join(ROOT, '.env')
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = /^\s*([A-Z_]+)=(.*)\s*$/.exec(line)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  }
} catch { /* no .env — env only */ }
process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

const FRESH = () => ({ profiles: {}, progress: {}, completed: {}, baselines: {}, counters: { disposals: 0, co2: 0, scans: 0 }, seq: 0 })

const profile = (await imp('/api/profile.js')).default
const dispose = (await imp('/api/dispose.js')).default
const board = (await imp('/api/leaderboard.js')).default
const chall = (await imp('/api/challenges.js')).default
const classify = (await imp('/api/classify.js')).default
const health = (await imp('/api/health.js')).default
const logApi = (await imp('/api/log.js')).default

function mockReq({ method = 'GET', url = '/', body } = {}) {
  return { method, url, body }
}
function mockRes() {
  return {
    statusCode: 200, headers: {}, body: '',
    setHeader(k, v) { this.headers[k] = v },
    end(s) { this.body = s },
    json() { return JSON.parse(this.body) },
  }
}
async function call(fn, opts) {
  const req = mockReq(opts)
  const res = mockRes()
  await fn(req, res)
  return { status: res.statusCode, ...res.json() }
}
let failures = 0
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name} ${extra}`)
  if (!cond) failures++
}

// 0b. health + client-log endpoints
const hh = await call(health, { method: 'GET', url: '/' })
ok('health.ok', hh.ok === true && hh.service === 'ecosort-api' && typeof hh.store === 'string', `store=${hh.store}`)
const ll = await call(logApi, { method: 'POST', body: { where: '/test', msg: 'smoke probe' } })
ok('log.ok', ll.ok === true, '')
const llBig = await call(logApi, { method: 'POST', body: { where: '/test', msg: 'x'.repeat(9000) } })
ok('log.size-cap', llBig.ok === false, `status=${llBig.status}`)

// 0c. cross-school QR use is refused once both schools have codes;
// control characters are stripped from display names.
const pa = await call(profile, { method: 'POST', body: { name: 'SchoolA Kid', school: 'School A' } })
const pb = await call(profile, { method: 'POST', body: { name: 'SchoolB Kid', school: 'School B' } })
await call(dispose, { method: 'POST', body: { profileId: pa.profile.id, item: 'Banana peel', bin: 'WET', qr: 'ECOSORT1:WET:SITEAAA' } })
await call(dispose, { method: 'POST', body: { profileId: pb.profile.id, item: 'Banana peel', bin: 'WET', qr: 'ECOSORT1:WET:SITEBBB' } })
const cross = await call(dispose, { method: 'POST', body: { profileId: pb.profile.id, item: 'Banana peel', bin: 'WET', qr: 'ECOSORT1:WET:SITEAAA' } })
ok('dispose.cross-school-refused', !cross.ok && /another school/i.test(cross.error || ''), `err=${cross.error}`)
const ownAgain = await call(dispose, { method: 'POST', body: { profileId: pb.profile.id, item: 'Banana peel', bin: 'WET', qr: 'ECOSORT1:WET:SITEBBB' } })
ok('dispose.own-site-ok', ownAgain.ok && ownAgain.correct === true, '')
const spoof = await call(profile, { method: 'POST', body: { name: 'A\u202EB\nX', school: 'S\u0000chool' } })
ok('profile.sanitize', spoof.ok && spoof.profile.name === 'A B X' && spoof.profile.school === 'S chool', `name=${JSON.stringify(spoof.profile?.name)} school=${JSON.stringify(spoof.profile?.school)}`)

// 0. legacy-shape migration must fold cleanly with no NaN.
writeFileSync(DB, JSON.stringify({
  profiles: { p_old: { id: 'p_old', name: 'Old', school: 'Old School', points: 10, scans: 1, correctDisposals: 1 } },
  disposals: [
    { id: 'd1', profileId: 'p_old', item: 'Plastic PET bottle', bin: 'RECYCLABLE', points: 20, co2: 0.08, verified: true, at: 1000 },
    { id: 'd2', profileId: 'p_old', item: 'Chips packet', bin: 'DRY', points: 10, co2: 0.01, verified: false, at: 2000 },
  ],
  progress: { 'p_old:ewaste-drive': 1 },
  completed: {},
}))
const mig = await call(profile, { method: 'GET', url: '/?id=p_old' })
ok('migrate.folds',
  mig.ok && mig.history.length === 2 && mig.history[0].id === 'd2' &&
  mig.profile.verifiedByBin?.RECYCLABLE === 1 && (mig.profile.streak ?? -1) === 0 &&
  mig.history[0].site === '' && mig.profile.lastActiveDay === null,
  `recent=${mig.history?.length}`)
const migStep = await call(chall, { method: 'POST', body: { profileId: 'p_old', action: 'step', id: 'ewaste-drive' } })
ok('migrate.baseline-backfilled', !migStep.ok && /verified/i.test(migStep.error || ''), `err=${migStep.error}`)

writeFileSync(DB, JSON.stringify(FRESH()))

// 1. create profile
const p = await call(profile, { method: 'POST', body: { name: 'Test User', school: 'Test School', klass: '9-A' } })
ok('profile.create', p.ok && p.profile?.id, `store=${p.store}`)
const pid = p.profile?.id

// 2. invalid QR rejected
const bad = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Plastic PET bottle', bin: 'RECYCLABLE', qr: 'NOT-A-QR' } })
ok('dispose.bad-qr', !bad.ok && /QR/i.test(bad.error || ''), `err=${bad.error}`)

// 3. wrong bin gets consolation + unverified
const wrong = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Plastic PET bottle', bin: 'WET', qr: 'ECOSORT1:WET:GVH-BLOCKA' } })
ok('dispose.wrong-bin', wrong.ok && wrong.correct === false && wrong.earned === 2, `earned=${wrong.earned}`)

// 4. correct bin earns knowledge-base rate
const good = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Plastic PET bottle', bin: 'RECYCLABLE', qr: 'ECOSORT1:RECYCLABLE:GVH-BLOCKA' } })
ok('dispose.correct', good.ok && good.correct === true && good.earned === 20 && good.profile.streak === 1, `earned=${good.earned}`)

// 5. leaderboard reflects reality only (student names pseudonymized)
const lb = await call(board, { method: 'GET', url: `/?profileId=${pid}` })
ok('leaderboard.live', lb.ok && lb.schools.length === 1 && lb.schools[0].points === good.profile.points && lb.students[0].name === 'Test U.' && lb.students[0].you === true, `pts=${lb.schools[0]?.points} name=${lb.students[0]?.name}`)

// 6. step without join refused; farmed points ignored; unknown capped
const j0 = await call(chall, { method: 'POST', body: { profileId: pid, action: 'step', id: 'ewaste-drive' } })
ok('challenge.no-join-refused', !j0.ok && /join/i.test(j0.error || ''), `err=${j0.error}`)
const farm = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Plastic PET bottle', bin: 'RECYCLABLE', qr: 'ECOSORT1:RECYCLABLE:GVH-BLOCKA', points: 9999, co2: 99 } })
ok('dispose.farmed-points-ignored', farm.ok && farm.earned === 20, `earned=${farm.earned}`)
const novel = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Mystery gadget thing', bin: 'E_WASTE', qr: 'ECOSORT1:E_WASTE:GVH-BLOCKA' } })
ok('dispose.unknown-capped', novel.ok && novel.correct === true && novel.earned === 5, `earned=${novel.earned}`)

// 6b. scan-match bonus needs a valid server-issued token (Newspaper pays 15)
process.env.SCAN_TOKEN_SECRET = 'test-only-secret'
const { mintScanToken } = await imp('/api/_scanToken.js')
const tok = mintScanToken('RECYCLABLE', Date.now())
const bonus = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Newspaper', bin: 'RECYCLABLE', qr: 'ECOSORT1:RECYCLABLE:GVH-BLOCKA', scanToken: tok } })
ok('dispose.scan-bonus', bonus.ok && bonus.scanBonus === 10 && bonus.earned === 25, `earned=${bonus.earned}`)
// forged self-attested scan fields WITHOUT a token earn nothing extra
const forged = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Newspaper', bin: 'RECYCLABLE', qr: 'ECOSORT1:RECYCLABLE:GVH-BLOCKA', scanBin: 'RECYCLABLE', scanAt: Date.now() } })
ok('dispose.forged-scan-no-bonus', forged.ok && (forged.scanBonus || 0) === 0 && forged.earned === 15, `earned=${forged.earned}`)
// stale + future tokens are rejected
const staleTok = mintScanToken('RECYCLABLE', Date.now() - 3600000)
const stale = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Newspaper', bin: 'RECYCLABLE', qr: 'ECOSORT1:RECYCLABLE:GVH-BLOCKA', scanToken: staleTok } })
ok('dispose.stale-scan-no-bonus', stale.ok && (stale.scanBonus || 0) === 0 && stale.earned === 15, `earned=${stale.earned}`)
const futureTok = mintScanToken('RECYCLABLE', Date.now() + 3600000)
const future = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Newspaper', bin: 'RECYCLABLE', qr: 'ECOSORT1:RECYCLABLE:GVH-BLOCKA', scanToken: futureTok } })
ok('dispose.future-scan-no-bonus', future.ok && (future.scanBonus || 0) === 0 && future.earned === 15, `earned=${future.earned}`)
// replaying the same token pays the base rate but no second bonus
const replay = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Newspaper', bin: 'RECYCLABLE', qr: 'ECOSORT1:RECYCLABLE:GVH-BLOCKA', scanToken: tok } })
ok('dispose.token-replay-no-bonus', replay.ok && (replay.scanBonus || 0) === 0 && replay.earned === 15, `earned=${replay.earned}`)
// token bound to another bin does not transfer
const otherTok = mintScanToken('WET', Date.now())
const other = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Newspaper', bin: 'RECYCLABLE', qr: 'ECOSORT1:RECYCLABLE:GVH-BLOCKA', scanToken: otherTok } })
ok('dispose.token-bin-mismatch', other.ok && (other.scanBonus || 0) === 0 && other.earned === 15, `earned=${other.earned}`)

// 6b3b. queue ids are idempotent: same qid twice awards once
const qid = `q_${Date.now().toString(36)}_abc123`
const q1 = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Glass jar', bin: 'RECYCLABLE', qr: 'ECOSORT1:RECYCLABLE:GVH-BLOCKA', qid } })
const q2 = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Glass jar', bin: 'RECYCLABLE', qr: 'ECOSORT1:RECYCLABLE:GVH-BLOCKA', qid } })
ok('dispose.qid-idempotent', q1.ok && q1.earned === 15 && q2.ok && q2.duplicate === true && q2.earned === 0, `first=${q1.earned} dup=${q2.duplicate}`)

// 6c. pre-join disposals don't count; post-join proof completes the challenge
const pre = await call(dispose, { method: 'POST', body: { profileId: pid, item: 'Banana peel', bin: 'WET', qr: 'ECOSORT1:WET:GVH-BLOCKA' } })
ok('dispose.wet', pre.ok && pre.earned === 10, `earned=${pre.earned}`)
await call(chall, { method: 'POST', body: { profileId: pid, action: 'join', id: 'compost-champions' } })
const prestep = await call(chall, { method: 'POST', body: { profileId: pid, action: 'step', id: 'compost-champions' } })
ok('challenge.prejoin-ignored', !prestep.ok && /verified/i.test(prestep.error || ''), `err=${prestep.error}`)
const j = await call(chall, { method: 'POST', body: { profileId: pid, action: 'join', id: 'ewaste-drive' } })
ok('challenge.join', j.ok && j.progress === 0)
for (let i = 0; i < 3; i++) {
  await call(dispose, { method: 'POST', body: { profileId: pid, item: 'AA battery', bin: 'E_WASTE', qr: 'ECOSORT1:E_WASTE:GVH-BLOCKA' } })
}
let last = null
for (let i = 0; i < 3; i++) last = await call(chall, { method: 'POST', body: { profileId: pid, action: 'step', id: 'ewaste-drive' } })
ok('challenge.complete', last.ok && last.completed === true && last.bonus === 300, `bonus=${last.bonus}`)
const g = await call(chall, { method: 'GET', url: `/?profileId=${pid}` })
ok('challenge.joins-live', g.ok && g.challenges.find((c) => c.id === 'ewaste-drive')?.joined === 1)

// 7. Gemini vision end-to-end (skipped without a key) — helpers below.
function crcTable() {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c }
  return t
}
const T = crcTable()
function crc(buf) {
  let c = -1
  for (const b of buf) c = T[(c ^ b) & 255] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(td))
  return Buffer.concat([len, td, cc])
}
function testPng() {
  const w = 256, h = 256, rows = []
  let s = 123456789
  const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(1 + w * 3)
    for (let x = 0; x < w; x++) {
      const inBottle = x > 100 && x < 156 && y > 40 && y < 220
      const inCap = x > 112 && x < 144 && y > 20 && y < 44
      const n = rnd() * 24
      if (inCap) { row[1 + x * 3] = 200 + n; row[1 + x * 3 + 1] = 30 + n; row[1 + x * 3 + 2] = 40 + n }
      else if (inBottle) { row[1 + x * 3] = 30 + n; row[1 + x * 3 + 1] = 140 + n; row[1 + x * 3 + 2] = 235 + n }
      else { row[1 + x * 3] = 238 + n; row[1 + x * 3 + 1] = 240 + n; row[1 + x * 3 + 2] = 242 + n }
    }
    rows.push(row)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))])
}

if ((!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) || process.env.SKIP_GEMINI) {
  console.log('SKIP ai.classify (no API key or SKIP_GEMINI=1)')
} else {
  const pngB64 = testPng().toString('base64')
  const cl = await call(classify, { method: 'POST', body: { image: 'data:image/png;base64,' + pngB64, mimeType: 'image/png', hint: 'plastic bottle', fileName: 'bottle.png' } })
  if (!cl.ok && /429|rate|quota/i.test(`${cl.error || ''} ${JSON.stringify(cl.detail || '')}`)) {
    console.log('SKIP ai.classify (API quota-limited right now — app falls back to offline model)')
  } else {
    ok('ai.classify', cl.ok && ['groq', 'gemini'].includes(cl.source) && ['WET', 'DRY', 'RECYCLABLE', 'E_WASTE'].includes(cl.item?.bin), `source=${cl.source} model=${cl.model || '?'} item=${cl.item?.name} bin=${cl.item?.bin}`)
  }
}

writeFileSync(DB, JSON.stringify(FRESH()))
if (failures > 0) {
  console.log(`SMOKE_FAIL count=${failures}`)
  process.exitCode = 1
} else {
  console.log('SMOKE_OK')
}
