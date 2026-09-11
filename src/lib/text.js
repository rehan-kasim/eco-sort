// Display-text utilities shared by server (api/) and client (src/).
// No Node or DOM dependencies — safe to import anywhere.

// Display-name sanitizer for shared surfaces (leaderboards, exports):
// strips control/bidi-override characters and collapses whitespace so
// crafted names can't spoof rows or break layouts. React escaping already
// handles HTML; this handles the rest.
export function sanitizeText(v, max) {
  return String(v || '')
    .replace(/[\u0000-\u001F\u007F\u200E\u200F\u202A-\u202E\u2066-\u2069]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

// Pseudonym for public boards: first name + last initial ("Diya Patel" →
// "Diya P."). Full names are never written to shared storage.
export function pseudonym(full) {
  const parts = String(full || 'Recycler').trim().split(/\s+/)
  if (parts.length < 2) return parts[0] || 'Recycler'
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}
