import { useState } from 'react'
import { FFmpegRunner } from '../../components/FFmpegRunner'
import { FileDrop } from '../../components/FileDrop'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { runFFmpeg } from '../../lib/ffmpeg'
import { baseName, formatBytes } from '../../lib/image'
import { useFFmpegJob } from '../../lib/useFFmpegJob'

export default function GifExtract() {
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<ResultItem[]>([])
  const job = useFFmpegJob()

  const start = () => {
    if (!file) return
    setResults([])
    job.run(async () => {
      const outs = await runFFmpeg({
        inputs: [{ name: 'input.gif', data: file }],
        args: ['-i', 'input.gif', 'frame_%04d.png'],
        outputPattern: /^frame_\d+\.png$/,
        onProgress: job.setProgress,
        onStatus: job.setStatus,
      })
      const prefix = baseName(file.name)
      setResults(
        outs.map((o, i) => ({
          name: `${prefix}_${String(i + 1).padStart(4, '0')}.png`,
          blob: new Blob([o.data as BlobPart], { type: 'image/png' }),
        })),
      )
    })
  }

  return (
    <ToolPage title="提取 GIF 帧" desc="把 GIF 的每一帧导出为独立的 PNG 图片，可单张下载或打包下载 ZIP。">
      <div className="panel">
        <FileDrop accept="image/gif" onFiles={f => { setFile(f[0]); setResults([]) }} hint="选择一个 GIF 文件" />
        {file && <p className="msg msg-info">{file.name} · {formatBytes(file.size)}</p>}
        <FFmpegRunner label="提取全部帧" busy={job.busy} status={job.status} progress={job.progress} error={job.error} disabled={!file} onRun={start} onCancel={job.cancel} />
      </div>

      <ResultList items={results} zipName="frames.zip" />
    </ToolPage>
  )
}
