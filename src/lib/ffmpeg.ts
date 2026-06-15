/**
 * ffmpeg.wasm 单例封装。核心 wasm（约 31MB）从 CDN 懒加载，
 * 仅在用户进入 GIF/视频工具并执行操作时才下载，且全站只加载一次。
 */
import type { FFmpeg } from '@ffmpeg/ffmpeg'

const CORE_VERSION = '0.12.10'
const CDN_BASES = [
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`,
  `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`,
]

let instance: FFmpeg | null = null
let loading: Promise<FFmpeg> | null = null

export function getFFmpeg(onStatus?: (msg: string) => void): Promise<FFmpeg> {
  if (instance) return Promise.resolve(instance)
  if (loading) return loading
  loading = (async () => {
    onStatus?.('正在加载 ffmpeg 组件（首次约 31MB，仅需一次）…')
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import('@ffmpeg/ffmpeg'),
      import('@ffmpeg/util'),
    ])
    const ff = new FFmpeg()
    let lastErr: unknown = null
    for (const base of CDN_BASES) {
      try {
        await ff.load({
          coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
        })
        instance = ff
        return ff
      } catch (e) {
        lastErr = e
      }
    }
    loading = null
    throw new Error(`ffmpeg 组件加载失败，请检查网络后重试：${String(lastErr)}`)
  })()
  return loading
}

/**
 * 中止当前 ffmpeg 处理：终止 worker 并清空单例，下次运行会重新加载
 * （核心已在浏览器缓存中，重载很快）。用于用户取消长任务。
 */
export function terminateFFmpeg(): void {
  if (instance) {
    try {
      instance.terminate()
    } catch {
      /* worker 可能已结束 */
    }
  }
  instance = null
  loading = null
}

export interface FFmpegTask {
  inputs: { name: string; data: Blob }[]
  args: string[]
  /** 明确的输出文件名 */
  outputs?: string[]
  /** 或按模式收集输出（如逐帧导出） */
  outputPattern?: RegExp
  onProgress?: (ratio: number) => void
  onStatus?: (msg: string) => void
}

export async function runFFmpeg(task: FFmpegTask): Promise<{ name: string; data: Uint8Array }[]> {
  const ff = await getFFmpeg(task.onStatus)
  const { fetchFile } = await import('@ffmpeg/util')

  const progressHandler = ({ progress }: { progress: number }) => {
    if (progress >= 0 && progress <= 1) task.onProgress?.(progress)
  }
  ff.on('progress', progressHandler)

  const written: string[] = []
  try {
    for (const input of task.inputs) {
      await ff.writeFile(input.name, await fetchFile(input.data))
      written.push(input.name)
    }
    task.onStatus?.('处理中…')
    const code = await ff.exec(task.args)
    if (code !== 0) throw new Error(`处理失败（ffmpeg 退出码 ${code}），请检查文件或参数`)

    let names: string[] = task.outputs ?? []
    if (task.outputPattern) {
      const entries = await ff.listDir('/')
      names = entries
        .filter(e => !e.isDir && task.outputPattern!.test(e.name))
        .map(e => e.name)
        .sort()
    }
    const results: { name: string; data: Uint8Array }[] = []
    for (const name of names) {
      const data = (await ff.readFile(name)) as Uint8Array
      results.push({ name, data })
      written.push(name)
    }
    return results
  } finally {
    ff.off('progress', progressHandler)
    for (const name of written) {
      try {
        await ff.deleteFile(name)
      } catch {
        /* 文件可能不存在，忽略 */
      }
    }
  }
}
