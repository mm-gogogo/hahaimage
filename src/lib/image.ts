/** 浏览器端图片处理基础工具，全部基于 Canvas，不依赖任何服务器 */

export async function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  const url = typeof src === 'string' ? src : URL.createObjectURL(src)
  const img = new Image()
  img.src = url
  try {
    await img.decode()
  } finally {
    if (typeof src !== 'string') URL.revokeObjectURL(url)
  }
  return img
}

export function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  opts: { bg?: string; sx?: number; sy?: number; sw?: number; sh?: number } = {},
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d')!
  if (opts.bg) {
    ctx.fillStyle = opts.bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.imageSmoothingQuality = 'high'
  if (opts.sw != null && opts.sh != null) {
    ctx.drawImage(source, opts.sx ?? 0, opts.sy ?? 0, opts.sw, opts.sh, 0, 0, canvas.width, canvas.height)
  } else {
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  }
  return canvas
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error(`当前浏览器不支持导出 ${type} 格式`))),
      type,
      quality,
    )
  })
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export function baseName(name: string): string {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(0, i) : name
}

export function replaceExt(name: string, ext: string): string {
  return `${baseName(name)}.${ext}`
}

export const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

/** 按质量压缩；可选限制最长边 */
export async function compressImage(
  file: Blob,
  opts: { type: string; quality: number; maxEdge?: number; bg?: string },
): Promise<Blob> {
  const img = await loadImage(file)
  let { naturalWidth: w, naturalHeight: h } = img
  if (opts.maxEdge && Math.max(w, h) > opts.maxEdge) {
    const r = opts.maxEdge / Math.max(w, h)
    w = Math.round(w * r)
    h = Math.round(h * r)
  }
  const bg = opts.type === 'image/jpeg' ? (opts.bg ?? '#ffffff') : opts.bg
  const canvas = drawToCanvas(img, w, h, { bg })
  return canvasToBlob(canvas, opts.type, opts.quality)
}

/**
 * 压缩到指定大小：先二分质量，质量降到下限仍超出则按 0.85 比例逐级缩小尺寸。
 */
export async function compressToTarget(
  file: Blob,
  targetBytes: number,
  type: 'image/jpeg' | 'image/webp' = 'image/jpeg',
): Promise<{ blob: Blob; quality: number; scale: number }> {
  const img = await loadImage(file)
  let scale = 1
  let best: { blob: Blob; quality: number; scale: number } | null = null

  for (let round = 0; round < 8; round++) {
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = drawToCanvas(img, w, h, { bg: type === 'image/jpeg' ? '#ffffff' : undefined })
    let lo = 0.05
    let hi = 0.95
    let roundBest: { blob: Blob; quality: number } | null = null
    for (let i = 0; i < 8; i++) {
      const q = (lo + hi) / 2
      const blob = await canvasToBlob(canvas, type, q)
      if (blob.size <= targetBytes) {
        roundBest = { blob, quality: q }
        lo = q
      } else {
        hi = q
      }
    }
    if (roundBest) {
      // 取本轮满足大小的最高质量结果
      best = { ...roundBest, scale }
      break
    }
    // 即使最低质量也超标，记录最小结果并缩小尺寸重试
    const minBlob = await canvasToBlob(canvas, type, 0.05)
    if (!best || minBlob.size < best.blob.size) best = { blob: minBlob, quality: 0.05, scale }
    scale *= 0.85
  }
  return best!
}
