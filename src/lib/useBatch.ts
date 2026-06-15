import { useRef, useState } from 'react'
import type { ResultItem } from '../components/ResultList'

/**
 * 批量处理生命周期：逐项处理，结果**流式追加**（每处理完一项立即显示），
 * 暴露进度与"已完成/总数"，并支持在项与项之间协作式取消。
 * 把"处理 20 张图全部完成才出结果"的假死体验，变成实时反馈 + 可中止。
 */
export function useBatch() {
  const [results, setResults] = useState<ResultItem[]>([])
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const cancelRef = useRef(false)

  async function run<T>(
    items: T[],
    process: (item: T, index: number) => Promise<ResultItem | ResultItem[]>,
  ): Promise<void> {
    setBusy(true)
    setError('')
    setResults([])
    setDone(0)
    setTotal(items.length)
    cancelRef.current = false
    const acc: ResultItem[] = []
    try {
      for (let i = 0; i < items.length; i++) {
        if (cancelRef.current) break
        const r = await process(items[i], i)
        acc.push(...(Array.isArray(r) ? r : [r]))
        setResults([...acc])
        setDone(i + 1)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  function cancel() {
    cancelRef.current = true
  }

  return { results, busy, done, total, error, run, cancel, setError, setResults }
}
