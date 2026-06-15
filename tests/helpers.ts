import type { Page } from '@playwright/test'

/** 在页面里把 ArrayBuffer 转 base64（分块避免栈溢出），供 evaluate 内联使用 */
const B64_FN = `(buf) => {
  const u = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(u.subarray(i, i + 0x8000)))
  return btoa(s)
}`

/** 生成带噪点的测试 PNG（噪点保证有损压缩有足够压缩空间） */
export async function makePng(page: Page, w = 320, h = 240): Promise<Buffer> {
  const b64 = await page.evaluate(
    ([w, h, fnSrc]) => {
      const toB64 = eval(fnSrc) as (buf: ArrayBuffer) => string
      const c = document.createElement('canvas')
      c.width = w as number
      c.height = h as number
      const ctx = c.getContext('2d')!
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `hsl(${i * 13}, 70%, ${30 + (i % 5) * 10}%)`
        ctx.fillRect(((i * 53) % (c.width - 40)), ((i * 37) % (c.height - 30)), 40, 30)
      }
      // 像素噪声让 PNG 体积足够大，保证有损压缩测试有压缩空间
      const id = ctx.getImageData(0, 0, c.width, c.height)
      for (let i = 0; i < id.data.length; i += 4) {
        const n = (Math.random() * 48) | 0
        id.data[i] += n
        id.data[i + 1] += n
        id.data[i + 2] += n
      }
      ctx.putImageData(id, 0, 0)
      const dataUrl = c.toDataURL('image/png')
      const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), ch => ch.charCodeAt(0))
      return toB64(bytes.buffer)
    },
    [w, h, B64_FN] as const,
  )
  return Buffer.from(b64, 'base64')
}

/** 生成带 EXIF（Orientation=6）的测试 JPEG */
export async function makeJpegWithExif(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(fnSrc => {
    const toB64 = eval(fnSrc) as (buf: ArrayBuffer) => string
    const c = document.createElement('canvas')
    c.width = 200
    c.height = 150
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#3366cc'
    ctx.fillRect(0, 0, 200, 150)
    ctx.fillStyle = '#ffcc00'
    ctx.fillRect(40, 30, 120, 90)
    const bytes = Uint8Array.from(atob(c.toDataURL('image/jpeg', 0.9).split(',')[1]), ch => ch.charCodeAt(0))
    // 手工构造最小 EXIF APP1：TIFF 小端，IFD0 仅含 Orientation=6
    const tiff = [0x49, 0x49, 42, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0]
    const sig = [0x45, 0x78, 0x69, 0x66, 0, 0]
    const len = 2 + sig.length + tiff.length
    const seg = [0xff, 0xe1, (len >> 8) & 0xff, len & 0xff, ...sig, ...tiff]
    const out = new Uint8Array(bytes.length + seg.length)
    out.set(bytes.subarray(0, 2), 0)
    out.set(seg, 2)
    out.set(bytes.subarray(2), 2 + seg.length)
    return toB64(out.buffer)
  }, B64_FN)
  return Buffer.from(b64, 'base64')
}

/** 用 MediaRecorder 录制约 1.2 秒的彩色变化 WebM 视频 */
export async function makeWebm(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(
    fnSrc =>
      new Promise<string>((resolve, reject) => {
        const toB64 = eval(fnSrc) as (buf: ArrayBuffer) => string
        const c = document.createElement('canvas')
        c.width = 64
        c.height = 64
        const ctx = c.getContext('2d')!
        ctx.fillStyle = '#f00'
        ctx.fillRect(0, 0, 64, 64)
        const rec = new MediaRecorder(c.captureStream(15), { mimeType: 'video/webm' })
        const chunks: Blob[] = []
        rec.ondataavailable = e => chunks.push(e.data)
        rec.onerror = () => reject(new Error('MediaRecorder error'))
        rec.onstop = async () => {
          const buf = await new Blob(chunks, { type: 'video/webm' }).arrayBuffer()
          resolve(toB64(buf))
        }
        rec.start()
        let hue = 0
        const iv = setInterval(() => {
          hue += 40
          ctx.fillStyle = `hsl(${hue}, 80%, 50%)`
          ctx.fillRect(0, 0, 64, 64)
        }, 100)
        setTimeout(() => {
          clearInterval(iv)
          rec.stop()
        }, 1200)
      }),
    B64_FN,
  )
  return Buffer.from(b64, 'base64')
}

export interface UploadFile {
  name: string
  mimeType: string
  buffer: Buffer
}

