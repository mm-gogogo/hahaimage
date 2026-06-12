import { useEffect, useMemo } from 'react'
import { downloadBlob, downloadZip } from '../lib/download'
import { formatBytes } from '../lib/image'
import { Icon } from './Icon'

export interface ResultItem {
  name: string
  blob: Blob
  /** 附加说明，如压缩前后大小对比 */
  note?: string
}

export function ResultList({ items, zipName = 'hahaimage.zip' }: { items: ResultItem[]; zipName?: string }) {
  const urls = useMemo(() => items.map(it => URL.createObjectURL(it.blob)), [items])
  useEffect(
    () => () => {
      for (const u of urls) URL.revokeObjectURL(u)
    },
    [urls],
  )

  if (items.length === 0) return null
  return (
    <div className="panel" aria-live="polite">
      <h2>处理结果（{items.length} 个文件）</h2>
      <div className="result-list">
        {items.map((it, i) => (
          <div className="result-item" key={`${it.name}-${i}`}>
            {it.blob.type.startsWith('video/') ? (
              <video className="thumb" src={urls[i]} muted />
            ) : (
              <a href={urls[i]} target="_blank" rel="noreferrer" aria-label={`新窗口预览 ${it.name}`} style={{ flex: 'none' }}>
                <img className="thumb" src={urls[i]} alt={it.name} loading="lazy" />
              </a>
            )}
            <div className="result-meta">
              <span className="name">{it.name}</span>
              <span className="note">
                {formatBytes(it.blob.size)}
                {it.note ? ` · ${it.note}` : ''}
              </span>
            </div>
            <button className="btn btn-sm" onClick={() => downloadBlob(it.blob, it.name)}>
              <Icon name="download" size={16} />
              下载
            </button>
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <button
          className="btn btn-primary"
          onClick={() => downloadZip(items.map(it => ({ name: it.name, data: it.blob })), zipName)}
        >
          <Icon name="zip" size={18} />
          全部打包下载 ZIP
        </button>
      )}
    </div>
  )
}
