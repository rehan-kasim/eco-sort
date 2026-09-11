// Challenge proof rules — shared by the server (api/challenges.js) and the
// offline fallback (Challenges.jsx) so both enforce the same gate:
// every step must be backed by a real QR-verified disposal.
import { BIN_IDS } from '../data/bins.js'

// Which verified-disposal bins back each challenge step (null = any bin).
export const STEP_BINS = {
  'zero-waste-week': null,
  'plastic-free-lunch': ['RECYCLABLE'],
  'ewaste-drive': ['E_WASTE'],
  'compost-champions': ['WET'],
  'class-vs-class': null,
  'park-cleanup': null,
}

// Count verified entries per bin from a history-shaped array.
export function binCounts(entries) {
  const c = { WET: 0, DRY: 0, RECYCLABLE: 0, E_WASTE: 0 }
  for (const e of entries || []) {
    if (e.verified && c[e.bin] !== undefined) c[e.bin] += 1
  }
  return c
}

// Post-baseline earnings: how many verified disposals happened since `base`.
export function haveSince(current, base, bins) {
  const list = bins || BIN_IDS
  return list.reduce((a, b) => a + Math.max(0, (current[b] || 0) - (base[b] || 0)), 0)
}
