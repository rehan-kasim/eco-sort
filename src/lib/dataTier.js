// Data-tier router.
//   STATE (profiles, disposals, challenges, ranks): exactly ONE cloud tier is
//   ever active — Firebase when configured, else /api. Never cascades (that
//   would split-brain stores). Unreachable → {offline:true} → on-device paths.
//   AI (classify): Gemini via /api ONLY — a single detector, retried by the
//   caller until it answers. There is no local fallback model.
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
  // Gemini via /api is the one and only detector. A single attempt per call —
  // the Scanner loops with backoff until it succeeds. On success, record the
  // Firebase scan entry too (when that tier is configured) so the +10 bonus
  // path keeps working there.
  const http = await httpClassify(payload).catch(() => null)
  if (!http) return OFFLINE()
  if (!http.ok) return http
  try {
    const f = await fb().catch(() => null)
    if (f) {
      const { profileId } = loadState()
      if (profileId && !String(profileId).startsWith('local_')) {
        const s = await timeout(f.fbRecordScan({ profileId, item: http.item.name, bin: http.item.bin }), 10000)
        if (s.ok) return { ...http, scan: { ...s.scan, at: Date.now() } }
      }
    }
  } catch { /* bonus unavailable — the result itself is still valid */ }
  return http
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
