// Thin client for the Vercel backend (/api/*).
// Every call resolves — never throws. { ok:false, offline:true } means
// "no backend reachable". State calls fall back to on-device paths;
// AI classify has no fallback — the Scanner retries it until it answers.
// Mutations retry once on 503 (transient storage pressure).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function api(path, { method = 'GET', body, timeout = 15000, retry503 = false } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  const doFetch = async () => {
    const r = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    })
    // No backend here (plain `vite dev`, static preview, …): the dev server
    // answers API routes with the SPA's HTML fallback. A non-JSON response
    // therefore means "offline", not "server error" — callers fall back to
    // on-device paths instead of showing failures.
    const ct = r.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      return { ok: false, offline: true, http: r.status, error: 'backend unreachable' }
    }
    const data = await r.json().catch(() => ({}))
    return { http: r.status, ...data }
  }
  try {
    const first = await doFetch()
    // Retry once on 503 — unless the body already says offline (service-worker
    // synthetic response): retrying that just burns 700ms with no upside.
    if (first.http === 503 && retry503 && !first.offline) {
      clearTimeout(t)
      await sleep(700)
      return api(path, { method, body, timeout })
    }
    return first
  } catch {
    return { ok: false, offline: true, http: 0, error: 'backend unreachable' }
  } finally {
    clearTimeout(t)
  }
}

export const classifyRemote = (payload) =>
  api('/api/classify', { method: 'POST', body: payload, timeout: 45000, retry503: true })

export const createProfile = (payload) =>
  api('/api/profile', { method: 'POST', body: payload, retry503: true })

export const fetchProfile = (id) =>
  api(`/api/profile?id=${encodeURIComponent(id)}`)

export const disposeRemote = (payload) =>
  api('/api/dispose', { method: 'POST', body: payload, retry503: true })

export const fetchLeaderboard = (profileId) =>
  api(`/api/leaderboard${profileId ? `?profileId=${encodeURIComponent(profileId)}` : ''}`)

export const fetchChallenges = (profileId) =>
  api(`/api/challenges${profileId ? `?profileId=${encodeURIComponent(profileId)}` : ''}`)

export const challengeAction = (payload) =>
  api('/api/challenges', { method: 'POST', body: payload, retry503: true })
