import { expect, test } from '@playwright/test'
import { magic, makePng, resultBuffer, upload } from './helpers'

/**
 * AI 抠图测试需要从 CDN 下载约 40MB 的 ONNX 模型，默认跳过。
 * 本地完整验证：RUN_AI=1 npx playwright test tests/ai.spec.ts
 */
test.describe('AI 批量抠图', () => {
  test.skip(!process.env.RUN_AI, '设置 RUN_AI=1 启用（需下载约 40MB 模型）')
  test.describe.configure({ timeout: 600_000 })

  test('抠图输出透明 PNG', async ({ page }) => {
    await page.goto('/#/remove-bg')
    await upload(page, { name: 'subject.png', mimeType: 'image/png', buffer: await makePng(page, 256, 256) })
    await page.getByRole('button', { name: /开始抠图/ }).click()
    await expect(page.locator('.result-item')).toHaveCount(1, { timeout: 580_000 })
    expect(magic.isPng(await resultBuffer(page))).toBe(true)
  })
})
