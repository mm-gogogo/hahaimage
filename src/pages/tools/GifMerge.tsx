import { useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { runFFmpeg } from '../../lib/ffmpeg'
import { loadImage } from '../../lib/image'

export default function GifMerge() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<ResultItem[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const move = (i: number, dir: -1 | 1) => {
    const next = [...files]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    setFiles(next)
  }

  const run = async () => {
    setBusy(true)
    setError('')
    setResults([])
    setProgress(0)
    try {
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
        onProgress: setProgress,
        onStatus: setStatus,
      })
      setResults([{ name: 'merged.gif', blob: new Blob([out.data as BlobPart], { type: 'image/gif' }), note: `${files.length} 个 GIF 已合并` }])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage title="GIF 合并" desc="把多个 GIF 按顺序首尾相接合成一个。尺寸不同的会以第一个为基准等比缩放并居中补边。">
      <div className="panel">
        <FileDrop accept="image/gif" multiple onFiles={f => setFiles(prev => [...prev, ...f])} hint="按顺序播放，可用箭头调整顺序" />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} onMove={move} />
        {busy && (
          <div className="field" role="status">
            <span className="help">{status}</span>
            <div className="progress"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
          </div>
        )}
        {error && <p className="msg msg-error">{error}</p>}
        <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={files.length < 2 || busy} onClick={run}>
          {busy && <span className="spinner" />}
          {busy ? '合并中…' : `合并 ${files.length} 个 GIF`}
        </button>
      </div>

      <ResultList items={results} />
    </ToolPage>
  )
}
