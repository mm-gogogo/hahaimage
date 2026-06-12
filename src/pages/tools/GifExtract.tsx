import { useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { runFFmpeg } from '../../lib/ffmpeg'
import { baseName, formatBytes } from '../../lib/image'

export default function GifExtract() {
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
      const outs = await runFFmpeg({
        inputs: [{ name: 'input.gif', data: file }],
        args: ['-i', 'input.gif', 'frame_%04d.png'],
        outputPattern: /^frame_\d+\.png$/,
        onProgress: setProgress,
        onStatus: setStatus,
      })
      const prefix = baseName(file.name)
      setResults(
        outs.map((o, i) => ({
          name: `${prefix}_${String(i + 1).padStart(4, '0')}.png`,
          blob: new Blob([o.data as BlobPart], { type: 'image/png' }),
        })),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage title="提取 GIF 帧" desc="把 GIF 的每一帧导出为独立的 PNG 图片，可单张下载或打包下载 ZIP。">
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
          {busy ? '提取中…' : '提取全部帧'}
        </button>
      </div>

      <ResultList items={results} zipName="frames.zip" />
    </ToolPage>
  )
}
