// Single source of truth for disposal scoring, shared by the server
// (api/dispose.js), the AI preview (api/classify.js) and the offline fallback
// (Verify.jsx). Item points live in the knowledge base — never recomputed ad-hoc.
import { WASTE_ITEMS } from '../data/wasteItems.js'

export const SCAN_TTL_MS = 30 * 60 * 1000
export const SCAN_TTL_MINUTES = SCAN_TTL_MS / 60000
// Clock-skew tolerance for client timestamps (future-dated scans within this
// window are accepted; beyond it they are rejected as clock games).
export const CLOCK_SKEW_MS = 60000

// Fresh-scan predicate shared by every "bonus still available?" check so the
// TTL/skew rule can't drift between call sites.
export function isScanFresh(scan) {
  const at = Number(scan?.at || 0)
  return !!scan?.bin && at > 0 && at <= Date.now() + CLOCK_SKEW_MS && Date.now() - at < SCAN_TTL_MS
}

export function scoreDisposal(itemName, bin) {
  const n = String(itemName || '').trim()
  if (!n) return { correct: false, earned: 2, co2: 0 }
  const known = WASTE_ITEMS.find((w) => w.name.toLowerCase() === n.toLowerCase())
  if (known && known.bin !== bin) return { correct: false, earned: 2, co2: 0 }
  if (!known) {
    // Novel name (e.g. from Gemini): verified but flat conservancy rate.
    return { correct: true, earned: /phone|laptop|tablet|computer/i.test(n) ? 10 : 5, co2: 0.02 }
  }
  return { correct: true, earned: known.points, co2: known.co2 }
}

export const SCAN_MATCH_BONUS = 10
// Server-enforced volume backstop (static printed QRs can't prove presence;
// per-profile daily caps bound couch-farming where IP limits can't help).
export const DAILY_DISPOSAL_LIMIT = 30
// Shared impact constants (single source — dashboard, store, API must agree).
export const DAY_MS = 864e5
export const KG_PER_RECYCLABLE_ITEM = 0.22
export const CO2_ABSORBED_PER_TREE_YEAR_KG = 21
// Dashboard-only weight estimates for charting unweighed disposals.
export const KG_ESTIMATE_WET_DRY = 0.12
export const KG_ESTIMATE_UNKNOWN = 0.1
