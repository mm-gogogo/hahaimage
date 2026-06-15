import { useEffect, useState } from 'react'
import { Icon } from './Icon'

/**
 * 全局拖拽提示覆盖层：用户把文件拖到窗口任意位置时弹出，
 * 引导其松手投放（实际接收仍由各工具页的 FileDrop 处理）。
 * 纯视觉提示，不拦截 drop——覆盖层 pointer-events 关闭，文件落到下方真正的 dropzone。
 */
export function DropOverlay() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    let depth = 0
    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes('Files')

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth++
      setActive(true)
    }
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setActive(false)
    }
    const onDrop = () => {
      depth = 0
      setActive(false)
    }
    const onDragOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault()
    }

    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('drop', onDrop)
    window.addEventListener('dragover', onDragOver)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('dragover', onDragOver)
    }
  }, [])

  if (!active) return null
  return (
    <div className="drop-overlay" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <div className="drop-overlay-inner">
        <span className="dz-icon">
          <Icon name="upload" size={40} />
        </span>
        松开即可在此页面处理
        <small>文件不会上传，全部在本地完成</small>
      </div>
    </div>
  )
}
