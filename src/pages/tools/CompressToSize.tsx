import { useState } from 'react'
import { BatchRunner } from '../../components/BatchRunner'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
import { ResultList } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { MIME_EXT, compressToTarget, formatBytes, replaceExt } from '../../lib/image'
import { useBatch } from '../../lib/useBatch'
import { usePersistedState } from '../../lib/usePersistedState'

export default function CompressToSize() {
  const [files, setFiles] = useState<File[]>([])
  const [targetKb, setTargetKb] = usePersistedState('toSize.targetKb', '200')
  const [mime, setMime] = usePersistedState<'image/jpeg' | 'image/webp'>('toSize.mime', 'image/jpeg')
  const { results, busy, done, total, error, run, cancel, setError } = useBatch()

  const start = () => {
    const kb = Number(targetKb)
    if (!kb || kb <= 0) {
      setError('请输入有效的目标大小（KB）')
      return
    }
    run(files, async file => {
      const { blob, quality, scale } = await compressToTarget(file, kb * 1024, mime)
      const hit = blob.size <= kb * 1024
      const parts = [`原 ${formatBytes(file.size)}`, `质量 ${Math.round(quality * 100)}%`]
      if (scale < 1) parts.push(`缩放 ${Math.round(scale * 100)}%`)
      if (!hit) parts.push('已尽力压缩，仍略超目标')
      return { name: replaceExt(file.name, MIME_EXT[mime]), blob, original: file, note: parts.join(' · ') }
    })
  }

  return (
    <ToolPage
      title="压缩图片到指定大小"
      desc="输入目标大小（如证件照要求的 200KB），自动搜索合适的压缩质量；质量降到下限仍超标时会逐级缩小尺寸，直到满足为止。"
    >
      <div className="panel">
        <FileDrop accept="image/*" multiple onFiles={f => setFiles(prev => [...prev, ...f])} hint="可多选" />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} onClear={() => setFiles([])} />
      </div>

      <div className="panel">
        <h2>目标设置</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="cs-kb">目标大小（KB）</label>
            <input id="cs-kb" className="input" type="number" min={1} value={targetKb} onChange={e => setTargetKb(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="cs-fmt">输出格式</label>
            <select id="cs-fmt" className="input" value={mime} onChange={e => setMime(e.target.value as typeof mime)}>
              <option value="image/jpeg">JPG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
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

      <ResultList items={results} zipName="compressed-to-size.zip" />
    </ToolPage>
  )
}
