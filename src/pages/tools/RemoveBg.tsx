import { useRef, useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
import { Icon } from '../../components/Icon'
import { ResultList, type ResultItem } from '../../components/ResultList'
import { ToolPage } from '../../components/ToolPage'
import { replaceExt } from '../../lib/image'

export default function RemoveBg() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<ResultItem[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const cancelled = useRef(false)

  const run = async () => {
    setBusy(true)
    setError('')
    setResults([])
    setProgress(0)
    cancelled.current = false
    try {
      setStatus('正在加载 AI 模型（首次约 40MB，仅需一次）…')
      const { removeBackground } = await import('@imgly/background-removal')
      const out: ResultItem[] = []
      for (let i = 0; i < files.length; i++) {
        if (cancelled.current) break
        const file = files[i]
        setStatus(`正在处理第 ${i + 1} / ${files.length} 张：${file.name}`)
        const blob = await removeBackground(file, {
          progress: (_key, current, total) => {
            const fileRatio = total > 0 ? current / total : 0
            setProgress((i + fileRatio) / files.length)
          },
        })
        if (cancelled.current) break
        out.push({ name: replaceExt(file.name, 'png'), blob, original: file })
        setResults([...out])
        setProgress((i + 1) / files.length)
      }
      setStatus('')
    } catch (e) {
      if (!cancelled.current) setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const cancel = () => {
    cancelled.current = true
    setBusy(false)
    setStatus('已取消（已完成的结果保留）')
  }

  return (
    <ToolPage
      title="批量抠图"
      desc="AI 自动识别主体并去除背景，输出透明 PNG。模型在你的浏览器里运行，图片不会上传到任何服务器。首次使用需要下载约 40MB 的模型文件。"
    >
      <div className="panel">
        <FileDrop accept="image/*" multiple onFiles={f => setFiles(prev => [...prev, ...f])} hint="人物、商品、动物等主体明确的图片效果最好" />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} onClear={() => setFiles([])} />
        {busy && (
          <div className="field" role="status">
            <span className="help">{status}</span>
            <div className="progress"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
          </div>
        )}
        {error && <p className="msg msg-error">{error}</p>}
        <div className="row">
          <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={files.length === 0 || busy} onClick={run} style={{ flex: 1 }}>
            {busy && <span className="spinner" />}
            {busy ? '抠图中…' : `开始抠图（${files.length} 个文件）`}
          </button>
          {busy && (
            <button className="btn" onClick={cancel}>
              <Icon name="x" size={16} />
              取消
            </button>
          )}
        </div>
      </div>

      <ResultList items={results} zipName="removed-bg.zip" />
    </ToolPage>
  )
}
