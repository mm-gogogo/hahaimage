import { useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { runFFmpeg } from '../../lib/ffmpeg'
import { paletteFilter } from '../../lib/gif'
import { baseName, formatBytes } from '../../lib/image'

export default function GifCompress() {
  const [file, setFile] = useState<File | null>(null)
  const [fps, setFps] = useState('0')
  const [scale, setScale] = useState('100')
  const [colors, setColors] = useState('128')
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
      const pre: string[] = []
      if (Number(fps) > 0) pre.push(`fps=${fps}`)
      if (Number(scale) < 100) pre.push(`scale=iw*${Number(scale) / 100}:-1:flags=lanczos`)
      const [out] = await runFFmpeg({
        inputs: [{ name: 'input.gif', data: file }],
        args: ['-i', 'input.gif', '-vf', paletteFilter(pre.join(','), Number(colors)), 'output.gif'],
        outputs: ['output.gif'],
        onProgress: setProgress,
        onStatus: setStatus,
      })
      const blob = new Blob([out.data as BlobPart], { type: 'image/gif' })
      const saved = Math.max(0, Math.round((1 - blob.size / file.size) * 100))
      setResults([{ name: `${baseName(file.name)}_compressed.gif`, blob, note: `原 ${formatBytes(file.size)} → 减小 ${saved}%` }])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage title="GIF 压缩" desc="通过降低帧率、缩小尺寸、减少颜色数来压缩 GIF 体积，使用两段式调色板保证画质。">
      <div className="panel">
        <FileDrop accept="image/gif" onFiles={f => { setFile(f[0]); setResults([]) }} hint="选择一个 GIF 文件" />
        {file && <p className="msg msg-info">{file.name} · {formatBytes(file.size)}</p>}
      </div>

      <div className="panel">
        <h2>压缩选项</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="gc-fps">帧率</label>
            <select id="gc-fps" className="input" value={fps} onChange={e => setFps(e.target.value)}>
              <option value="0">保持原帧率</option>
              <option value="15">15 fps</option>
              <option value="10">10 fps</option>
              <option value="8">8 fps</option>
              <option value="5">5 fps</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="gc-scale">尺寸</label>
            <select id="gc-scale" className="input" value={scale} onChange={e => setScale(e.target.value)}>
              <option value="100">保持原尺寸</option>
              <option value="75">缩小到 75%</option>
              <option value="50">缩小到 50%</option>
              <option value="30">缩小到 30%</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="gc-colors">颜色数</label>
            <select id="gc-colors" className="input" value={colors} onChange={e => setColors(e.target.value)}>
              <option value="256">256 色（最好）</option>
              <option value="128">128 色（推荐）</option>
              <option value="64">64 色</option>
              <option value="32">32 色（最小）</option>
            </select>
          </div>
        </div>
        {busy && (
          <div className="field" role="status">
            <span className="help">{status}</span>
            <div className="progress"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
          </div>
        )}
        {error && <p className="msg msg-error">{error}</p>}
        <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={!file || busy} onClick={run}>
          {busy && <span className="spinner" />}
          {busy ? '压缩中…' : '开始压缩'}
        </button>
      </div>

      <ResultList items={results} />
    </ToolPage>
  )
}
