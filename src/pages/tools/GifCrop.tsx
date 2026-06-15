import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { CropSelector, type CropRect } from '../../components/CropSelector'
import { FileDrop } from '../../components/FileDrop'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { runFFmpeg } from '../../lib/ffmpeg'
import { paletteFilter } from '../../lib/gif'
import { baseName, loadImage } from '../../lib/image'
import { useFFmpegJob } from '../../lib/useFFmpegJob'

export default function GifCrop() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [rect, setRect] = useState<CropRect>({ x: 0, y: 0, w: 100, h: 100 })
  const [results, setResults] = useState<ResultItem[]>([])
  const job = useFFmpegJob()

  useEffect(() => () => URL.revokeObjectURL(url), [url])

  const pick = async (files: File[]) => {
    const f = files[0]
    const img = await loadImage(f)
    setFile(f)
    setUrl(prev => {
      URL.revokeObjectURL(prev)
      return URL.createObjectURL(f)
    })
    const w = img.naturalWidth
    const h = img.naturalHeight
    setSize({ w, h })
    setRect({ x: Math.round(w * 0.1), y: Math.round(h * 0.1), w: Math.round(w * 0.8), h: Math.round(h * 0.8) })
    setResults([])
  }

  const start = () => {
    if (!file) return
    setResults([])
    job.run(async () => {
      const [out] = await runFFmpeg({
        inputs: [{ name: 'input.gif', data: file }],
        args: [
          '-i', 'input.gif',
          '-vf', paletteFilter(`crop=${rect.w}:${rect.h}:${rect.x}:${rect.y}`),
          'output.gif',
        ],
        outputs: ['output.gif'],
        onProgress: job.setProgress,
        onStatus: job.setStatus,
      })
      setResults([{ name: `${baseName(file.name)}_cropped.gif`, blob: new Blob([out.data as BlobPart], { type: 'image/gif' }), note: `${rect.w} × ${rect.h}` }])
    })
  }

  return (
    <ToolPage title="GIF 裁剪" desc="在动图预览上拖拽框选保留区域，裁剪后所有帧同步处理，动画保持不变。">
      {!file ? (
        <div className="panel">
          <FileDrop accept="image/gif" onFiles={pick} hint="选择一个 GIF 文件" />
        </div>
      ) : (
        <>
          <div className="panel">
            {size && (
              <CropSelector src={url} naturalWidth={size.w} naturalHeight={size.h} value={rect} onChange={setRect} />
            )}
            <p className="help" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
              选区 {rect.w} × {rect.h} @ ({rect.x}, {rect.y})
            </p>
            {job.busy && (
              <div className="field" role="status">
                <span className="help">{job.status || '裁剪中…'}</span>
                <div className="progress"><i style={{ width: `${Math.round(job.progress * 100)}%` }} /></div>
              </div>
            )}
            {job.error && <p className="msg msg-error">{job.error}</p>}
            <div className="row">
              <button className={`btn btn-primary${job.busy ? ' is-loading' : ''}`} disabled={job.busy} onClick={start}>
                {job.busy && <span className="spinner" />}
                {job.busy ? '裁剪中…' : '裁剪'}
              </button>
              {job.busy ? (
                <button className="btn" onClick={job.cancel}>
                  <Icon name="x" size={16} />
                  取消
                </button>
              ) : (
                <button className="btn" onClick={() => setFile(null)}>
                  换一个 GIF
                </button>
              )}
            </div>
          </div>
          <ResultList items={results} />
        </>
      )}
    </ToolPage>
  )
}
