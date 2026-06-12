import { useRef, useState } from 'react'
import { Icon } from './Icon'

interface FileDropProps {
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  label?: string
  hint?: string
  compact?: boolean
}

export function FileDrop({ accept, multiple, onFiles, label, hint, compact }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return
    onFiles(multiple ? Array.from(list) : [list[0]])
  }

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
