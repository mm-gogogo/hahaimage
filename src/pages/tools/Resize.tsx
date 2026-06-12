import { useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { MIME_EXT, canvasToBlob, drawToCanvas, loadImage, replaceExt } from '../../lib/image'

type Mode = 'pixel' | 'percent'

export default function Resize() {
  const [files, setFiles] = useState<File[]>([])
  const [mode, setMode] = useState<Mode>('pixel')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [percent, setPercent] = useState('50')
  const [results, setResults] = useState<ResultItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setBusy(true)
    setError('')
    setResults([])
    try {
      const w = Number(width) || 0
      const h = Number(height) || 0
      const p = Number(percent) || 0
      if (mode === 'pixel' && w <= 0 && h <= 0) throw new Error('请至少填写宽度或高度其中一项')
      if (mode === 'percent' && (p <= 0 || p > 1000)) throw new Error('缩放比例需在 1 - 1000 之间')

      const out: ResultItem[] = []
      for (const file of files) {
        const img = await loadImage(file)
        let tw: number
        let th: number
        if (mode === 'percent') {
          tw = (img.naturalWidth * p) / 100
          th = (img.naturalHeight * p) / 100
        } else {
          // 只填一项时按比例推算另一项
          tw = w > 0 ? w : (h / img.naturalHeight) * img.naturalWidth
          th = h > 0 ? h : (w / img.naturalWidth) * img.naturalHeight
        }
        const mime = MIME_EXT[file.type] ? file.type : 'image/png'
        const canvas = drawToCanvas(img, tw, th, { bg: mime === 'image/jpeg' ? '#ffffff' : undefined })
        const blob = await canvasToBlob(canvas, mime, mime === 'image/png' ? undefined : 0.92)
        out.push({
          name: replaceExt(file.name, MIME_EXT[mime]),
          blob,
          note: `${canvas.width} × ${canvas.height}`,
        })
      }
      setResults(out)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage title="调整图片尺寸" desc="按目标像素或缩放百分比批量调整图片大小。只填宽或高其中一项时，会按原图比例自动计算另一项。">
      <div className="panel">
        <FileDrop accept="image/*" multiple onFiles={f => setFiles(prev => [...prev, ...f])} hint="可多选，输出保持原格式" />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} />
      </div>

      <div className="panel">
        <h2>尺寸设置</h2>
        <div className="seg" role="group" aria-label="调整方式">
          <button aria-pressed={mode === 'pixel'} onClick={() => setMode('pixel')}>
            按像素
          </button>
          <button aria-pressed={mode === 'percent'} onClick={() => setMode('percent')}>
            按百分比
          </button>
        </div>
        {mode === 'pixel' ? (
          <div className="grid-2">
            <div className="field">
              <label htmlFor="rs-w">宽度（px）</label>
              <input id="rs-w" className="input" type="number" min={1} placeholder="留空按比例" value={width} onChange={e => setWidth(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="rs-h">高度（px）</label>
              <input id="rs-h" className="input" type="number" min={1} placeholder="留空按比例" value={height} onChange={e => setHeight(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="rs-p">缩放比例（%）</label>
            <input id="rs-p" className="input" type="number" min={1} max={1000} value={percent} onChange={e => setPercent(e.target.value)} />
          </div>
        )}
        {error && <p className="msg msg-error">{error}</p>}
        <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={files.length === 0 || busy} onClick={run}>
          {busy && <span className="spinner" />}
          {busy ? '处理中…' : `开始调整（${files.length} 个文件）`}
        </button>
      </div>

      <ResultList items={results} zipName="resized.zip" />
    </ToolPage>
  )
}
