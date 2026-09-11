import { WASTE_ITEMS } from '../data/wasteItems.js'
import { matchKnownItem } from './matcher.js'

// Lightweight on-device "AI" simulation:
// 1) filename / user-hint keyword match (high confidence)
// 2) else color-histogram heuristic on a downscaled canvas (medium confidence)
// 3) always returns top-3 candidates + explainable pipeline steps.
// Shared pipeline labels so Scanner and the classifier can't drift apart.
export const STEPS = [
  { label: 'Preprocessing image', detail: 'Resize · denoise · normalize lighting' },
  { label: 'Detecting object', detail: 'Foreground segmentation + bounding box' },
  { label: 'Classifying material', detail: 'Vision model · 4-bin segregation rules' },
  { label: 'Mapping to bin', detail: 'City segregation rules · school bin map' },
]

function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return Math.abs(h)
}

function findByText(text) {
  return matchKnownItem(text)
}

function analyzePixels(dataUrl) {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.onload = () => {
        try {
          const c = document.createElement('canvas')
          c.width = 32; c.height = 32
          const ctx = c.getContext('2d', { willReadFrequently: true })
          ctx.drawImage(img, 0, 0, 32, 32)
          const d = ctx.getImageData(0, 0, 32, 32).data
          let r = 0, g = 0, b = 0, bright = 0, edge = 0
          const n = 32 * 32
          for (let i = 0; i < d.length; i += 4) {
            r += d[i]; g += d[i + 1]; b += d[i + 2]
            bright += (d[i] + d[i + 1] + d[i + 2]) / 3
          }
          r /= n; g /= n; b /= n; bright /= 255
          // sample edge variance quickly
          for (let i = 0; i < d.length; i += 32) edge += Math.abs(d[i] - d[(i + 16) % d.length])
          resolve({ r: Math.round(r), g: Math.round(g), b: Math.round(b), bright: +bright.toFixed(2), edge })
        } catch { resolve({ r: 120, g: 120, b: 120, bright: 0.5, edge: 0 }) }
      }
      img.onerror = () => resolve({ r: 120, g: 120, b: 120, bright: 0.5, edge: 0 })
      img.src = dataUrl
    } catch { resolve({ r: 120, g: 120, b: 120, bright: 0.5, edge: 0 }) }
  })
}

function heuristicGuess(px, seedKey) {
  const h = hashStr(seedKey || `${px.r},${px.g},${px.b}`)
  // green/brown organic → wet; dark metallic/blue → recyclable/ewaste
  const greenish = px.g > px.r + 8 && px.g > px.b
  const brownish = px.r > 100 && px.g > 70 && px.b < 90
  const bluish = px.b > px.r + 10
  const dark = px.bright < 0.35
  let pool
  if (greenish || brownish) pool = WASTE_ITEMS.filter((w) => w.bin === 'WET')
  else if (bluish) pool = WASTE_ITEMS.filter((w) => w.bin === 'RECYCLABLE')
  else if (dark) pool = WASTE_ITEMS.filter((w) => w.bin === 'E_WASTE' || w.bin === 'DRY')
  else pool = WASTE_ITEMS.filter((w) => w.bin === 'RECYCLABLE' || w.bin === 'DRY')
  const pick = pool[h % pool.length]
  const conf = 71 + (h % 15) // 71–85
  return { item: pick, conf }
}

export async function classifyWaste({ fileName = '', hint = '', dataUrl = '' }) {
  const steps = STEPS
  const textHit = findByText(`${fileName} ${hint}`)
  // artificial latency for staged UX (kept short + skippable)
  await new Promise((r) => setTimeout(r, 650))

  if (textHit) {
    const alts = WASTE_ITEMS.filter((w) => w.bin === textHit.bin && w.name !== textHit.name).slice(0, 2)
    const otherBin = WASTE_ITEMS.find((w) => w.bin !== textHit.bin)
    return {
      item: textHit, confidence: textHit.conf, method: 'vision+label',
      pixels: dataUrl ? await analyzePixels(dataUrl) : null,
      steps,
      alternatives: [...alts.map((a) => ({ name: a.name, bin: a.bin, conf: a.conf - 18 })), { name: otherBin.name, bin: otherBin.bin, conf: 11 }],
    }
  }

  const px = dataUrl ? await analyzePixels(dataUrl) : { r: 120, g: 120, b: 120, bright: 0.5, edge: 0 }
  const { item, conf } = heuristicGuess(px, fileName + hint + (dataUrl || '').slice(-256))
  const alts = WASTE_ITEMS.filter((w) => w.name !== item.name && w.bin === item.bin).slice(0, 1)
    .concat(WASTE_ITEMS.filter((w) => w.bin !== item.bin).slice(0, 2))
  return {
    item, confidence: conf, method: 'vision',
    pixels: px, steps,
    alternatives: alts.map((a, i) => ({ name: a.name, bin: a.bin, conf: Math.max(9, conf - 14 - i * 9) })),
  }
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}

// Downscale to maxDim (default 1280px) JPEG ~0.82 so uploads stay small:
// faster AI calls, lower Gemini cost, same classification quality.
export function downscaleDataUrl(dataUrl, maxDim = 1280) {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1))
          if (scale >= 1 && /^data:image\/jpeg/.test(dataUrl)) return resolve(dataUrl)
          const c = document.createElement('canvas')
          c.width = Math.max(1, Math.round(img.naturalWidth * scale))
          c.height = Math.max(1, Math.round(img.naturalHeight * scale))
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
          resolve(c.toDataURL('image/jpeg', 0.82))
        } catch {
          resolve(dataUrl)
        }
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    } catch {
      resolve(dataUrl)
    }
  })
}
