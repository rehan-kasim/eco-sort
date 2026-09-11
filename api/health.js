import { handleOptions, loadDb, redisConfigured, send } from './_db.js'

// Liveness probe for deploy checks, status pages and uptime monitors.
// No auth, no PII, no secrets — safe to hit publicly.
export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'GET only' })
  let store = 'memory'
  try {
    await loadDb()
    store = redisConfigured() ? 'upstash-redis' : 'local-file'
  } catch {
    return send(res, 200, { ok: false, service: 'ecosort-api', time: new Date().toISOString(), store: 'unavailable' })
  }
  return send(res, 200, { ok: true, service: 'ecosort-api', time: new Date().toISOString(), store })
}
