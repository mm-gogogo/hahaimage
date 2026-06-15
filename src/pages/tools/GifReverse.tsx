import { useState } from 'react'
import { FFmpegRunner } from '../../components/FFmpegRunner'
import { FileDrop } from '../../components/FileDrop'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { runFFmpeg } from '../../lib/ffmpeg'
import { paletteFilter } from '../../lib/gif'
import { baseName, formatBytes } from '../../lib/image'
import { useFFmpegJob } from '../../lib/useFFmpegJob'

export default function GifReverse() {
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<ResultItem[]>([])
  const job = useFFmpegJob()

  const start = () => {
    if (!file) return
    setResults([])
    job.run(async () => {
      const [out] = await runFFmpeg({
        inputs: [{ name: 'input.gif', data: file }],
        args: ['-i', 'input.gif', '-vf', paletteFilter('reverse'), 'output.gif'],
        outputs: ['output.gif'],
        onProgress: job.setProgress,
        onStatus: job.setStatus,
      })
      setResults([{ name: `${baseName(file.name)}_reversed.gif`, blob: new Blob([out.data as BlobPart], { type: 'image/gif' }) }])
    })
  }

  return (
    <ToolPage title="GIF 倒放" desc="把 GIF 的帧序倒过来，生成倒放效果的动图。">
      <div className="panel">
        <FileDrop accept="image/gif" onFiles={f => { setFile(f[0]); setResults([]) }} hint="选择一个 GIF 文件" />
        {file && <p className="msg msg-info">{file.name} · {formatBytes(file.size)}</p>}
        <FFmpegRunner label="生成倒放 GIF" busy={job.busy} status={job.status} progress={job.progress} error={job.error} disabled={!file} onRun={start} onCancel={job.cancel} />
      </div>

      <ResultList items={results} />
    </ToolPage>
  )
}
