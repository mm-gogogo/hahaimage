import { useEffect, useRef, useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { runFFmpeg } from '../../lib/ffmpeg'
import { paletteFilter, safeInputName } from '../../lib/gif'
import { baseName, formatBytes } from '../../lib/image'

export default function VideoClipGif() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [start, setStart] = useState('0')
  const [end, setEnd] = useState('3')
  const [fps, setFps] = useState('10')
  const [width, setWidth] = useState('480')
  const [results, setResults] = useState<ResultItem[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => () => URL.revokeObjectURL(url), [url])

  const grabTime = (setter: (v: string) => void) => {
    const t = videoRef.current?.currentTime ?? 0
    setter(t.toFixed(1))
  }

  const run = async () => {
    if (!file) return
    const s = Number(start)
    const e = Number(end)
    if (!(e > s)) {
      setError('结束时间必须大于开始时间')
      return
    }
    setBusy(true)
    setError('')
    setResults([])
    setProgress(0)
    try {
      const pre = [`fps=${fps}`]
      if (Number(width) > 0) pre.push(`scale=${width}:-2:flags=lanczos`)
      const name = safeInputName(file, 'mp4')
      const [out] = await runFFmpeg({
        inputs: [{ name, data: file }],
        args: [
          '-ss', String(s),
          '-i', name,
          '-t', String(e - s),
          '-vf', paletteFilter(pre.join(',')),
          'output.gif',
        ],
        outputs: ['output.gif'],
        onProgress: setProgress,
        onStatus: setStatus,
      })
      setResults([
        {
          name: `${baseName(file.name)}_${s}s-${e}s.gif`,
          blob: new Blob([out.data as BlobPart], { type: 'image/gif' }),
          note: `${(e - s).toFixed(1)} 秒片段`,
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage title="剪辑视频转 GIF" desc="先在播放器里找到想要的片段，设置开始和结束时间，只把这一段转成 GIF。">
      <div className="panel">
        <FileDrop accept="video/*" onFiles={f => { setFile(f[0]); setUrl(prev => { URL.revokeObjectURL(prev); return URL.createObjectURL(f[0]) }); setResults([]) }} hint="支持 MP4 / WebM / MOV 等" />
        {file && (
          <>
            <p className="msg msg-info">{file.name} · {formatBytes(file.size)}</p>
            <video ref={videoRef} src={url} controls style={{ maxHeight: 320, borderRadius: 'var(--radius)', marginInline: 'auto' }} />
          </>
        )}
      </div>

      <div className="panel">
        <h2>剪辑范围（秒）</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="vc-s">开始时间</label>
            <div className="row">
              <input id="vc-s" className="input" type="number" min={0} step={0.1} value={start} onChange={e => setStart(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-sm" onClick={() => grabTime(setStart)} disabled={!file}>
                取当前播放位置
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="vc-e">结束时间</label>
            <div className="row">
              <input id="vc-e" className="input" type="number" min={0} step={0.1} value={end} onChange={e => setEnd(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-sm" onClick={() => grabTime(setEnd)} disabled={!file}>
                取当前播放位置
              </button>
            </div>
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="vc-fps">帧率</label>
            <select id="vc-fps" className="input" value={fps} onChange={e => setFps(e.target.value)}>
              <option value="15">15 fps（流畅）</option>
              <option value="10">10 fps（推荐）</option>
              <option value="8">8 fps</option>
              <option value="5">5 fps（最小）</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="vc-w">输出宽度</label>
            <select id="vc-w" className="input" value={width} onChange={e => setWidth(e.target.value)}>
              <option value="640">640 px</option>
              <option value="480">480 px（推荐）</option>
              <option value="320">320 px</option>
              <option value="0">保持原始宽度</option>
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
          {busy ? '转换中…' : '剪辑并转换为 GIF'}
        </button>
      </div>

      <ResultList items={results} />
    </ToolPage>
  )
}
