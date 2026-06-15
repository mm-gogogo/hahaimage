import { useState } from 'react'
import { FFmpegRunner } from '../../components/FFmpegRunner'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { runFFmpeg } from '../../lib/ffmpeg'
import { loadImage } from '../../lib/image'
import { useFFmpegJob } from '../../lib/useFFmpegJob'

export default function GifMerge() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<ResultItem[]>([])
  const job = useFFmpegJob()

  const move = (i: number, dir: -1 | 1) => {
    const next = [...files]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    setFiles(next)
  }

  const start = () => {
    setResults([])
    job.run(async () => {
      // 以第一个 GIF 的尺寸为基准，其余等比缩放并补边居中
      const first = await loadImage(files[0])
      const W = first.naturalWidth
      const H = first.naturalHeight

      const inputs = files.map((f, i) => ({ name: `in${i}.gif`, data: f as Blob }))
      const inputArgs = inputs.flatMap(inp => ['-i', inp.name])
      const scaleParts = files.map(
        (_, i) =>
          `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=white[v${i}]`,
      )
      const concatInputs = files.map((_, i) => `[v${i}]`).join('')
      const filter = [
        ...scaleParts,
        `${concatInputs}concat=n=${files.length}:v=1:a=0[cc]`,
        '[cc]split[a][b]',
        '[a]palettegen[p]',
        '[b][p]paletteuse=dither=bayer:bayer_scale=5[out]',
      ].join(';')

      const [out] = await runFFmpeg({
        inputs,
        args: [...inputArgs, '-filter_complex', filter, '-map', '[out]', 'output.gif'],
        outputs: ['output.gif'],
        onProgress: job.setProgress,
        onStatus: job.setStatus,
      })
      setResults([{ name: 'merged.gif', blob: new Blob([out.data as BlobPart], { type: 'image/gif' }), note: `${files.length} 个 GIF 已合并` }])
    })
  }

  return (
    <ToolPage title="GIF 合并" desc="把多个 GIF 按顺序首尾相接合成一个。尺寸不同的会以第一个为基准等比缩放并居中补边。">
      <div className="panel">
        <FileDrop accept="image/gif" multiple onFiles={f => setFiles(prev => [...prev, ...f])} hint="按顺序播放，可用箭头调整顺序" />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} onClear={() => setFiles([])} onMove={move} />
        <FFmpegRunner label={`合并 ${files.length} 个 GIF`} busy={job.busy} status={job.status} progress={job.progress} error={job.error} disabled={files.length < 2} onRun={start} onCancel={job.cancel} />
      </div>

      <ResultList items={results} />
    </ToolPage>
  )
}
