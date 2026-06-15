import { useEffect, useRef, useState } from 'react'

/**
 * 元素进入视口时返回 true（一次性）。用于滚动揭示动画。
 * 多重降级保护：不支持 IntersectionObserver 时立即显示；
 * 另设 1.2s 兜底，确保任何情况下内容都不会永久隐藏。
 */
export function useInView<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    const fallback = window.setTimeout(() => {
      setInView(true)
      io.disconnect()
    }, 1200)
    return () => {
      io.disconnect()
      window.clearTimeout(fallback)
    }
  }, [])

  return [ref, inView]
}
