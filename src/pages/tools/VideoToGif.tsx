import { useEffect, useState } from 'react'
import { FFmpegRunner } from '../../components/FFmpegRunner'
import { FileDrop } from '../../components/FileDrop'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { runFFmpeg } from '../../lib/ffmpeg'
import { paletteFilter, safeInputName } from '../../lib/gif'
import { baseName, formatBytes } from '../../lib/image'
import { useFFmpegJob } from '../../lib/useFFmpegJob'
import { usePersistedState } from '../../lib/usePersistedState'

export default function VideoToGif() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [fps, setFps] = usePersistedState('videoToGif.fps', '10')
  const [width, setWidth] = usePersistedState('videoToGif.width', '480')
  const [results, setResults] = useState<ResultItem[]>([])
  const job = useFFmpegJob()

  useEffect(() => () => URL.revokeObjectURL(url), [url])

  const start = () => {
    if (!file) return
    setResults([])
    job.run(async () => {
      const pre = [`fps=${fps}`]
      if (Number(width) > 0) pre.push(`scale=${width}:-2:flags=lanczos`)
      const name = safeInputName(file, 'mp4')
      const [out] = await runFFmpeg({
        inputs: [{ name, data: file }],
        args: ['-i', name, '-vf', paletteFilter(pre.join(',')), 'output.gif'],
        outputs: ['output.gif'],
        onProgress: job.setProgress,
        onStatus: job.setStatus,
      })
      setResults([{ name: `${baseName(file.name)}.gif`, blob: new Blob([out.data as BlobPart], { type: 'image/gif' }) }])
    })
  }

  return (
    <ToolPage title="视频转 GIF" desc="把 MP4 / WebM / MOV 等视频整段转成 GIF 动图。只需要其中一段？用「剪辑视频转 GIF」。视频较长时转换会比较慢，建议先剪辑。">
      <div className="panel">
        <FileDrop accept="video/*" onFiles={f => { setFile(f[0]); setUrl(prev => { URL.revokeObjectURL(prev); return URL.createObjectURL(f[0]) }); setResults([]) }} hint="支持 MP4 / WebM / MOV 等" />
        {file && (
          <>
            <p className="msg msg-info">{file.name} · {formatBytes(file.size)}</p>
            <video src={url} controls style={{ maxHeight: 320, borderRadius: 'var(--radius)', marginInline: 'auto' }} />
          </>
        )}
      </div>

      <div className="panel">
        <h2>转换选项</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="vg-fps">帧率</label>
            <select id="vg-fps" className="input" value={fps} onChange={e => setFps(e.target.value)}>
              <option value="15">15 fps（流畅）</option>
              <option value="10">10 fps（推荐）</option>
              <option value="8">8 fps</option>
              <option value="5">5 fps（最小）</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="vg-w">输出宽度</label>
            <select id="vg-w" className="input" value={width} onChange={e => setWidth(e.target.value)}>
              <option value="640">640 px</option>
              <option value="480">480 px（推荐）</option>
              <option value="320">320 px</option>
              <option value="0">保持原始宽度</option>
            </select>
          </div>
        </div>
        <FFmpegRunner label="转换为 GIF" busy={job.busy} status={job.status} progress={job.progress} error={job.error} disabled={!file} onRun={start} onCancel={job.cancel} />
      </div>

      <ResultList items={results} />
    </ToolPage>
  )
}
