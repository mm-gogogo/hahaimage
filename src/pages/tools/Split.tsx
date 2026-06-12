import { useEffect, useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { baseName, canvasToBlob, drawToCanvas, loadImage } from '../../lib/image'

export default function Split() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [rows, setRows] = useState('3')
  const [cols, setCols] = useState('3')
  const [results, setResults] = useState<ResultItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => URL.revokeObjectURL(url), [url])

  const r = Math.max(1, Math.min(20, Number(rows) || 1))
  const c = Math.max(1, Math.min(20, Number(cols) || 1))

  const run = async () => {
    if (!file) return
    setBusy(true)
    setError('')
    setResults([])
    try {
      const img = await loadImage(file)
      const w = img.naturalWidth
      const h = img.naturalHeight
      const out: ResultItem[] = []
      for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
          const sx = Math.round((j * w) / c)
          const sy = Math.round((i * h) / r)
          const sw = Math.round(((j + 1) * w) / c) - sx
          const sh = Math.round(((i + 1) * h) / r) - sy
          const canvas = drawToCanvas(img, sw, sh, { sx, sy, sw, sh })
          const blob = await canvasToBlob(canvas, 'image/png')
          out.push({ name: `${baseName(file.name)}_${i + 1}-${j + 1}.png`, blob, note: `${sw} × ${sh}` })
        }
      }
      setResults(out)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage title="分割图片" desc="把一张图片按行列均分成多块，常用于朋友圈九宫格。输出 PNG，可一键打包下载。">
      <div className="panel">
        {!file ? (
          <FileDrop
            accept="image/*"
            onFiles={async f => {
              setFile(f[0])
              setUrl(prev => {
                URL.revokeObjectURL(prev)
                return URL.createObjectURL(f[0])
              })
              setResults([])
            }}
          />
        ) : (
          <>
            <div style={{ position: 'relative', width: 'fit-content', maxWidth: '100%', marginInline: 'auto' }}>
              <img src={url} alt="待分割图片预览" style={{ maxHeight: '50vh', width: 'auto' }} />
              {Array.from({ length: c - 1 }, (_, i) => (
                <span
                  key={`v${i}`}
                  style={{
                    position: 'absolute',
                    left: `${((i + 1) / c) * 100}%`,
                    top: 0,
                    bottom: 0,
                    width: 1.5,
                    background: 'var(--accent)',
                    opacity: 0.8,
                  }}
                />
              ))}
              {Array.from({ length: r - 1 }, (_, i) => (
                <span
                  key={`h${i}`}
                  style={{
                    position: 'absolute',
                    top: `${((i + 1) / r) * 100}%`,
                    left: 0,
                    right: 0,
                    height: 1.5,
                    background: 'var(--accent)',
                    opacity: 0.8,
                  }}
                />
              ))}
            </div>
            <button className="btn" onClick={() => setFile(null)}>
              换一张图
            </button>
          </>
        )}
      </div>

      <div className="panel">
        <h2>分割设置</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="sp-r">行数</label>
            <input id="sp-r" className="input" type="number" min={1} max={20} value={rows} onChange={e => setRows(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="sp-c">列数</label>
            <input id="sp-c" className="input" type="number" min={1} max={20} value={cols} onChange={e => setCols(e.target.value)} />
          </div>
        </div>
        {error && <p className="msg msg-error">{error}</p>}
        <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={!file || busy} onClick={run}>
          {busy && <span className="spinner" />}
          {busy ? '分割中…' : `分割为 ${r} × ${c} = ${r * c} 块`}
        </button>
      </div>

      <ResultList items={results} zipName="split.zip" />
    </ToolPage>
  )
}
