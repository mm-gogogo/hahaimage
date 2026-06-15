import { Icon } from './Icon'

/**
 * 批量处理的统一操作区：主按钮 + 处理中进度条 + 取消按钮。
 * 配合 useBatch 使用，让所有批量工具拥有一致的"实时进度 + 可取消"体验。
 */
export function BatchRunner({
  label,
  busy,
  done,
  total,
  disabled,
  error,
  onRun,
  onCancel,
}: {
  label: string
  busy: boolean
  done: number
  total: number
  disabled?: boolean
  error?: string
  onRun: () => void
  onCancel: () => void
}) {
  return (
    <>
      {error && <p className="msg msg-error">{error}</p>}
      {busy && total > 1 && (
        <div className="field" role="status">
          <span className="help">
            处理中 {done} / {total}
          </span>
          <div className="progress">
            <i style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        </div>
      )}
      <div className="row">
        <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={disabled || busy} onClick={onRun} style={{ flex: 1 }}>
          {busy && <span className="spinner" />}
          {busy ? '处理中…' : label}
        </button>
        {busy && (
          <button className="btn" onClick={onCancel}>
            <Icon name="x" size={16} />
            取消
          </button>
        )}
      </div>
    </>
  )
}
