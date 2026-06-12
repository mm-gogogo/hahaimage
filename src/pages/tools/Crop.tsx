import { useEffect, useState } from 'react'
import { CropSelector, type CropRect } from '../../components/CropSelector'
import { FileDrop } from '../../components/FileDrop'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { MIME_EXT, canvasToBlob, drawToCanvas, loadImage, replaceExt } from '../../lib/image'

const ASPECTS = [
  { label: '自由', value: 0 },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:4', value: 3 / 4 },
  { label: '9:16', value: 9 / 16 },
]

export default function Crop() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [rect, setRect] = useState<CropRect>({ x: 0, y: 0, w: 100, h: 100 })
  const [aspect, setAspect] = useState(0)
  const [results, setResults] = useState<ResultItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => URL.revokeObjectURL(url), [url])

  const pick = async (files: File[]) => {
    const f = files[0]
    const img = await loadImage(f)
    setFile(f)
    setUrl(prev => {
      URL.revokeObjectURL(prev)
      return URL.createObjectURL(f)
    })
    const w = img.naturalWidth
    const h = img.naturalHeight
    setSize({ w, h })
    setRect({ x: Math.round(w * 0.1), y: Math.round(h * 0.1), w: Math.round(w * 0.8), h: Math.round(h * 0.8) })
    setResults([])
  }

  const applyAspect = (a: number) => {
    setAspect(a)
    if (!size || !a) return
    // 以当前选区中心为基准重设为目标比例
    let w = rect.w
    let h = Math.round(w / a)
    if (h > size.h) {
      h = size.h
      w = Math.round(h * a)
    }
    const cx = rect.x + rect.w / 2
    const cy = rect.y + rect.h / 2
    setRect({
      x: Math.max(0, Math.min(size.w - w, Math.round(cx - w / 2))),
      y: Math.max(0, Math.min(size.h - h, Math.round(cy - h / 2))),
      w,
      h,
    })
  }

  const run = async () => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const img = await loadImage(file)
      const canvas = drawToCanvas(img, rect.w, rect.h, { sx: rect.x, sy: rect.y, sw: rect.w, sh: rect.h })
      const mime = MIME_EXT[file.type] ? file.type : 'image/png'
      const blob = await canvasToBlob(canvas, mime, mime === 'image/png' ? undefined : 0.92)
      setResults([{ name: replaceExt(file.name, MIME_EXT[mime]), blob, note: `${rect.w} × ${rect.h}` }])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage title="裁剪图片" desc="拖拽裁剪框选择保留区域，支持常用宽高比例约束。">
      {!file ? (
        <div className="panel">
          <FileDrop accept="image/*" onFiles={pick} />
        </div>
      ) : (
        <>
          <div className="panel">
            <div className="row">
              <div className="seg" role="group" aria-label="宽高比">
                {ASPECTS.map(a => (
                  <button key={a.label} aria-pressed={aspect === a.value} onClick={() => applyAspect(a.value)}>
                    {a.label}
                  </button>
                ))}
              </div>
              <span className="note" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
                {rect.w} × {rect.h} @ ({rect.x}, {rect.y})
              </span>
            </div>
            {size && (
              <CropSelector
                src={url}
                naturalWidth={size.w}
                naturalHeight={size.h}
                value={rect}
                onChange={setRect}
                aspect={aspect || undefined}
              />
            )}
            {error && <p className="msg msg-error">{error}</p>}
            <div className="row">
              <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={busy} onClick={run}>
                {busy && <span className="spinner" />}
                裁剪
              </button>
              <button className="btn" onClick={() => setFile(null)}>
                换一张图
              </button>
            </div>
          </div>
          <ResultList items={results} />
        </>
      )}
    </ToolPage>
  )
}
