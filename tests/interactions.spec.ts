import { expect, test } from '@playwright/test'
import { makePng, upload } from './helpers'

test.describe('酷炫交互', () => {
  test('压缩结果支持前后对比滑块', async ({ page }) => {
    await page.goto('/#/compress')
    await upload(page, { name: 'p.png', mimeType: 'image/png', buffer: await makePng(page, 400, 300) })
    await page.getByRole('button', { name: /开始压缩/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1)
    // 默认不显示对比；点对比后出现滑块，含原图与处理后两张图
    await expect(page.locator('.ba-compare')).toHaveCount(0)
    await page.getByRole('button', { name: '对比' }).click()
    await expect(page.locator('.ba-compare')).toHaveCount(1)
    await expect(page.locator('.ba-compare img')).toHaveCount(2)
    await expect(page.locator('.ba-label-before')).toHaveText('原图')
    await expect(page.locator('.ba-label-after')).toHaveText('处理后')
    // 键盘可调（slider role）
    const slider = page.locator('.ba-compare')
    await slider.focus()
    const before = await slider.getAttribute('aria-valuenow')
    await slider.press('ArrowLeft')
    expect(await slider.getAttribute('aria-valuenow')).not.toBe(before)
    // 再次点击关闭
    await page.getByRole('button', { name: '对比' }).click()
    await expect(page.locator('.ba-compare')).toHaveCount(0)
  })

  test('水印实时预览随参数更新', async ({ page }) => {
    await page.goto('/#/watermark')
    // 上传前无预览
    await expect(page.locator('.wm-preview-canvas')).toHaveCount(0)
    await upload(page, { name: 'p.png', mimeType: 'image/png', buffer: await makePng(page, 400, 300) })
    // 上传后出现预览画布且尺寸非零
    await expect(page.locator('.wm-preview-canvas')).toHaveCount(1)
    await expect
      .poll(() => page.locator('.wm-preview-canvas').evaluate((c: HTMLCanvasElement) => c.width))
      .toBeGreaterThan(0)
    // 改平铺，预览仍在（不报错）
    await page.getByLabel('位置').selectOption('tile')
    await page.getByLabel('水印文字').fill('LIVE')
    await expect(page.locator('.wm-preview-canvas')).toHaveCount(1)
  })

  test('拖拽文件进窗口弹出全局投放覆盖层', async ({ page }) => {
    await page.goto('/#/compress')
    await expect(page.locator('.drop-overlay')).toHaveCount(0)
    // 合成带 Files 类型的 dragenter
    await page.evaluate(() => {
      const dt = new DataTransfer()
      const ev = new DragEvent('dragenter', { bubbles: true, dataTransfer: dt })
      Object.defineProperty(ev.dataTransfer, 'types', { value: ['Files'] })
      window.dispatchEvent(ev)
    })
    await expect(page.locator('.drop-overlay')).toHaveCount(1)
    await expect(page.locator('.drop-overlay-inner')).toContainText('本地完成')
    // drop 后覆盖层消失
    await page.evaluate(() => {
      const dt = new DataTransfer()
      window.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }))
    })
    await expect(page.locator('.drop-overlay')).toHaveCount(0)
  })

  test('首页分类滚动揭示后可见', async ({ page }) => {
    await page.goto('/#/')
    // 揭示机制兜底必然让 4 个分类最终都带 is-revealed
    await expect(page.locator('.cat-section.is-revealed')).toHaveCount(4, { timeout: 5000 })
  })

  test('下载后按钮短暂显示"已下载"反馈', async ({ page }) => {
    await page.goto('/#/compress')
    const b64 = await page.evaluate(() => {
      const c = document.createElement('canvas')
      c.width = 200
      c.height = 150
      c.getContext('2d')!.fillRect(0, 0, 200, 150)
      return c.toDataURL('image/png').split(',')[1]
    })
    await upload(page, { name: 'p.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') })
    await page.getByRole('button', { name: /开始压缩/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1)
    await page.getByRole('button', { name: '下载', exact: true }).click()
    await expect(page.getByRole('button', { name: '已下载' })).toBeVisible()
  })

  test('头部滚动后浮现阴影（is-scrolled）', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.locator('.site-header')).not.toHaveClass(/is-scrolled/)
    await page.evaluate(() => window.scrollTo(0, 400))
    await expect(page.locator('.site-header')).toHaveClass(/is-scrolled/)
  })

  test('路由切换包裹 route-fade 过渡', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.locator('.route-fade')).toHaveCount(1)
    await page.goto('/#/crop')
    await expect(page.locator('.route-fade')).toHaveCount(1)
    await expect(page.locator('.tool-head h1')).toHaveText('裁剪图片')
  })
})
