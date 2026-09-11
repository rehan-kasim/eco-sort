import { useEffect, useRef } from 'react'

// Re-runs `fn` on every local state mutation (saveState dispatches
// `ecosort:update`), cross-tab storage changes, and window focus.
// Latest closure always wins via ref — subscribe once, no dep loops.
export function useEcoSync(fn) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    const h = () => {
      try {
        ref.current()
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('ecosort:update', h)
    window.addEventListener('storage', h)
    window.addEventListener('focus', h)
    return () => {
      window.removeEventListener('ecosort:update', h)
      window.removeEventListener('storage', h)
      window.removeEventListener('focus', h)
    }
  }, [])
}
