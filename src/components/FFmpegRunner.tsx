import { Icon } from './Icon'

/**
 * ffmpeg 单任务操作区：主按钮 + 状态文案 + 进度条 + 取消按钮。
 * 配合 useFFmpegJob，给所有 GIF/视频工具一致的"可见进度 + 可中止"体验。
 */
export function FFmpegRunner({
  label,
  busy,
  status,
  progress,
  error,
  disabled,
  onRun,
  onCancel,
}: {
  label: string
  busy: boolean
  status: string
  progress: number
  error?: string
  disabled?: boolean
  onRun: () => void
  onCancel: () => void
}) {
  return (
    <>
      {busy && (
        <div className="field" role="status">
          <span className="help">{status || '处理中…'}</span>
          <div className="progress">
            <i style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}
      {error && <p className="msg msg-error">{error}</p>}
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
