import { useRef, useState } from 'react'
import { terminateFFmpeg } from './ffmpeg'

/**
 * 单任务 ffmpeg 处理生命周期：状态文案、进度、错误、可取消。
 * 取消时终止 worker（terminateFFmpeg），并吞掉随之而来的拒绝。
 */
export function useFFmpegJob() {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const cancelled = useRef(false)

  async function run(job: () => Promise<void>): Promise<void> {
    setBusy(true)
    setError('')
    setProgress(0)
    setStatus('')
    cancelled.current = false
    try {
      await job()
    } catch (e) {
      if (!cancelled.current) setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  function cancel() {
    cancelled.current = true
    terminateFFmpeg()
    setBusy(false)
    setStatus('已取消')
    setProgress(0)
  }

  return { busy, status, setStatus, progress, setProgress, error, setError, run, cancel }
}
