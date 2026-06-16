// 构建/开发前把第三方运行时静态资源从 node_modules 复制到 public/，
// 实现同源本地加载、不依赖外部 CDN，也不把大文件塞进 git（public/ffmpeg 已 gitignore）。
import { cp, mkdir, access } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function copyFfmpegCore() {
  const src = resolve(root, 'node_modules/@ffmpeg/core/dist/esm')
  const dst = resolve(root, 'public/ffmpeg')
  if (!(await exists(src))) {
    console.warn('[copy-local-assets] 未找到 @ffmpeg/core，跳过 ffmpeg 本地化')
    return
  }
  await mkdir(dst, { recursive: true })
  for (const f of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
    await cp(resolve(src, f), resolve(dst, f))
  }
  console.log('[copy-local-assets] ffmpeg 核心 → public/ffmpeg/')
}

await copyFfmpegCore()
