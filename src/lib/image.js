// Browser image helpers: read an uploaded file and downscale it before upload.
// Kept separate from detection (detection is Gemini-only, server-side).
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}

// Downscale to maxDim (default 1280px) JPEG ~0.82 so uploads stay small:
// faster AI calls, lower cost, same classification quality.
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
