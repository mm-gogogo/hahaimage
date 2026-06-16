// 可选：把 AI 抠图模型（@imgly 数据）复制到 public/imgly/，实现完全本地托管。
// 默认不执行（模型 211MB，对静态托管偏重）；自托管想完全离线时运行：
//   npm i -D @imgly/background-removal-data && npm run fetch-ai-model
// 然后在 public/site.config.json 设 ai.modelBaseUrl 指向 "./imgly/"（或部署后的绝对路径）。
import { cp, mkdir, access } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'node_modules/@imgly/background-removal-data/dist')
const dst = resolve(root, 'public/imgly/dist')

try {
  await access(src)
} catch {
  console.error('未找到 @imgly/background-removal-data，请先：npm i -D @imgly/background-removal-data')
  process.exit(1)
}
await mkdir(dst, { recursive: true })
await cp(src, dst, { recursive: true })
console.log('AI 模型已复制到 public/imgly/dist/。请在 site.config.json 设 ai.modelBaseUrl = "./imgly/dist/"')