export async function upload(page: Page, files: UploadFile | UploadFile[]): Promise<void> {
  await page.locator('input[type=file]').first().setInputFiles(files)
}

/** 读取结果图自然尺寸 [宽, 高] */
export async function resultSize(page: Page, index = 0): Promise<[number, number]> {
  const src = await page.locator('.result-item .thumb').nth(index).getAttribute('src')
  if (!src) throw new Error('结果缩略图没有 src')
  return page.evaluate(
    url =>
      new Promise<[number, number]>(res => {
        const im = new Image()
        im.onload = () => res([im.naturalWidth, im.naturalHeight])
        im.src = url
      }),
    src,
  )
}

/**
 * 把结果图分成 3×3 网格，返回每格中"明显偏离中性灰(128)"的像素数。
 * 用于断言水印/叠加内容落在预期方位（背景须为中性灰）。
 */
export async function gridDeviation(page: Page, index = 0): Promise<number[][]> {
  const src = await page.locator('.result-item .thumb').nth(index).getAttribute('src')
  if (!src) throw new Error('结果缩略图没有 src')
  return page.evaluate(
    url =>
      new Promise<number[][]>(res => {
        const im = new Image()
        im.onload = () => {
          const c = document.createElement('canvas')
          c.width = im.naturalWidth
          c.height = im.naturalHeight
          const x = c.getContext('2d')!
          x.drawImage(im, 0, 0)
          const W = im.naturalWidth
          const H = im.naturalHeight
          const grid: number[][] = []
          for (let gy = 0; gy < 3; gy++) {
            const row: number[] = []
            for (let gx = 0; gx < 3; gx++) {
              const id = x.getImageData(
                Math.floor((gx * W) / 3),
                Math.floor((gy * H) / 3),
                Math.floor(W / 3),
                Math.floor(H / 3),
              ).data
              let cnt = 0
              for (let i = 0; i < id.length; i += 4) if (Math.abs(id[i] - 128) > 25) cnt++
              row.push(cnt)
            }
            grid.push(row)
          }
          res(grid)
        }
        im.src = url
      }),
    src,
  )
}

/** 网格中数值最大的格子坐标 [行, 列] */
export function hottestCell(grid: number[][]): [number, number] {
  let max = -1
  let cell: [number, number] = [0, 0]
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (grid[r][c] > max) { max = grid[r][c]; cell = [r, c] }
  return cell
}

/** 读取第 index 个处理结果的原始字节（通过缩略图的 blob URL） */
export async function resultBuffer(page: Page, index = 0): Promise<Buffer> {
  const src = await page.locator('.result-item .thumb').nth(index).getAttribute('src')
  if (!src) throw new Error('结果缩略图没有 src')
  const b64 = await page.evaluate(
    async ([url, fnSrc]) => {
      const toB64 = eval(fnSrc) as (buf: ArrayBuffer) => string
      const res = await fetch(url)
      return toB64(await res.arrayBuffer())
    },
    [src, B64_FN] as const,
  )
  return Buffer.from(b64, 'base64')
}

/** 文件魔数断言辅助 */
export const magic = {
  isGif: (b: Buffer) => b.toString('ascii', 0, 4) === 'GIF8',
  isPng: (b: Buffer) => b.readUInt32BE(0) === 0x89504e47,
  isJpeg: (b: Buffer) => b.readUInt16BE(0) === 0xffd8,
  isWebp: (b: Buffer) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
}

/** 解析 JPEG EXIF 中 IFD0 的 Orientation 值（无则返回 null） */
export function readOrientation(jpeg: Buffer): number | null {
  if (jpeg.readUInt16BE(0) !== 0xffd8) return null
  let off = 2
  while (off + 4 <= jpeg.length) {
    const marker = jpeg.readUInt16BE(off)
    if (marker === 0xffda) break
    const size = jpeg.readUInt16BE(off + 2)
    if (marker === 0xffe1 && jpeg.toString('ascii', off + 4, off + 8) === 'Exif') {
      const tiff = off + 10
      const le = jpeg.readUInt16BE(tiff) === 0x4949
      const rd16 = (p: number) => (le ? jpeg.readUInt16LE(p) : jpeg.readUInt16BE(p))
      const rd32 = (p: number) => (le ? jpeg.readUInt32LE(p) : jpeg.readUInt32BE(p))
      const ifd0 = tiff + rd32(tiff + 4)
      const count = rd16(ifd0)
      for (let i = 0; i < count; i++) {
        const e = ifd0 + 2 + i * 12
        if (rd16(e) === 0x0112) return rd16(e + 8)
      }
      return null
    }
    off += 2 + size
  }
  return null
}
