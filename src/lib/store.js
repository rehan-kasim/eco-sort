// Local cache for the signed-in profile. Source of truth is the backend
// (/api/*, Upstash Redis on Vercel / JSON file locally); this mirrors it so
// the app stays usable offline. Fresh profiles start at zero — no demo data.
import { KG_PER_RECYCLABLE_ITEM, DAY_MS } from './scoring.js'
const KEY = 'ecosort:v1'

// Shared caps + prefixes (single source — every slice/prefix check uses these).
export const MAX_HISTORY = 20
export const MAX_OUTBOX = 20
export const LOCAL_PROFILE_PREFIX = 'local_'

// Unguessable ids with a Math.random fallback for insecure contexts
// (crypto.randomUUID requires https/localhost; LAN http testing needs fallback).
export const rid = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().replace(/-/g, '')
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`

export const freshState = () => ({
  onboarded: false,
  profileId: null,
  profile: { name: '', school: '', klass: '' },
  points: 0,
  streak: 0,
  scans: 0,
  correctDisposals: 0,
  co2Saved: 0,
  recyclableKg: 0,
  history: [],
  joined: [],
  challengeProgress: {},
  challengeBaselines: {},
  outbox: [],
  // Generic placeholder default: teachers MUST set their own pilot site code
  // on the Verify page. A realistic-looking shared default would collide
  // across schools and weaken site observability — never ship a live code.
  siteCode: 'SCHOOL-01',
  lastScan: null,
  lastActiveDay: null,
})

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshState()
    // Explicit allowlist pick (never blind-spread): localStorage is
    // attacker-influenced storage — unknown keys (incl. __proto__-style junk)
    // must not enter the state object, and arrays must stay arrays.
    const parsed = JSON.parse(raw) || {}
    const fresh = freshState()
    const pickArray = (v) => (Array.isArray(v) ? v : [])
    const merged = {
      ...fresh,
      onboarded: parsed.onboarded === true,
      profileId: typeof parsed.profileId === 'string' ? parsed.profileId : null,
      profile: { ...fresh.profile, ...(parsed.profile && typeof parsed.profile === 'object' ? parsed.profile : {}) },
      points: Number(parsed.points) || 0,
      streak: Number(parsed.streak) || 0,
      scans: Number(parsed.scans) || 0,
      correctDisposals: Number(parsed.correctDisposals) || 0,
      co2Saved: Number(parsed.co2Saved) || 0,
      recyclableKg: Number(parsed.recyclableKg) || 0,
      history: pickArray(parsed.history),
      joined: pickArray(parsed.joined),
      challengeProgress: parsed.challengeProgress && typeof parsed.challengeProgress === 'object' ? parsed.challengeProgress : {},
      challengeBaselines: parsed.challengeBaselines && typeof parsed.challengeBaselines === 'object' ? parsed.challengeBaselines : {},
      outbox: pickArray(parsed.outbox),
      siteCode: typeof parsed.siteCode === 'string' ? parsed.siteCode : fresh.siteCode,
      lastScan: parsed.lastScan && typeof parsed.lastScan === 'object' ? parsed.lastScan : null,
      lastActiveDay: typeof parsed.lastActiveDay === 'string' ? parsed.lastActiveDay : null,
      notice: typeof parsed.notice === 'string' ? parsed.notice : undefined,
    }
    if (merged.notice === undefined) delete merged.notice
    if (merged.history.length > MAX_HISTORY) merged.history = merged.history.slice(0, MAX_HISTORY)
    if (merged.outbox.length > MAX_OUTBOX) merged.outbox = merged.outbox.slice(-MAX_OUTBOX)
    return merged
  } catch {
    return freshState()
  }
}

export function saveState(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* private mode */
  }
  // Notify same-tab listeners (e.g. Navbar points) without polling.
  try {
    window.dispatchEvent(new CustomEvent('ecosort:update'))
  } catch {
    /* non-DOM env */
  }
}

// Sync the local mirror from a server profile + history response.
export function applyServerProfile(state, serverProfile, history = []) {
  return {
    ...state,
    profileId: serverProfile.id,
    profile: { name: serverProfile.name, school: serverProfile.school, klass: serverProfile.klass || '' },
    points: serverProfile.points || 0,
    streak: serverProfile.streak || 0,
    scans: serverProfile.scans || 0,
    correctDisposals: serverProfile.correctDisposals || 0,
    co2Saved: serverProfile.co2Saved || 0,
    recyclableKg: serverProfile.recyclableKg || 0,
    lastActiveDay: serverProfile.lastActiveDay || null,
    history: history.map((h) => ({ id: h.id, item: h.item, bin: h.bin, points: h.points, co2: h.co2 || 0, site: h.site || '', at: h.at, verified: h.verified })),
  }
}

// Offline fallback: record a disposal locally (used only when backend unreachable).
// Mirrors the server's UTC day-rollover streak so offline/online streaks agree.
// Entry shape matches the server's recent[] ({id,item,bin,points,co2,site,at,verified}).
export function addDisposal(state, { item, bin, points, co2, verified, site = '' }) {
  const entry = { id: `h${rid().slice(0, 12)}`, item, bin, points, co2: co2 || 0, site, at: Date.now(), verified: !!verified }
  const today = new Date().toISOString().slice(0, 10)
  let streak = state.streak || 0
  if (verified) {
    if (state.lastActiveDay !== today) {
      const yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10)
      streak = state.lastActiveDay === yesterday ? streak + 1 : 1
    }
  }
  return {
    ...state,
    points: state.points + points,
    scans: state.scans + 1,
    correctDisposals: state.correctDisposals + (verified ? 1 : 0),
    co2Saved: +((state.co2Saved || 0) + (verified ? co2 : 0)).toFixed(2),
    recyclableKg: +((state.recyclableKg || 0) + (verified && (bin === 'RECYCLABLE' || bin === 'E_WASTE') ? KG_PER_RECYCLABLE_ITEM : 0)).toFixed(2),
    history: [entry, ...state.history].slice(0, MAX_HISTORY),
    streak,
    lastActiveDay: verified ? today : state.lastActiveDay || null,
  }
}

export function levelFor(points) {
  if (points >= 4000) return { name: 'Planet Guardian', next: null }
  if (points >= 2000) return { name: 'Eco Champion', next: 4000 }
  if (points >= 800) return { name: 'Green Scout', next: 2000 }
  return { name: 'Seedling', next: 800 }
}

// ---- QR payloads ----
// Format: ECOSORT1:<BIN>:<SITE>  e.g. ECOSORT1:RECYCLABLE:GVH-BLOCKA
export function buildBinPayload(bin, site = 'GVH-BLOCKA') {
  const clean = String(site || 'SITE').toUpperCase().replace(/[^A-Z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 24) || 'SITE'
  return `ECOSORT1:${bin}:${clean}`
}
export function parseBinPayload(text) {
  const m = /^ECOSORT1:(WET|DRY|RECYCLABLE|E_WASTE):([A-Z0-9-]+)$/i.exec((text || '').trim())
  if (!m) return null
  return { bin: m[1].toUpperCase(), site: m[2].toUpperCase() }
}
