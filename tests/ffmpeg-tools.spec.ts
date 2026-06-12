import { expect, test } from '@playwright/test'
import { magic, makeWebm, resultBuffer, upload } from './helpers'

/**
 * ffmpeg 链路测试：先用浏览器 MediaRecorder 现场生成 WebM 视频，
 * 经「视频转 GIF」得到真实 GIF 夹具，再串联测试全部 GIF 工具。
 * 串行执行 + 同一浏览器上下文，31MB 的 ffmpeg 核心只需下载一次（HTTP 缓存）。
 */
test.describe.serial('GIF / 视频工具（ffmpeg.wasm）', () => {
  test.describe.configure({ timeout: 360_000 })
  let gif: Buffer

  test('视频转 GIF', async ({ page }) => {
    await page.goto('/#/video-to-gif')
    const webm = await makeWebm(page)
    await upload(page, { name: 'test.webm', mimeType: 'video/webm', buffer: webm })
    await page.getByLabel('输出宽度').selectOption('0')
    await page.getByRole('button', { name: '转换为 GIF' }).click()
    await expect(page.locator('.result-item')).toHaveCount(1, { timeout: 330_000 })
    gif = await resultBuffer(page)
    expect(magic.isGif(gif)).toBe(true)
  })

  test('剪辑视频转 GIF', async ({ page }) => {
    await page.goto('/#/video-clip-gif')
    const webm = await makeWebm(page)
    await upload(page, { name: 'test.webm', mimeType: 'video/webm', buffer: webm })
    await page.getByLabel('开始时间').fill('0.2')
    await page.getByLabel('结束时间').fill('0.8')
    await page.getByRole('button', { name: '剪辑并转换为 GIF' }).click()
    await expect(page.locator('.result-item')).toHaveCount(1, { timeout: 330_000 })
    const out = await resultBuffer(page)
    expect(magic.isGif(out)).toBe(true)
    await expect(page.locator('.result-item .note')).toContainText('0.6 秒')
  })

  test('GIF 压缩', async ({ page }) => {
    await page.goto('/#/gif-compress')
    await upload(page, { name: 'test.gif', mimeType: 'image/gif', buffer: gif })
    await page.getByLabel('尺寸').selectOption('50')
    await page.getByLabel('颜色数').selectOption('64')
    await page.getByRole('button', { name: /开始压缩/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1, { timeout: 330_000 })
    expect(magic.isGif(await resultBuffer(page))).toBe(true)
  })

  test('GIF 裁剪', async ({ page }) => {
    await page.goto('/#/gif-crop')
    await upload(page, { name: 'test.gif', mimeType: 'image/gif', buffer: gif })
    await expect(page.locator('.crop-rect')).toBeVisible()
    await page.getByRole('button', { name: '裁剪', exact: true }).click()
    await expect(page.locator('.result-item')).toHaveCount(1, { timeout: 330_000 })
    expect(magic.isGif(await resultBuffer(page))).toBe(true)
  })

  test('提取 GIF 帧', async ({ page }) => {
    await page.goto('/#/gif-extract')
    await upload(page, { name: 'test.gif', mimeType: 'image/gif', buffer: gif })
    await page.getByRole('button', { name: '提取全部帧' }).click()
    await expect(page.locator('.result-item').first()).toBeVisible({ timeout: 330_000 })
    const count = await page.locator('.result-item').count()
    expect(count).toBeGreaterThanOrEqual(2)
    expect(magic.isPng(await resultBuffer(page, 0))).toBe(true)
    await expect(page.getByRole('button', { name: /全部打包下载/ })).toBeVisible()
  })

  test('GIF 合并', async ({ page }) => {
    await page.goto('/#/gif-merge')
    await upload(page, [
      { name: 'a.gif', mimeType: 'image/gif', buffer: gif },
      { name: 'b.gif', mimeType: 'image/gif', buffer: gif },
    ])
    await page.getByRole('button', { name: /合并 2 个 GIF/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1, { timeout: 330_000 })
    expect(magic.isGif(await resultBuffer(page))).toBe(true)
  })

  test('GIF 倒放', async ({ page }) => {
    await page.goto('/#/gif-reverse')
    await upload(page, { name: 'test.gif', mimeType: 'image/gif', buffer: gif })
    await page.getByRole('button', { name: '生成倒放 GIF' }).click()
    await expect(page.locator('.result-item')).toHaveCount(1, { timeout: 330_000 })
    expect(magic.isGif(await resultBuffer(page))).toBe(true)
  })

  test('GIF 转动态 WebP', async ({ page }) => {
    await page.goto('/#/gif-convert')
    await upload(page, { name: 'test.gif', mimeType: 'image/gif', buffer: gif })
    await page.getByRole('button', { name: '动态 WebP' }).click()
    await page.getByRole('button', { name: /转换为 WebP/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1, { timeout: 330_000 })
    expect(magic.isWebp(await resultBuffer(page))).toBe(true)
  })

  test('GIF 转 APNG', async ({ page }) => {
    await page.goto('/#/gif-convert')
    await upload(page, { name: 'test.gif', mimeType: 'image/gif', buffer: gif })
    await page.getByRole('button', { name: 'APNG' }).click()
    await page.getByRole('button', { name: /转换为 APNG/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1, { timeout: 330_000 })
    const out = await resultBuffer(page)
    expect(magic.isPng(out)).toBe(true)
    expect(out.includes('acTL')).toBe(true) // APNG 动画控制块
  })
})
