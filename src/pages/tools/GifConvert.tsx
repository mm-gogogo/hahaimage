import { useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { runFFmpeg } from '../../lib/ffmpeg'
import { baseName, formatBytes } from '../../lib/image'

type Target = 'webp' | 'apng'

export default function GifConvert() {
  const [file, setFile] = useState<File | null>(null)
  const [target, setTarget] = useState<Target>('webp')
  const [quality, setQuality] = useState(80)
  const [results, setResults] = useState<ResultItem[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const run = async () => {
    if (!file) return
    setBusy(true)
    setError('')
    setResults([])
    setProgress(0)
    try {
      const args =
        target === 'webp'
          ? ['-i', 'input.gif', '-loop', '0', '-quality', String(quality), 'output.webp']
          : ['-i', 'input.gif', '-f', 'apng', '-plays', '0', 'output.apng']
      const outName = target === 'webp' ? 'output.webp' : 'output.apng'
      const [out] = await runFFmpeg({
        inputs: [{ name: 'input.gif', data: file }],
        args,
        outputs: [outName],
        onProgress: setProgress,
        onStatus: setStatus,
      })
      const mime = target === 'webp' ? 'image/webp' : 'image/png'
      const ext = target === 'webp' ? 'webp' : 'png'
      const blob = new Blob([out.data as BlobPart], { type: mime })
      const saved = Math.round((1 - blob.size / file.size) * 100)
      setResults([
        {
          name: `${baseName(file.name)}.${ext}`,
          blob,
          note: saved > 0 ? `原 ${formatBytes(file.size)} → 减小 ${saved}%` : `原 ${formatBytes(file.size)}`,
        },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage
      title="GIF 转 WebP / APNG"
      desc="把 GIF 转成动态 WebP（体积通常小很多）或 APNG（无损、支持半透明）。两种格式所有现代浏览器都支持。"
    >
      <div className="panel">
        <FileDrop accept="image/gif" onFiles={f => { setFile(f[0]); setResults([]) }} hint="选择一个 GIF 文件" />
        {file && <p className="msg msg-info">{file.name} · {formatBytes(file.size)}</p>}
      </div>

      <div className="panel">
        <h2>转换选项</h2>
        <div className="seg" role="group" aria-label="目标格式">
          <button aria-pressed={target === 'webp'} onClick={() => setTarget('webp')}>
            动态 WebP
          </button>
          <button aria-pressed={target === 'apng'} onClick={() => setTarget('apng')}>
            APNG
          </button>
        </div>
        {target === 'webp' && (
          <div className="field">
            <label htmlFor="gv-q">质量：{quality}</label>
            <input id="gv-q" type="range" min={10} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))} />
          </div>
        )}
        {busy && (
          <div className="field" role="status">
            <span className="help">{status}</span>
            <div className="progress"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
          </div>
        )}
        {error && <p className="msg msg-error">{error}</p>}
        <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={!file || busy} onClick={run}>
          {busy && <span className="spinner" />}
          {busy ? '转换中…' : `转换为 ${target === 'webp' ? 'WebP' : 'APNG'}`}
        </button>
      </div>

      <ResultList items={results} />
    </ToolPage>
  )
}
