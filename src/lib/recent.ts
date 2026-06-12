/** 最近使用的工具（localStorage，最多 6 个） */
const KEY = 'hahaimage.recent'
const MAX = 6

export function getRecentPaths(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter(p => typeof p === 'string') : []
  } catch {
    return []
  }
}

export function recordRecent(path: string): void {
  try {
    const list = [path, ...getRecentPaths().filter(p => p !== path)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* 隐私模式等存储不可用时静默忽略 */
  }
}
