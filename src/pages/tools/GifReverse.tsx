import { useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { runFFmpeg } from '../../lib/ffmpeg'
import { paletteFilter } from '../../lib/gif'
import { baseName, formatBytes } from '../../lib/image'

export default function GifReverse() {
  const [file, setFile] = useState<File | null>(null)
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
      const [out] = await runFFmpeg({
        inputs: [{ name: 'input.gif', data: file }],
        args: ['-i', 'input.gif', '-vf', paletteFilter('reverse'), 'output.gif'],
        outputs: ['output.gif'],
        onProgress: setProgress,
        onStatus: setStatus,
      })
      setResults([{ name: `${baseName(file.name)}_reversed.gif`, blob: new Blob([out.data as BlobPart], { type: 'image/gif' }) }])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage title="GIF 倒放" desc="把 GIF 的帧序倒过来，生成倒放效果的动图。">
      <div className="panel">
        <FileDrop accept="image/gif" onFiles={f => { setFile(f[0]); setResults([]) }} hint="选择一个 GIF 文件" />
        {file && <p className="msg msg-info">{file.name} · {formatBytes(file.size)}</p>}
        {busy && (
          <div className="field" role="status">
            <span className="help">{status}</span>
            <div className="progress"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
          </div>
        )}
        {error && <p className="msg msg-error">{error}</p>}
        <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={!file || busy} onClick={run}>
          {busy && <span className="spinner" />}
          {busy ? '处理中…' : '生成倒放 GIF'}
        </button>
      </div>

      <ResultList items={results} />
    </ToolPage>
  )
}
