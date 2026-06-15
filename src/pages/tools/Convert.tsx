import { useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { MIME_EXT, canvasToBlob, drawToCanvas, loadImage, replaceExt } from '../../lib/image'

const FORMATS = [
  { mime: 'image/png', label: 'PNG' },
  { mime: 'image/jpeg', label: 'JPG' },
  { mime: 'image/webp', label: 'WebP' },
]

export default function Convert() {
  const [files, setFiles] = useState<File[]>([])
  const [mime, setMime] = useState('image/png')
  const [quality, setQuality] = useState(0.92)
  const [results, setResults] = useState<ResultItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const lossy = mime !== 'image/png'

  const run = async () => {
    setBusy(true)
    setError('')
    setResults([])
    try {
      const out: ResultItem[] = []
      for (const file of files) {
        const img = await loadImage(file)
        const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight, {
          bg: mime === 'image/jpeg' ? '#ffffff' : undefined,
        })
        const blob = await canvasToBlob(canvas, mime, lossy ? quality : undefined)
        out.push({ name: replaceExt(file.name, MIME_EXT[mime]), blob, original: file })
      }
      setResults(out)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage title="转换图片" desc="在 PNG、JPG、WebP 格式之间互相转换，支持批量处理。也可以把 GIF、BMP 等格式的静态画面转出来。">
      <div className="panel">
        <FileDrop accept="image/*" multiple onFiles={f => setFiles(prev => [...prev, ...f])} hint="支持 PNG / JPG / WebP / GIF / BMP，可多选" />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} />
      </div>

      <div className="panel">
        <h2>转换选项</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="cv-fmt">目标格式</label>
            <select id="cv-fmt" className="input" value={mime} onChange={e => setMime(e.target.value)}>
              {FORMATS.map(f => (
                <option key={f.mime} value={f.mime}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          {lossy && (
            <div className="field">
              <label htmlFor="cv-q">质量：{Math.round(quality * 100)}%</label>
              <input
                id="cv-q"
                type="range"
                min={10}
                max={100}
                value={Math.round(quality * 100)}
                onChange={e => setQuality(Number(e.target.value) / 100)}
              />
            </div>
          )}
        </div>
        {error && <p className="msg msg-error">{error}</p>}
        <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={files.length === 0 || busy} onClick={run}>
          {busy && <span className="spinner" />}
          {busy ? '转换中…' : `开始转换（${files.length} 个文件）`}
        </button>
      </div>

      <ResultList items={results} zipName="converted.zip" />
    </ToolPage>
  )
}
