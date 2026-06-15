import { useState } from 'react'
import { BatchRunner } from '../../components/BatchRunner'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
import { ResultList } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { MIME_EXT, compressImage, replaceExt, sizeDeltaNote } from '../../lib/image'
import { useBatch } from '../../lib/useBatch'
import { usePersistedState } from '../../lib/usePersistedState'

export default function Compress() {
  const [files, setFiles] = useState<File[]>([])
  const [mime, setMime] = usePersistedState<'image/jpeg' | 'image/webp'>('compress.mime', 'image/jpeg')
  const [quality, setQuality] = usePersistedState('compress.quality', 0.75)
  const [maxEdge, setMaxEdge] = usePersistedState('compress.maxEdge', '')
  const { results, busy, done, total, error, run, cancel } = useBatch()

  const start = () =>
    run(files, async file => {
      const blob = await compressImage(file, {
        type: mime,
        quality,
        maxEdge: Number(maxEdge) > 0 ? Number(maxEdge) : undefined,
      })
      return {
        name: replaceExt(file.name, MIME_EXT[mime]),
        blob,
        original: file,
        note: sizeDeltaNote(file.size, blob.size),
      }
    })

  return (
    <ToolPage title="压缩图片" desc="通过调节编码质量与尺寸上限来减小图片体积，支持批量处理。输出 JPG 或 WebP（WebP 通常更小）。">
      <div className="panel">
        <FileDrop accept="image/*" multiple onFiles={f => setFiles(prev => [...prev, ...f])} hint="支持 PNG / JPG / WebP 等，可多选" />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} onClear={() => setFiles([])} />
      </div>

      <div className="panel">
        <h2>压缩选项</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="cp-fmt">输出格式</label>
            <select id="cp-fmt" className="input" value={mime} onChange={e => setMime(e.target.value as typeof mime)}>
              <option value="image/jpeg">JPG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="cp-edge">最长边上限（px，可选）</label>
            <input id="cp-edge" className="input" type="number" min={1} placeholder="如 1920，留空不缩放" value={maxEdge} onChange={e => setMaxEdge(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="cp-q">质量：{Math.round(quality * 100)}%</label>
          <input id="cp-q" type="range" min={5} max={100} value={Math.round(quality * 100)} onChange={e => setQuality(Number(e.target.value) / 100)} />
          <span className="help">70% - 85% 通常在体积和画质之间最平衡</span>
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

      <ResultList items={results} zipName="compressed.zip" />
    </ToolPage>
  )
}
