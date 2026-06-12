import { expect, test } from '@playwright/test'

test.describe('站点框架', () => {
  test('首页渲染全部分类与工具卡片', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.getByRole('heading', { name: '免费开源的在线图片工具箱' })).toBeVisible()
    await expect(page.locator('.cat-section')).toHaveCount(4)
    await expect(page.locator('.tool-card')).toHaveCount(19)
    await expect(page.locator('.privacy-pill')).toContainText('本地完成')
  })

  test('搜索过滤工具', async ({ page }) => {
    await page.goto('/#/')
    await page.getByLabel('搜索工具').fill('水印')
    await expect(page.locator('.tool-card')).toHaveCount(1)
    await expect(page.locator('.tool-card h3')).toHaveText('图片加水印')
    await page.getByLabel('搜索工具').fill('不存在的工具xyz')
    await expect(page.locator('.tool-card')).toHaveCount(0)
    await expect(page.getByRole('status')).toContainText('没有找到')
  })

  test('明暗主题切换', async ({ page }) => {
    await page.goto('/#/')
    const initial = await page.evaluate(() => document.documentElement.dataset.theme)
    await page.getByRole('button', { name: /切换到.*模式/ }).click()
    const after = await page.evaluate(() => document.documentElement.dataset.theme)
    expect(after).not.toBe(initial)
    expect(['light', 'dark']).toContain(after)
  })

  test('所有工具路由可达且无 JS 错误', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('/#/')
    const paths = await page.locator('.tool-card').evaluateAll(els =>
      els.map(el => (el as HTMLAnchorElement).hash),
    )
    expect(paths.length).toBe(19)
    for (const hash of paths) {
      await page.goto(`/${hash}`)
      await expect(page.locator('.tool-head h1')).toBeVisible()
    }
    expect(errors).toEqual([])
  })

  test('admin 配置生成器输出正确 JSON', async ({ page }) => {
    await page.goto('/#/admin')
    await page.getByLabel('Google Analytics 4 ID').fill('G-TEST123')
    await page.getByLabel('umami 脚本地址').fill('https://a.example.com/script.js')
    await page.getByLabel('umami Website ID').fill('abc-123')
    await page.getByRole('checkbox', { name: '启用广告位' }).check()
    await page.getByLabel(/首页顶部/).fill('<div>ad</div>')
    const json = JSON.parse(await page.locator('textarea[readonly]').inputValue())
    expect(json.analytics.googleAnalyticsId).toBe('G-TEST123')
    expect(json.analytics.umami).toEqual({ src: 'https://a.example.com/script.js', websiteId: 'abc-123' })
    expect(json.ads.enabled).toBe(true)
    expect(json.ads.slots['home-top'].html).toBe('<div>ad</div>')
    await page.getByRole('button', { name: '保存到本浏览器预览' }).click()
    await expect(page.getByRole('status')).toContainText('已保存')
  })

  test('本地配置注入广告位与统计脚本', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'hahaimage.config.override',
        JSON.stringify({
          analytics: { googleAnalyticsId: 'G-INJECT1' },
          ads: { enabled: true, slots: { 'home-top': { html: '<b id="test-ad">AD</b>' } } },
        }),
      )
    })
    await page.goto('/#/')
    await expect(page.locator('#test-ad')).toHaveText('AD')
    await expect(page.locator('.ad-slot-label').first()).toHaveText('广告')
    await expect
      .poll(() =>
        page.evaluate(() =>
          Boolean(document.querySelector('script[src*="googletagmanager.com/gtag/js?id=G-INJECT1"]')),
        ),
      )
      .toBe(true)
  })

  test('移动端 375px 无横向滚动', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 })
    await page.goto('/#/')
    const hScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hScroll).toBe(false)
  })
})
