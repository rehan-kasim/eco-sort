import { useRef } from 'react'
import { binById } from '../data/bins.js'

// Mouse-tracked 3D tilt wrapper. Disabled automatically for reduced motion.
export function Tilt({ children, max = 12, className = '' }) {
  const ref = useRef(null)

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `rotateY(${(px * max).toFixed(2)}deg) rotateX(${(-py * max).toFixed(2)}deg)`
  }
  const reset = () => {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <div className={`scene ${className}`}>
      <div ref={ref} className="tilt h-full w-full" onMouseMove={onMove} onMouseLeave={reset}>
        {children}
      </div>
    </div>
  )
}

// Pure-CSS 3D smart bin: gradient body, raised rim, dark opening, floor shadow.
export function Bin3D({ bin = 'RECYCLABLE', label = true, className = '' }) {
  const b = binById(bin)
  const c = b.color
  return (
    <div className={`preserve-3d relative ${className}`} aria-hidden="true">
      <div
        className="bin-3d relative mx-auto h-36 w-28 rounded-b-[1.4rem] rounded-t-lg"
        style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${c} 55%, white) 0%, ${c} 45%, color-mix(in srgb, ${c} 72%, black) 100%)` }}
      >
        <div className="absolute inset-x-2 top-2 h-5 rounded-full bg-black/80" style={{ transform: 'translateZ(10px)' }} />
        <div
          className="bin-3d-rim absolute -inset-x-1.5 top-0 h-4 rounded-lg"
          style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${c} 60%, white), ${c})` }}
        />
        {label && (
          <div className="pop absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
            <p className="font-display text-[13px] font-extrabold uppercase tracking-wider text-white drop-shadow">{b.label.replace(' Bin', '')}</p>
          </div>
        )}
        <div className="absolute inset-y-0 left-1 w-2 rounded-full bg-white/25 blur-[1px]" />
      </div>
      <div className="floor-shadow mx-auto mt-1 h-4 w-32" />
    </div>
  )
}

// Short label for bin ids (Wet / Dry / Recyclable / E-Waste handled by Bin3D).
export function BinDot({ bin }) {
  const b = binById(bin)
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: b.color }} aria-hidden="true" />
}
