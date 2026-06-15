import { useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { compressJpegKeepExif } from '../../lib/exif'
import { formatBytes } from '../../lib/image'

export default function CompressExif() {
  const [files, setFiles] = useState<File[]>([])
  const [quality, setQuality] = useState(0.8)
  const [maxEdge, setMaxEdge] = useState('')
  const [results, setResults] = useState<ResultItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setBusy(true)
    setError('')
    setResults([])
    try {
      const out: ResultItem[] = []
      for (const file of files) {
        const blob = await compressJpegKeepExif(file, {
          quality,
          maxEdge: Number(maxEdge) > 0 ? Number(maxEdge) : undefined,
        })
        const saved = Math.max(0, Math.round((1 - blob.size / file.size) * 100))
        out.push({ name: file.name, blob, original: file, note: `原 ${formatBytes(file.size)} → 减小 ${saved}% · EXIF 已保留` })
      }
      setResults(out)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage
      title="压缩 JPG 并保留 EXIF"
      desc="普通压缩会丢掉照片的拍摄信息。本工具压缩后把原图的 EXIF（拍摄参数、时间、GPS）与 ICC 色彩配置按字节回写到新文件中。"
    >
      <div className="panel">
        <FileDrop
          accept="image/jpeg"
          multiple
          onFiles={f => setFiles(prev => [...prev, ...f.filter(x => x.type === 'image/jpeg')])}
          hint="仅支持 JPG / JPEG，可多选"
        />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} />
      </div>

      <div className="panel">
        <h2>压缩选项</h2>
        <div className="field">
          <label htmlFor="ce-q">质量：{Math.round(quality * 100)}%</label>
          <input id="ce-q" type="range" min={5} max={100} value={Math.round(quality * 100)} onChange={e => setQuality(Number(e.target.value) / 100)} />
        </div>
        <div className="field">
          <label htmlFor="ce-edge">最长边上限（px，可选）</label>
          <input id="ce-edge" className="input" type="number" min={1} placeholder="留空不缩放" value={maxEdge} onChange={e => setMaxEdge(e.target.value)} />
          <span className="help">缩放后 EXIF 中的方向标记会自动校正，避免看图软件二次旋转</span>
        </div>
        {error && <p className="msg msg-error">{error}</p>}
        <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={files.length === 0 || busy} onClick={run}>
          {busy && <span className="spinner" />}
          {busy ? '压缩中…' : `开始压缩（${files.length} 个文件）`}
        </button>
      </div>

      <ResultList items={results} zipName="compressed-exif.zip" />
    </ToolPage>
  )
}
