import { useState } from 'react'
import { BatchRunner } from '../../components/BatchRunner'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
import { ResultList } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { compressJpegKeepExif } from '../../lib/exif'
import { sizeDeltaNote } from '../../lib/image'
import { useBatch } from '../../lib/useBatch'
import { usePersistedState } from '../../lib/usePersistedState'

export default function CompressExif() {
  const [files, setFiles] = useState<File[]>([])
  const [quality, setQuality] = usePersistedState('compressExif.quality', 0.8)
  const [maxEdge, setMaxEdge] = usePersistedState('compressExif.maxEdge', '')
  const { results, busy, done, total, error, run, cancel } = useBatch()

  const start = () =>
    run(files, async file => {
      const blob = await compressJpegKeepExif(file, {
        quality,
        maxEdge: Number(maxEdge) > 0 ? Number(maxEdge) : undefined,
      })
      return { name: file.name, blob, original: file, note: `${sizeDeltaNote(file.size, blob.size)} · EXIF 已保留` }
    })

  return (
    <ToolPage
      title="压缩 JPG 并保留 EXIF"
      desc="普通压缩会丢掉照片的拍摄信息。本工具压缩后把原图的 EXIF（拍摄参数、时间、GPS）与 ICC 色彩配置按字节回写到新文件中。"
    >
      <div className="panel">
        <FileDrop
          accept="image/jpeg"
          multiple
          onFiles={f => setFiles(prev => [...prev, ...f.filter(x => x.type === 'image/jpeg')])}
          hint="仅支持 JPG / JPEG，可多选"
        />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} onClear={() => setFiles([])} />
      </div>

      <div className="panel">
        <h2>压缩选项</h2>
        <div className="field">
          <label htmlFor="ce-q">质量：{Math.round(quality * 100)}%</label>
          <input id="ce-q" type="range" min={5} max={100} value={Math.round(quality * 100)} onChange={e => setQuality(Number(e.target.value) / 100)} />
        </div>
        <div className="field">
          <label htmlFor="ce-edge">最长边上限（px，可选）</label>
          <input id="ce-edge" className="input" type="number" min={1} placeholder="留空不缩放" value={maxEdge} onChange={e => setMaxEdge(e.target.value)} />
          <span className="help">缩放后 EXIF 中的方向标记会自动校正，避免看图软件二次旋转</span>
        </div>
        <BatchRunner
          label={`开始压缩（${files.length} 个文件）`}
          busy={busy}
          done={done}
          total={total}
          error={error}
          disabled={files.length === 0}
          onRun={start}
          onCancel={cancel}
        />
      </div>

      <ResultList items={results} zipName="compressed-exif.zip" />
    </ToolPage>
  )
}
