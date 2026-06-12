import { useCallback, useRef } from 'react'

export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

interface Props {
  src: string
  naturalWidth: number
  naturalHeight: number
  value: CropRect
  onChange: (rect: CropRect) => void
  /** 宽高比约束（w/h），不传则自由 */
  aspect?: number
}

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** 在图片上拖拽选择裁剪区域（坐标为原图像素坐标） */
export function CropSelector({ src, naturalWidth, naturalHeight, value, onChange, aspect }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ mode: DragMode; startX: number; startY: number; rect: CropRect } | null>(null)

  const onPointerDown = useCallback(
    (mode: DragMode) => (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const img = imgRef.current
      if (!img) return
      const scale = naturalWidth / img.clientWidth
      drag.current = { mode, startX: e.clientX * scale, startY: e.clientY * scale, rect: { ...value } }

      const onMove = (ev: PointerEvent) => {
        const d = drag.current
        if (!d) return
        const dx = ev.clientX * scale - d.startX
        const dy = ev.clientY * scale - d.startY
        let { x, y, w, h } = d.rect
        const MIN = 8

        if (d.mode === 'move') {
          x = clamp(d.rect.x + dx, 0, naturalWidth - w)
          y = clamp(d.rect.y + dy, 0, naturalHeight - h)
        } else {
          // 固定对角点，拖动当前角
          const fixedX = d.mode === 'nw' || d.mode === 'sw' ? d.rect.x + d.rect.w : d.rect.x
          const fixedY = d.mode === 'nw' || d.mode === 'ne' ? d.rect.y + d.rect.h : d.rect.y
          const movX = clamp(
            (d.mode === 'nw' || d.mode === 'sw' ? d.rect.x : d.rect.x + d.rect.w) + dx,
            0,
            naturalWidth,
          )
          const movY = clamp(
            (d.mode === 'nw' || d.mode === 'ne' ? d.rect.y : d.rect.y + d.rect.h) + dy,
            0,
            naturalHeight,
          )
          let nw = Math.max(MIN, Math.abs(movX - fixedX))
          let nh = Math.max(MIN, Math.abs(movY - fixedY))
          if (aspect) {
            nh = nw / aspect
            const maxH = movY < fixedY ? fixedY : naturalHeight - fixedY
            if (nh > maxH) {
              nh = maxH
              nw = nh * aspect
            }
          }
          x = movX < fixedX ? fixedX - nw : fixedX
          y = (aspect ? (movY < fixedY ? fixedY - nh : fixedY) : Math.min(movY, fixedY))
          if (!aspect) {
            x = Math.min(movX, fixedX)
          }
          w = nw
          h = nh
          x = clamp(x, 0, naturalWidth - w)
          y = clamp(y, 0, naturalHeight - h)
        }
        onChange({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) })
      }
      const onUp = () => {
        drag.current = null
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [value, naturalWidth, naturalHeight, aspect, onChange],
  )

  const pct = (n: number, total: number) => `${(n / total) * 100}%`

  return (
    <div className="crop-wrap">
      <img ref={imgRef} src={src} alt="待裁剪图片预览" draggable={false} />
      <div
        className="crop-rect"
        style={{
          left: pct(value.x, naturalWidth),
          top: pct(value.y, naturalHeight),
          width: pct(value.w, naturalWidth),
          height: pct(value.h, naturalHeight),
        }}
        onPointerDown={onPointerDown('move')}
      >
        {(['nw', 'ne', 'sw', 'se'] as const).map(h => (
          <span key={h} className="crop-handle" data-h={h} onPointerDown={onPointerDown(h)} />
        ))}
      </div>
    </div>
  )
}
