import { useCallback, useRef, useState } from 'react'

/**
 * 前后对比滑块：左侧显示原图(before)，右侧显示处理后(after)，
 * 拖动中间手柄揭示对比。常用于压缩/转换/水印等"看不出差别"的场景。
 */
export function BeforeAfter({
  before,
  after,
  beforeLabel = '原图',
  afterLabel = '处理后',
}: {
  before: string
  after: string
  beforeLabel?: string
  afterLabel?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50)

  const move = useCallback((clientX: number) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const p = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.max(0, Math.min(100, p)))
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    move(e.clientX)
    const onMove = (ev: PointerEvent) => move(ev.clientX)
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      ref={wrapRef}
      className="ba-compare"
      onPointerDown={onPointerDown}
      role="slider"
      aria-label="前后对比，拖动调整分界"
      aria-valuenow={Math.round(pos)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'ArrowLeft') setPos(p => Math.max(0, p - 4))
        if (e.key === 'ArrowRight') setPos(p => Math.min(100, p + 4))
      }}
    >
      <img src={before} alt={beforeLabel} />
      <div className="ba-after" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <img src={after} alt={afterLabel} />
      </div>
      <span className="ba-label ba-label-before">{beforeLabel}</span>
      <span className="ba-label ba-label-after">{afterLabel}</span>
      <div className="ba-handle" style={{ left: `${pos}%` }} />
    </div>
  )
}
