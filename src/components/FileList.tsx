import { formatBytes } from '../lib/image'
import { Icon } from './Icon'

interface Props {
  files: File[]
  onRemove: (index: number) => void
  /** 传入则显示"清空全部" */
  onClear?: () => void
  /** 传入则显示上移/下移按钮（拼接、合并等顺序敏感的工具） */
  onMove?: (index: number, dir: -1 | 1) => void
}

export function FileList({ files, onRemove, onClear, onMove }: Props) {
  if (files.length === 0) return null
  const total = files.reduce((s, f) => s + f.size, 0)
  return (
    <div className="file-list">
      <div className="file-list-head">
        <span className="file-list-count">
          已选 {files.length} 个文件 · 共 {formatBytes(total)}
        </span>
        {onClear && (
          <button className="btn btn-sm" onClick={onClear}>
            <Icon name="x" size={14} />
            清空
          </button>
        )}
      </div>
      <div className="result-list">
        {files.map((f, i) => (
          <div className="file-item" key={`${f.name}-${i}`}>
            <div className="result-meta">
              <span className="name">
                {onMove ? `${i + 1}. ` : ''}
                {f.name}
              </span>
              <span className="note">{formatBytes(f.size)}</span>
            </div>
            {onMove && (
              <>
                <button
                  className="btn btn-sm btn-icon"
                  aria-label={`上移 ${f.name}`}
                  disabled={i === 0}
                  onClick={() => onMove(i, -1)}
                >
                  <Icon name="arrow-up" size={15} />
                </button>
                <button
                  className="btn btn-sm btn-icon"
                  aria-label={`下移 ${f.name}`}
                  disabled={i === files.length - 1}
                  onClick={() => onMove(i, 1)}
                >
                  <Icon name="arrow-down" size={15} />
                </button>
              </>
            )}
            <button className="btn btn-sm btn-icon" aria-label={`移除 ${f.name}`} onClick={() => onRemove(i)}>
              <Icon name="x" size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
