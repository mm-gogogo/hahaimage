import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

interface FileDropProps {
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  label?: string
  hint?: string
  compact?: boolean
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true
  return accept.split(',').some(token => {
    const t = token.trim().toLowerCase()
    if (!t) return false
    if (t.endsWith('/*')) return file.type.startsWith(t.slice(0, -1))
    if (t.startsWith('.')) return file.name.toLowerCase().endsWith(t)
    return file.type === t
  })
}

export function FileDrop({ accept, multiple, onFiles, label, hint, compact }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const handleFiles = (list: FileList | File[] | null) => {
    if (!list || list.length === 0) return
    const files = Array.from(list)
    onFiles(multiple ? files : [files[0]])
  }

  // 全局 Ctrl+V 粘贴上传（compact 模式的次要选择器不抢粘贴，避免一页多处冲突）
  useEffect(() => {
    if (compact) return
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter(f => matchesAccept(f, accept))
      if (files.length > 0) {
        e.preventDefault()
        handleFiles(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  })

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label ?? '选择或拖入文件'}
      className={`dropzone${compact ? ' dropzone-compact' : ''}${drag ? ' is-drag' : ''}`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={e => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => {
        e.preventDefault()
        setDrag(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <span className="dz-icon">
        <Icon name="upload" size={compact ? 20 : 28} />
      </span>
      <strong>{label ?? '点击选择文件，或拖拽到这里'}</strong>
      {hint && <span>{hint}</span>}
      {!compact && <span className="dz-paste">也可以直接 Ctrl+V 粘贴截图 / 图片</span>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={e => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
