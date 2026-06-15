import { useEffect, useRef, useState } from 'react'

/**
 * 与 useState 等价，但把值持久化到 localStorage，按工具记住上次设置。
 * key 建议带工具前缀，如 "compress.quality"。仅持久化可序列化的简单值。
 */
export function usePersistedState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = `hahaimage.pref.${key}`
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw != null) return JSON.parse(raw) as T
    } catch {
      /* 忽略损坏/不可用的存储 */
    }
    return initial
  })

  // 防止首次渲染时立即回写
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      /* 隐私模式等存储不可用时静默忽略 */
    }
  }, [storageKey, value])

  return [value, setValue]
}
