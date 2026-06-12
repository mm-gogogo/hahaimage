import { useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { MIME_EXT, canvasToBlob, drawToCanvas, loadImage, replaceExt } from '../../lib/image'

type WmType = 'text' | 'image'
type Position = 'tile' | 'nw' | 'n' | 'ne' | 'w' | 'c' | 'e' | 'sw' | 's' | 'se'

const POSITIONS: { value: Position; label: string }[] = [
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

function anchor(pos: Position, w: number, h: number, margin: number): { x: number; y: number; ax: number; ay: number } {
  // ax/ay: 0 起点 0.5 居中 1 终点
  const map: Record<string, [number, number]> = {
    nw: [0, 0], n: [0.5, 0], ne: [1, 0],
    w: [0, 0.5], c: [0.5, 0.5], e: [1, 0.5],
    sw: [0, 1], s: [0.5, 1], se: [1, 1],
  }
  const [ax, ay] = map[pos] ?? [0.5, 0.5]
  return {
    x: margin + ax * (w - margin * 2),
    y: margin + ay * (h - margin * 2),
    ax,
    ay,
  }
}

export default function Watermark() {
  const [files, setFiles] = useState<File[]>([])
  const [wmType, setWmType] = useState<WmType>('text')
  const [text, setText] = useState('哈哈图片')
  const [color, setColor] = useState('#ffffff')
  const [wmImage, setWmImage] = useState<File | null>(null)
  const [position, setPosition] = useState<Position>('se')
  const [opacity, setOpacity] = useState(0.5)
  const [sizePct, setSizePct] = useState(6)
  const [results, setResults] = useState<ResultItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setBusy(true)
    setError('')
    setResults([])
    try {
      if (wmType === 'image' && !wmImage) throw new Error('请先上传水印图片')
      const wmImg = wmType === 'image' && wmImage ? await loadImage(wmImage) : null

      const out: ResultItem[] = []
      for (const file of files) {
        const img = await loadImage(file)
        const w = img.naturalWidth
        const h = img.naturalHeight
        const canvas = drawToCanvas(img, w, h)
        const ctx = canvas.getContext('2d')!
        ctx.globalAlpha = opacity
        const margin = Math.round(Math.min(w, h) * 0.04)

        if (wmType === 'text') {
          const fontSize = Math.max(12, Math.round((w * sizePct) / 100))
          ctx.font = `600 ${fontSize}px ${getComputedStyle(document.body).fontFamily}`
          ctx.fillStyle = color
          if (position === 'tile') {
            const tw = ctx.measureText(text).width
            const stepX = tw + fontSize * 3
            const stepY = fontSize * 5
            ctx.translate(w / 2, h / 2)
            ctx.rotate((-30 * Math.PI) / 180)
            const diag = Math.hypot(w, h)
            for (let y = -diag / 2; y < diag / 2; y += stepY) {
              for (let x = -diag / 2; x < diag / 2; x += stepX) {
                ctx.fillText(text, x, y)
              }
            }
          } else {
            const a = anchor(position, w, h, margin)
            ctx.textAlign = a.ax === 0 ? 'left' : a.ax === 1 ? 'right' : 'center'
            ctx.textBaseline = a.ay === 0 ? 'top' : a.ay === 1 ? 'bottom' : 'middle'
            ctx.fillText(text, a.x, a.y)
          }
        } else if (wmImg) {
          const ww = Math.max(8, Math.round((w * sizePct * 2.5) / 100))
          const wh = Math.round((wmImg.naturalHeight * ww) / wmImg.naturalWidth)
          if (position === 'tile') {
            for (let y = 0; y < h; y += wh * 3) {
              for (let x = 0; x < w; x += ww * 2) {
                ctx.drawImage(wmImg, x, y, ww, wh)
              }
            }
          } else {
            const a = anchor(position, w, h, margin)
            ctx.drawImage(wmImg, a.x - a.ax * ww, a.y - a.ay * wh, ww, wh)
          }
        }

        ctx.globalAlpha = 1
        const mime = MIME_EXT[file.type] ? file.type : 'image/png'
        const blob = await canvasToBlob(canvas, mime, mime === 'image/png' ? undefined : 0.92)
        out.push({ name: replaceExt(file.name, MIME_EXT[mime]), blob })
      }
      setResults(out)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage title="图片加水印" desc="为图片添加文字或图片水印，支持九宫格定位与全图平铺，可批量处理多张图片。">
      <div className="panel">
        <FileDrop accept="image/*" multiple onFiles={f => setFiles(prev => [...prev, ...f])} hint="要加水印的图片，可多选" />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} />
      </div>

      <div className="panel">
        <h2>水印设置</h2>
        <div className="seg" role="group" aria-label="水印类型">
          <button aria-pressed={wmType === 'text'} onClick={() => setWmType('text')}>
            文字水印
          </button>
          <button aria-pressed={wmType === 'image'} onClick={() => setWmType('image')}>
            图片水印
          </button>
        </div>

        {wmType === 'text' ? (
          <div className="grid-2">
            <div className="field">
              <label htmlFor="wm-text">水印文字</label>
              <input id="wm-text" className="input" value={text} onChange={e => setText(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="wm-color">文字颜色</label>
              <input id="wm-color" type="color" value={color} onChange={e => setColor(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="field">
            <label>水印图片{wmImage ? `：${wmImage.name}` : ''}</label>
            <FileDrop compact accept="image/*" onFiles={f => setWmImage(f[0])} label="选择水印图片（推荐透明 PNG）" />
          </div>
        )}

        <div className="grid-2">
          <div className="field">
            <label htmlFor="wm-pos">位置</label>
            <select id="wm-pos" className="input" value={position} onChange={e => setPosition(e.target.value as Position)}>
              {POSITIONS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="wm-size">大小：{sizePct}%（相对图片宽度）</label>
            <input id="wm-size" type="range" min={2} max={20} value={sizePct} onChange={e => setSizePct(Number(e.target.value))} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="wm-op">不透明度：{Math.round(opacity * 100)}%</label>
          <input id="wm-op" type="range" min={5} max={100} value={Math.round(opacity * 100)} onChange={e => setOpacity(Number(e.target.value) / 100)} />
        </div>
        {error && <p className="msg msg-error">{error}</p>}
        <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={files.length === 0 || busy} onClick={run}>
          {busy && <span className="spinner" />}
          {busy ? '处理中…' : `添加水印（${files.length} 个文件）`}
        </button>
      </div>

      <ResultList items={results} zipName="watermarked.zip" />
    </ToolPage>
  )
}
