import { useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { canvasToBlob, loadImage } from '../../lib/image'

type Direction = 'vertical' | 'horizontal'

export default function Stitch() {
  const [files, setFiles] = useState<File[]>([])
  const [direction, setDirection] = useState<Direction>('vertical')
  const [unify, setUnify] = useState(true)
  const [gap, setGap] = useState('0')
  const [bg, setBg] = useState('#ffffff')
  const [mime, setMime] = useState('image/png')
  const [results, setResults] = useState<ResultItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const move = (i: number, dir: -1 | 1) => {
    const next = [...files]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    setFiles(next)
  }

  const run = async () => {
    setBusy(true)
    setError('')
    setResults([])
    try {
      const imgs = []
      for (const f of files) imgs.push(await loadImage(f))
      const g = Math.max(0, Number(gap) || 0)
      const canvas = document.createElement('canvas')
      const ctx2 = () => {
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.imageSmoothingQuality = 'high'
        return ctx
      }

      if (direction === 'vertical') {
        const targetW = unify
          ? Math.min(...imgs.map(i => i.naturalWidth))
          : Math.max(...imgs.map(i => i.naturalWidth))
        const heights = imgs.map(i => (unify ? Math.round((i.naturalHeight * targetW) / i.naturalWidth) : i.naturalHeight))
        canvas.width = targetW
        canvas.height = heights.reduce((s, h) => s + h, 0) + g * (imgs.length - 1)
        const ctx = ctx2()
        let y = 0
        imgs.forEach((img, i) => {
          const w = unify ? targetW : img.naturalWidth
          const x = unify ? 0 : Math.round((targetW - w) / 2)
          ctx.drawImage(img, x, y, w, heights[i])
          y += heights[i] + g
        })
      } else {
        const targetH = unify
          ? Math.min(...imgs.map(i => i.naturalHeight))
          : Math.max(...imgs.map(i => i.naturalHeight))
        const widths = imgs.map(i => (unify ? Math.round((i.naturalWidth * targetH) / i.naturalHeight) : i.naturalWidth))
        canvas.height = targetH
        canvas.width = widths.reduce((s, w) => s + w, 0) + g * (imgs.length - 1)
        const ctx = ctx2()
        let x = 0
        imgs.forEach((img, i) => {
          const h = unify ? targetH : img.naturalHeight
          const y = unify ? 0 : Math.round((targetH - h) / 2)
          ctx.drawImage(img, x, y, widths[i], h)
          x += widths[i] + g
        })
      }

      const blob = await canvasToBlob(canvas, mime, mime === 'image/jpeg' ? 0.92 : undefined)
      setResults([{ name: mime === 'image/jpeg' ? 'stitched.jpg' : 'stitched.png', blob, note: `${canvas.width} × ${canvas.height}` }])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage title="拼接图片" desc="把多张图片按顺序拼成一张长图。可统一宽高（按比例缩放对齐），可设置间距和背景色。">
      <div className="panel">
        <FileDrop accept="image/*" multiple onFiles={f => setFiles(prev => [...prev, ...f])} hint="按选择顺序拼接，可用箭头调整顺序" />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} onMove={move} />
      </div>

      <div className="panel">
        <h2>拼接选项</h2>
        <div className="row">
          <div className="seg" role="group" aria-label="拼接方向">
            <button aria-pressed={direction === 'vertical'} onClick={() => setDirection('vertical')}>
              纵向
            </button>
            <button aria-pressed={direction === 'horizontal'} onClick={() => setDirection('horizontal')}>
              横向
            </button>
          </div>
          <label className="check">
            <input type="checkbox" checked={unify} onChange={e => setUnify(e.target.checked)} />
            统一{direction === 'vertical' ? '宽度' : '高度'}（按比例缩放）
          </label>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="st-gap">间距（px）</label>
            <input id="st-gap" className="input" type="number" min={0} value={gap} onChange={e => setGap(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="st-fmt">输出格式</label>
            <select id="st-fmt" className="input" value={mime} onChange={e => setMime(e.target.value)}>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPG</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="st-bg">背景色</label>
          <input id="st-bg" type="color" value={bg} onChange={e => setBg(e.target.value)} />
        </div>
        {error && <p className="msg msg-error">{error}</p>}
        <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={files.length < 2 || busy} onClick={run}>
          {busy && <span className="spinner" />}
          {busy ? '拼接中…' : `开始拼接（${files.length} 张）`}
        </button>
      </div>

      <ResultList items={results} />
    </ToolPage>
  )
}
