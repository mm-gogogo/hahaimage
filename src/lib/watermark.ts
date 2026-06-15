import { drawToCanvas } from './image'

export type WmType = 'text' | 'image'
export type Position = 'tile' | 'nw' | 'n' | 'ne' | 'w' | 'c' | 'e' | 'sw' | 's' | 'se'

export interface WatermarkOptions {
  type: WmType
  text: string
  color: string
  position: Position
  opacity: number
  /** 相对图片宽度的百分比 */
  sizePct: number
  /** 图片水印的已加载图像 */
  image?: HTMLImageElement | null
}

export const POSITIONS: { value: Position; label: string }[] = [
  { value: 'nw', label: '左上' },
  { value: 'n', label: '上中' },
  { value: 'ne', label: '右上' },
  { value: 'w', label: '左中' },
  { value: 'c', label: '居中' },
  { value: 'e', label: '右中' },
  { value: 'sw', label: '左下' },
  { value: 's', label: '下中' },
  { value: 'se', label: '右下' },
  { value: 'tile', label: '平铺' },
]

function anchor(pos: Position, w: number, h: number, margin: number) {
  const map: Record<string, [number, number]> = {
    nw: [0, 0], n: [0.5, 0], ne: [1, 0],
    w: [0, 0.5], c: [0.5, 0.5], e: [1, 0.5],
    sw: [0, 1], s: [0.5, 1], se: [1, 1],
  }
  const [ax, ay] = map[pos] ?? [0.5, 0.5]
  return { x: margin + ax * (w - margin * 2), y: margin + ay * (h - margin * 2), ax, ay }
}

/** 把水印画到一张图上，返回带水印的 canvas */
export function renderWatermark(source: HTMLImageElement, opts: WatermarkOptions): HTMLCanvasElement {
  const w = source.naturalWidth
  const h = source.naturalHeight
  const canvas = drawToCanvas(source, w, h)
  const ctx = canvas.getContext('2d')!
  ctx.globalAlpha = opts.opacity
  const margin = Math.round(Math.min(w, h) * 0.04)

  if (opts.type === 'text') {
    const fontSize = Math.max(12, Math.round((w * opts.sizePct) / 100))
    ctx.font = `600 ${fontSize}px ${getComputedStyle(document.body).fontFamily}`
    ctx.fillStyle = opts.color
    if (opts.position === 'tile') {
      const tw = ctx.measureText(opts.text).width
      const stepX = tw + fontSize * 3
      const stepY = fontSize * 5
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate((-30 * Math.PI) / 180)
      const diag = Math.hypot(w, h)
      for (let y = -diag / 2; y < diag / 2; y += stepY)
        for (let x = -diag / 2; x < diag / 2; x += stepX) ctx.fillText(opts.text, x, y)
      ctx.restore()
    } else {
      const a = anchor(opts.position, w, h, margin)
      ctx.textAlign = a.ax === 0 ? 'left' : a.ax === 1 ? 'right' : 'center'
      ctx.textBaseline = a.ay === 0 ? 'top' : a.ay === 1 ? 'bottom' : 'middle'
      ctx.fillText(opts.text, a.x, a.y)
    }
  } else if (opts.image) {
    const wmImg = opts.image
    const ww = Math.max(8, Math.round((w * opts.sizePct * 2.5) / 100))
    const wh = Math.round((wmImg.naturalHeight * ww) / wmImg.naturalWidth)
    if (opts.position === 'tile') {
      for (let y = 0; y < h; y += wh * 3) for (let x = 0; x < w; x += ww * 2) ctx.drawImage(wmImg, x, y, ww, wh)
    } else {
      const a = anchor(opts.position, w, h, margin)
      ctx.drawImage(wmImg, a.x - a.ax * ww, a.y - a.ay * wh, ww, wh)
    }
  }
  ctx.globalAlpha = 1
  return canvas
}
