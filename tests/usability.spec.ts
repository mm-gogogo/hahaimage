import { expect, test } from '@playwright/test'
import { makePng, upload } from './helpers'

test.describe('易用性', () => {
  test('压缩参数跨访问记忆（localStorage）', async ({ page }) => {
    await page.goto('/#/compress')
    await page.getByLabel('输出格式').selectOption('image/webp')
    await page.getByLabel(/质量/).fill('40')
    // 重新加载页面后设置保留
    await page.goto('/#/')
    await page.goto('/#/compress')
    await expect(page.getByLabel('输出格式')).toHaveValue('image/webp')
    expect(await page.locator('#cp-q').inputValue()).toBe('40')
  })

  test('文件列表显示数量/总大小并可一键清空', async ({ page }) => {
    await page.goto('/#/compress')
    const png = await makePng(page, 200, 150)
    await upload(page, [
      { name: 'a.png', mimeType: 'image/png', buffer: png },
      { name: 'b.png', mimeType: 'image/png', buffer: png },
    ])
    await expect(page.locator('.file-list-count')).toContainText('已选 2 个文件')
    await expect(page.locator('.file-item')).toHaveCount(2)
    await page.getByRole('button', { name: '清空' }).click()
    await expect(page.locator('.file-item')).toHaveCount(0)
  })

  test('批量处理逐张流式出结果', async ({ page }) => {
    await page.goto('/#/compress')
    const png = await makePng(page, 300, 200)
    await upload(page, [
      { name: 'a.png', mimeType: 'image/png', buffer: png },
      { name: 'b.png', mimeType: 'image/png', buffer: png },
      { name: 'c.png', mimeType: 'image/png', buffer: png },
    ])
    await page.getByRole('button', { name: /开始压缩/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(3)
  })

  test('GIF 工具进度区呈现 + 处理中显示取消', async ({ page }) => {
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
    await page.goto('/#/gif-reverse')
    await upload(page, { name: 't.gif', mimeType: 'image/gif', buffer: gif })
    await page.getByRole('button', { name: '生成倒放 GIF' }).click()
    // 处理中应出现取消按钮（ffmpeg 首次需下载核心，会持续一会）
    await expect(page.getByRole('button', { name: '取消' })).toBeVisible({ timeout: 10000 })
    // 最终出结果
    await expect(page.locator('.result-item')).toHaveCount(1, { timeout: 300000 })
  })

  test('诚实体积文案：变大显示增大而非"减小 0%"', async ({ page }) => {
    await page.goto('/#/compress')
    // 极小图压成 JPG 通常会变大
    const tiny = await page.evaluate(() => {
      const c = document.createElement('canvas')
      c.width = 64
      c.height = 48
      const x = c.getContext('2d')!
      x.fillStyle = '#3a6'
      x.fillRect(0, 0, 64, 48)
      return c.toDataURL('image/png').split(',')[1]
    })
    await upload(page, { name: 'tiny.png', mimeType: 'image/png', buffer: Buffer.from(tiny, 'base64') })
    await page.getByRole('button', { name: /开始压缩/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1)
    const note = await page.locator('.result-item .note').textContent()
    expect(note).not.toContain('减小 0%')
    expect(note).toMatch(/增大|体积基本不变|减小/)
  })

  test('视频转 GIF 参数记忆', async ({ page }) => {
    await page.goto('/#/video-to-gif')
    await page.getByLabel('帧率').selectOption('5')
    await page.getByLabel('输出宽度').selectOption('320')
    await page.goto('/#/')
    await page.goto('/#/video-to-gif')
    await expect(page.getByLabel('帧率')).toHaveValue('5')
    await expect(page.getByLabel('输出宽度')).toHaveValue('320')
  })
})
