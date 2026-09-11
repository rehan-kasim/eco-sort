import { WASTE_ITEMS } from '../data/wasteItems.js'

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Word-boundary, longest-keyword-wins matcher over the knowledge base.
// Shared by the on-device fallback (classifier.js) and the server-side guard
// (api/classify.js) so both resolve hints identically.
export function matchKnownItem(text) {
  const t = (text || '').toLowerCase()
  if (!t.trim()) return null
  let best = null
  let bestLen = 0
  for (const item of WASTE_ITEMS) {
    for (const rawKw of item.keywords) {
      const kw = rawKw.trim().toLowerCase()
      if (!kw) continue
      // \b so `tea` doesn't hit `steak` and `egg` doesn't hit `veggie`.
      if (new RegExp(`\\b${esc(kw)}\\b`).test(t) && kw.length > bestLen) {
        best = item
        bestLen = kw.length
      }
    }
  }
  return best
}
