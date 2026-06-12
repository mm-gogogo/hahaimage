import { expect, test } from '@playwright/test'
import { magic, makeJpegWithExif, makePng, readOrientation, resultBuffer, upload } from './helpers'

test.describe('图片工具（Canvas）', () => {
  test('转换图片：PNG → JPG 与 WebP', async ({ page }) => {
    await page.goto('/#/convert')
    const png = await makePng(page)
    await upload(page, { name: 'a.png', mimeType: 'image/png', buffer: png })
    await page.getByLabel('目标格式').selectOption('image/jpeg')
    await page.getByRole('button', { name: /开始转换/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1)
    expect(magic.isJpeg(await resultBuffer(page))).toBe(true)
    await expect(page.locator('.result-item .name')).toHaveText('a.jpg')

    await page.getByLabel('目标格式').selectOption('image/webp')
    await page.getByRole('button', { name: /开始转换/ }).click()
    await expect(page.locator('.result-item .name')).toHaveText('a.webp')
    expect(magic.isWebp(await resultBuffer(page))).toBe(true)
  })

  test('调整尺寸：按百分比 50%', async ({ page }) => {
    await page.goto('/#/resize')
    await upload(page, { name: 'a.png', mimeType: 'image/png', buffer: await makePng(page, 320, 240) })
    await page.getByRole('button', { name: '按百分比' }).click()
    await page.getByLabel('缩放比例（%）').fill('50')
    await page.getByRole('button', { name: /开始调整/ }).click()
    await expect(page.locator('.result-item .note')).toContainText('160 × 120')
  })

  test('调整尺寸：只填宽度按比例推算', async ({ page }) => {
    await page.goto('/#/resize')
    await upload(page, { name: 'a.png', mimeType: 'image/png', buffer: await makePng(page, 320, 240) })
    await page.getByLabel('宽度（px）').fill('160')
    await page.getByRole('button', { name: /开始调整/ }).click()
    await expect(page.locator('.result-item .note')).toContainText('160 × 120')
  })

  test('压缩图片：体积减小', async ({ page }) => {
    await page.goto('/#/compress')
    const png = await makePng(page, 640, 480)
    await upload(page, { name: 'big.png', mimeType: 'image/png', buffer: png })
    await page.getByRole('button', { name: /开始压缩/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1)
    const out = await resultBuffer(page)
    expect(magic.isJpeg(out)).toBe(true)
    expect(out.length).toBeLessThan(png.length)
  })

  test('压缩到指定大小：满足目标 KB', async ({ page }) => {
    await page.goto('/#/compress-to-size')
    await upload(page, { name: 'big.png', mimeType: 'image/png', buffer: await makePng(page, 640, 480) })
    await page.getByLabel('目标大小（KB）').fill('20')
    await page.getByRole('button', { name: /开始压缩/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1)
    const out = await resultBuffer(page)
    expect(out.length).toBeLessThanOrEqual(20 * 1024)
  })

  test('压缩 JPG 保留 EXIF 且方向归一', async ({ page }) => {
    await page.goto('/#/compress-exif')
    const jpeg = await makeJpegWithExif(page)
    expect(readOrientation(jpeg)).toBe(6) // 夹具自检
    await upload(page, { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: jpeg })
    await page.getByRole('button', { name: /开始压缩/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1)
    const out = await resultBuffer(page)
    expect(magic.isJpeg(out)).toBe(true)
    expect(out.includes('Exif')).toBe(true)
    expect(readOrientation(out)).toBe(1) // 已归一，避免二次旋转
  })

  test('读取 EXIF：显示 Orientation', async ({ page }) => {
    await page.goto('/#/exif')
    await upload(page, { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: await makeJpegWithExif(page) })
    await expect(page.locator('.kv-table')).toBeVisible()
    await expect(page.locator('.kv-table th', { hasText: 'Orientation' })).toBeVisible()
  })

  test('裁剪图片：1:1 比例输出正方形', async ({ page }) => {
    await page.goto('/#/crop')
    await upload(page, { name: 'a.png', mimeType: 'image/png', buffer: await makePng(page, 320, 240) })
    await expect(page.locator('.crop-rect')).toBeVisible()
    await page.getByRole('button', { name: '1:1' }).click()
    await page.getByRole('button', { name: '裁剪', exact: true }).click()
    const note = await page.locator('.result-item .note').textContent()
    const m = note?.match(/(\d+) × (\d+)/)
    expect(m).toBeTruthy()
    expect(m![1]).toBe(m![2])
  })

  test('分割图片：2×2 出 4 块', async ({ page }) => {
    await page.goto('/#/split')
    await upload(page, { name: 'a.png', mimeType: 'image/png', buffer: await makePng(page) })
    await page.getByLabel('行数').fill('2')
    await page.getByLabel('列数').fill('2')
    await page.getByRole('button', { name: /分割为/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(4)
    expect(magic.isPng(await resultBuffer(page, 0))).toBe(true)
    await expect(page.getByRole('button', { name: /全部打包下载/ })).toBeVisible()
  })

  test('拼接图片：纵向统一宽度', async ({ page }) => {
    await page.goto('/#/stitch')
    const png = await makePng(page, 320, 240)
    await upload(page, [
      { name: 'a.png', mimeType: 'image/png', buffer: png },
      { name: 'b.png', mimeType: 'image/png', buffer: png },
    ])
    await page.getByRole('button', { name: /开始拼接/ }).click()
    await expect(page.locator('.result-item .note')).toContainText('320 × 480')
  })

  test('文字水印：输出有效图片', async ({ page }) => {
    await page.goto('/#/watermark')
    await upload(page, { name: 'a.png', mimeType: 'image/png', buffer: await makePng(page) })
    await page.getByLabel('水印文字').fill('测试水印')
    await page.getByLabel('位置').selectOption('tile')
    await page.getByRole('button', { name: /添加水印/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1)
    expect(magic.isPng(await resultBuffer(page))).toBe(true)
  })
})
