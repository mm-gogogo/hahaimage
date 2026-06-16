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

  test('最近使用：访问工具后出现在首页', async ({ page }) => {
    await page.goto('/#/crop')
    await expect(page.locator('.tool-head h1')).toHaveText('裁剪图片')
    await page.goto('/#/')
    const recentSection = page.locator('section', { has: page.locator('#cat-recent') })
    await expect(recentSection.getByRole('heading', { name: /最近使用/ })).toBeVisible()
    await expect(recentSection.locator('.tool-card h3')).toHaveText('裁剪图片')
  })

  test('Ctrl+V 粘贴图片上传', async ({ page }) => {
    await page.goto('/#/compress')
    await expect(page.locator('.dropzone')).toBeVisible() // 等懒加载页面挂载粘贴监听
    await page.evaluate(() => {
      const c = document.createElement('canvas')
      c.width = 32
      c.height = 32
      c.getContext('2d')!.fillRect(0, 0, 32, 32)
      return new Promise<void>(resolve => {
        c.toBlob(blob => {
          const dt = new DataTransfer()
          dt.items.add(new File([blob!], 'pasted.png', { type: 'image/png' }))
          window.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt }))
          resolve()
        }, 'image/png')
      })
    })
    await expect(page.locator('.file-item .name')).toHaveText('pasted.png')
  })

  test('无障碍：首个 Tab 命中跳转链接并可跳到主内容', async ({ page }) => {
    await page.goto('/#/')
    await page.keyboard.press('Tab')
    const focusedClass = await page.evaluate(() => document.activeElement?.className)
    expect(focusedClass).toContain('skip-link')
    await page.keyboard.press('Enter')
    const focusedId = await page.evaluate(() => document.activeElement?.id)
    expect(focusedId).toBe('main-content')
  })

  test('页脚链接触控目标 ≥38px', async ({ page }) => {
    await page.goto('/#/')
    const heights = await page.locator('.footer-col a').evaluateAll(els =>
      els.map(e => Math.round(e.getBoundingClientRect().height)),
    )
    expect(heights.length).toBeGreaterThanOrEqual(3)
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(38)
  })

  test('说明页可达：关于 / FAQ / 隐私 / 社群', async ({ page }) => {
    for (const [path, heading] of [
      ['/about', '关于哈哈图片'],
      ['/faq', '常见问题'],
      ['/privacy', '隐私说明'],
      ['/community', '加入社群'],
    ]) {
      await page.goto(`/#${path}`)
      await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
    }
  })

  test('FAQ 折叠项可展开', async ({ page }) => {
    await page.goto('/#/faq')
    const items = page.locator('.faq-item')
    await expect(items.first()).toBeVisible()
    expect(await items.count()).toBeGreaterThanOrEqual(6)
    const second = items.nth(1)
    await expect(second).toHaveJSProperty('open', false)
    await second.locator('summary').click()
    await expect(second).toHaveJSProperty('open', true)
  })

  test('页脚社群入口默认指向社群页', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.locator('.footer-col a[href*="community"]')).toHaveCount(1)
  })

  test('未知路由显示 404 兜底页并可返回', async ({ page }) => {
    await page.goto('/#/this-tool-does-not-exist')
    await expect(page.locator('.notfound-code')).toHaveText('404')
    await expect(page.getByRole('heading', { name: '没有找到这个页面' })).toBeVisible()
    await page.getByRole('link', { name: /返回全部工具/ }).click()
    await expect(page.locator('.tool-card')).toHaveCount(19)
  })

  test('社交分享 meta + PWA manifest 就位', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /哈哈图片/)
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', /#/)
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(manifestHref).toBeTruthy()
    const manifest = await page.evaluate(async href => {
      const r = await fetch(href!)
      return r.ok ? await r.json() : null
    }, manifestHref)
    expect(manifest?.short_name).toBe('哈哈图片')
    expect(manifest?.icons?.length).toBeGreaterThanOrEqual(1)
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
