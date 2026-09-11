// Data-tier router.
//   STATE (profiles, disposals, challenges, ranks): exactly ONE cloud tier is
//   ever active — Firebase when configured, else /api. Never cascades (that
//   would split-brain stores). Unreachable → {offline:true} → on-device paths.
//   AI (classify): /api first (server keys: Groq, then Gemini), then Firebase
//   AI Logic, then the caller falls back to the on-device model. AI calls are
//   stateless, so ordering here cannot split-brain anything.
// Signatures match backend.js exactly.
import {
  challengeAction as httpChallengeAction,
  classifyRemote as httpClassify,
  createProfile as httpCreateProfile,
  disposeRemote as httpDispose,
  fetchChallenges as httpFetchChallenges,
  fetchLeaderboard as httpFetchLeaderboard,
  fetchProfile as httpFetchProfile,
} from './backend.js'
import { loadState } from './store.js'

const timeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])

const OFFLINE = () => ({ ok: false, offline: true, http: 0, error: 'backend unreachable' })

async function fb() {
  const mod = await import('./firebase.js')
  return mod.firebaseReady() ? mod : null
}

export async function classifyRemote(payload) {
  // /api first (Groq/Gemini server keys), Firebase AI second, on-device last
  // (the caller falls back when this resolves !ok). Each step fails fast when
  // its backend is absent, so plain `vite dev` stays snappy.
  let httpErr = null
  try {
    const http = await httpClassify(payload)
    if (http.ok) return http
    httpErr = http
  } catch {
    httpErr = null
  }
  const f = await fb().catch(() => null)
  if (f) {
    try {
      const r = await timeout(f.fbClassify(payload.image, { hint: payload.hint, fileName: payload.fileName, mimeType: payload.mimeType }), 60000)
      if (r.ok) {
        // Single-use scan record: the Firebase equivalent of HMAC scan tokens.
        // The dispose call consumes it transactionally for the +10 bonus.
        let scan = null
        try {
          const { profileId } = loadState()
          if (profileId && !String(profileId).startsWith('local_')) {
            const s = await timeout(f.fbRecordScan({ profileId, item: r.item.name, bin: r.item.bin }), 10000)
            if (s.ok) scan = { ...s.scan, at: Date.now() }
          }
        } catch { /* bonus unavailable — the result itself is still valid */ }
        return { ...r, scan }
      }
      // A real Firebase error (quota, model) beats a stale http error.
      return r.offline && httpErr ? httpErr : r
    } catch { /* fall through to http error */ }
  }
  return httpErr || OFFLINE()
}

export async function createProfile(payload) {
  const f = await fb().catch(() => null)
  if (!f) return httpCreateProfile(payload)
  try {
    return await timeout(f.fbCreateProfile(payload), 18000)
  } catch {
    return OFFLINE()
  }
}

export async function disposeRemote(payload) {
  const f = await fb().catch(() => null)
  if (!f) return httpDispose(payload)
  try {
    return await timeout(f.fbRecordDisposal(payload), 18000)
  } catch {
    return OFFLINE()
  }
}

export async function fetchLeaderboard(profileId) {
  const f = await fb().catch(() => null)
  if (!f) return httpFetchLeaderboard(profileId)
  try {
    return await timeout(f.fbLeaderboard(profileId), 18000)
  } catch {
    return OFFLINE()
  }
}

export async function fetchChallenges(profileId) {
  const f = await fb().catch(() => null)
  if (!f) return httpFetchChallenges(profileId)
  try {
    return await timeout(f.fbGetChallenges(profileId), 18000)
  } catch {
    return OFFLINE()
  }
}

export async function challengeAction(payload) {
  const f = await fb().catch(() => null)
  if (!f) return httpChallengeAction(payload)
  try {
    return await timeout(f.fbChallengeAction(payload), 18000)
  } catch {
    return OFFLINE()
  }
}

export async function fetchProfile(id) {
  const f = await fb().catch(() => null)
  if (!f) return httpFetchProfile(id)
  try {
    return await timeout(f.fbGetProfile(id), 18000)
  } catch {
    return OFFLINE()
  }
}
