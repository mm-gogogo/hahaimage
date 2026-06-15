import { useEffect, useMemo, useState } from 'react'
import { downloadBlob, downloadZip } from '../lib/download'
import { formatBytes } from '../lib/image'
import { BeforeAfter } from './BeforeAfter'
import { Icon } from './Icon'

export interface ResultItem {
  name: string
  blob: Blob
  /** 附加说明，如压缩前后大小对比 */
  note?: string
  /** 可选原图，提供后结果支持前后对比滑块 */
  original?: Blob
}

function ResultRow({ item, index }: { item: ResultItem; index: number }) {
  const url = useMemo(() => URL.createObjectURL(item.blob), [item.blob])
  const originalUrl = useMemo(
    () => (item.original ? URL.createObjectURL(item.original) : null),
    [item.original],
  )
  const [compare, setCompare] = useState(false)
  useEffect(
    () => () => {
      URL.revokeObjectURL(url)
      if (originalUrl) URL.revokeObjectURL(originalUrl)
    },
    [url, originalUrl],
  )
  const [downloaded, setDownloaded] = useState(false)
  const isVideo = item.blob.type.startsWith('video/')
  const canCompare = !!originalUrl && !isVideo

  const handleDownload = () => {
    downloadBlob(item.blob, item.name)
    setDownloaded(true)
    window.setTimeout(() => setDownloaded(false), 1800)
  }

  return (
    <div className="result-item" style={{ '--ri': index } as React.CSSProperties}>
      {isVideo ? (
        <video className="thumb" src={url} muted />
      ) : (
        <a href={url} target="_blank" rel="noreferrer" aria-label={`新窗口预览 ${item.name}`} style={{ flex: 'none' }}>
          <img className="thumb" src={url} alt={item.name} loading="lazy" />
        </a>
      )}
      <div className="result-meta">
        <span className="name">{item.name}</span>
        <span className="note">
          {formatBytes(item.blob.size)}
          {item.note ? ` · ${item.note}` : ''}
        </span>
      </div>
      {canCompare && (
        <button
          className={`btn btn-sm${compare ? ' is-active-toggle' : ''}`}
          aria-pressed={compare}
          onClick={() => setCompare(c => !c)}
        >
          <Icon name="image" size={15} />
          对比
        </button>
      )}
      <button className={`btn btn-sm${downloaded ? ' is-success' : ''}`} onClick={handleDownload}>
        <Icon name={downloaded ? 'check' : 'download'} size={16} />
        {downloaded ? '已下载' : '下载'}
      </button>
      {canCompare && compare && (
        <div className="result-compare">
          <BeforeAfter before={originalUrl!} after={url} />
        </div>
      )}
    </div>
  )
}

export function ResultList({ items, zipName = 'hahaimage.zip' }: { items: ResultItem[]; zipName?: string }) {
  if (items.length === 0) return null
  return (
    <div className="panel" aria-live="polite">
      <h2>处理结果（{items.length} 个文件）</h2>
      <div className="result-list">
        {items.map((it, i) => (
          <ResultRow key={`${it.name}-${i}`} item={it} index={i} />
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
