import { useState } from 'react'
import { FileDrop } from '../../components/FileDrop'
import { FileList } from '../../components/FileList'
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

  const run = async () => {
    setBusy(true)
    setError('')
    setResults([])
    setProgress(0)
    try {
      setStatus('正在加载 AI 模型（首次约 40MB，仅需一次）…')
      const { removeBackground } = await import('@imgly/background-removal')
      const out: ResultItem[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setStatus(`正在处理第 ${i + 1} / ${files.length} 张：${file.name}`)
        const blob = await removeBackground(file, {
          progress: (_key, current, total) => {
            const fileRatio = total > 0 ? current / total : 0
            setProgress((i + fileRatio) / files.length)
          },
        })
        out.push({ name: replaceExt(file.name, 'png'), blob })
        setResults([...out])
        setProgress((i + 1) / files.length)
      }
      setStatus('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage
      title="批量抠图"
      desc="AI 自动识别主体并去除背景，输出透明 PNG。模型在你的浏览器里运行，图片不会上传到任何服务器。首次使用需要下载约 40MB 的模型文件。"
    >
      <div className="panel">
        <FileDrop accept="image/*" multiple onFiles={f => setFiles(prev => [...prev, ...f])} hint="人物、商品、动物等主体明确的图片效果最好" />
        <FileList files={files} onRemove={i => setFiles(files.filter((_, j) => j !== i))} />
        {busy && (
          <div className="field" role="status">
            <span className="help">{status}</span>
            <div className="progress"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
          </div>
        )}
        {error && <p className="msg msg-error">{error}</p>}
        <button className={`btn btn-primary${busy ? ' is-loading' : ''}`} disabled={files.length === 0 || busy} onClick={run}>
          {busy && <span className="spinner" />}
          {busy ? '抠图中…' : `开始抠图（${files.length} 个文件）`}
        </button>
      </div>

      <ResultList items={results} zipName="removed-bg.zip" />
    </ToolPage>
  )
}
