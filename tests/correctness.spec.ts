import { expect, test } from '@playwright/test'
import { gridDeviation, hottestCell, makePng, resultSize, upload } from './helpers'

/** 在 page 上下文生成纯中性灰 PNG（背景，便于检测叠加内容） */
async function makeGray(page: import('@playwright/test').Page, w: number, h: number): Promise<Buffer> {
  const b64 = await page.evaluate(
    ([w, h]) => {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const x = c.getContext('2d')!
      x.fillStyle = '#808080'
      x.fillRect(0, 0, w, h)
      return c.toDataURL('image/png').split(',')[1]
    },
    [w, h] as const,
  )
  return Buffer.from(b64, 'base64')
}

test.describe('输出正确性（像素级）', () => {
  for (const { pos, label, cell } of [
    { pos: 'nw', label: '左上', cell: [0, 0] },
    { pos: 'ne', label: '右上', cell: [0, 2] },
    { pos: 'se', label: '右下', cell: [2, 2] },
    { pos: 'c', label: '居中', cell: [1, 1] },
    { pos: 's', label: '下中', cell: [2, 1] },
  ]) {
    test(`水印定位 ${pos}(${label}) 落在正确方位`, async ({ page }) => {
      await page.goto('/#/watermark')
      await upload(page, { name: 't.png', mimeType: 'image/png', buffer: await makeGray(page, 360, 360) })
      await expect(page.locator('.dropzone')).toBeVisible()
      await page.getByLabel('水印文字').fill('TESTMARK')
      await page.getByLabel('位置').selectOption(pos)
      await page.getByRole('button', { name: /添加水印/ }).click()
      await expect(page.locator('.result-item')).toHaveCount(1)
      const hot = hottestCell(await gridDeviation(page))
      expect(hot).toEqual(cell)
    })
  }

  test('调整尺寸：只填高度按比例推算宽度', async ({ page }) => {
    await page.goto('/#/resize')
    await upload(page, { name: 't.png', mimeType: 'image/png', buffer: await makePng(page, 320, 240) })
    await page.getByLabel('高度（px）').fill('120')
    await page.getByRole('button', { name: /开始调整/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1)
    expect(await resultSize(page)).toEqual([160, 120])
  })

  test('调整尺寸：200% 放大', async ({ page }) => {
    await page.goto('/#/resize')
    await upload(page, { name: 't.png', mimeType: 'image/png', buffer: await makePng(page, 100, 100) })
    await page.getByRole('button', { name: '按百分比' }).click()
    await page.getByLabel('缩放比例（%）').fill('200')
    await page.getByRole('button', { name: /开始调整/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1)
    expect(await resultSize(page)).toEqual([200, 200])
  })

  test('裁剪：显示选区与输出尺寸一致', async ({ page }) => {
    await page.goto('/#/crop')
    await upload(page, { name: 't.png', mimeType: 'image/png', buffer: await makePng(page, 400, 300) })
    await expect(page.locator('.crop-rect')).toBeVisible()
    const note = await page.locator('.row .note').textContent()
    const m = note?.match(/(\d+) × (\d+)/)
    expect(m).toBeTruthy()
    await page.getByRole('button', { name: '裁剪', exact: true }).click()
    await expect(page.locator('.result-item')).toHaveCount(1)
    expect(await resultSize(page)).toEqual([Number(m![1]), Number(m![2])])
  })

  test('分割：不整除尺寸无丢像素（7px 分 3 列累加=7）', async ({ page }) => {
    await page.goto('/#/split')
    await upload(page, { name: 't.png', mimeType: 'image/png', buffer: await makePng(page, 7, 30) })
    await page.getByLabel('行数').fill('1')
    await page.getByLabel('列数').fill('3')
    await page.getByRole('button', { name: /分割为/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(3)
    const notes = await page.locator('.result-item .note').allTextContents()
    const widths = notes.map(n => Number(n.match(/(\d+) ×/)![1]))
    expect(widths.reduce((a, b) => a + b, 0)).toBe(7)
  })
})
