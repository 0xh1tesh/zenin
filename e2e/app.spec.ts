import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('landing', () => {
  test('shows the hero and leads to the events page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/zenin/i)
    await page.getByRole('link', { name: /explore events/i }).first().click()
    await expect(page).toHaveURL(/\/events$/)
  })
})

test.describe('events page', () => {
  test('renders events in batches of twelve and loads more on demand', async ({ page }) => {
    await page.goto('/events')
    await expect(page.locator('.ecard')).toHaveCount(12)
    // More arrive either through the button or the scroll sentinel, whichever fires first.
    const more = page.getByRole('button', { name: /load \d+ more/i })
    await expect
      .poll(async () => {
        if (await more.isVisible()) await more.click({ timeout: 1000 }).catch(() => undefined)
        return page.locator('.ecard').count()
      })
      .toBeGreaterThan(12)
  })

  test('keeps filters in the URL and clears them', async ({ page }) => {
    await page.goto('/events')
    await page.getByRole('switch', { name: 'Workshop' }).first().click()
    await expect(page).toHaveURL(/type=workshop/)
    await page.getByRole('button', { name: /clear all/i }).click()
    await expect(page).not.toHaveURL(/type=/)
  })

  test('restores filters from a shared link', async ({ page }) => {
    await page.goto('/events?kind=technical&open=1')
    await expect(page.getByRole('switch', { name: 'Technical' }).first()).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('switch', { name: /open only|open registration/i }).first()).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  test('ignores invalid filter values in the URL', async ({ page }) => {
    await page.goto('/events?kind=nonsense')
    await expect(page.locator('.ecard').first()).toBeVisible()
    await expect(page.getByRole('switch', { name: 'Technical' }).first()).toHaveAttribute('aria-checked', 'false')
  })

  test('shows an empty state with a way out when nothing matches', async ({ page }) => {
    await page.goto('/events?q=zzzzqqq')
    await expect(page.getByText(/nothing matches/i)).toBeVisible()
    await page.getByRole('button', { name: /clear filters/i }).click()
    await expect(page.locator('.ecard').first()).toBeVisible()
  })
})

test.describe('event detail', () => {
  test('opens from a card and shows the event title', async ({ page }) => {
    await page.goto('/events')
    const first = page.locator('.ecard a').first()
    const title = (await first.locator('.ecard__title').innerText()).trim()
    await first.click()
    await expect(page).toHaveURL(/\/events\/[\w-]+$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(title)
  })

  test('shows a friendly not-found state for an unknown event', async ({ page }) => {
    await page.goto('/events/00000000-0000-0000-0000-000000000000')
    await expect(page.getByText(/event not found/i)).toBeVisible({ timeout: 15_000 })
  })

  test('shows the 404 page for an unknown route', async ({ page }) => {
    await page.goto('/definitely/not/here')
    await expect(page.getByRole('heading', { name: /lost in space/i })).toBeVisible()
  })
})

for (const width of [375, 768, 1280]) {
  for (const path of ['/', '/events']) {
    test(`has no horizontal scroll at ${width}px on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
}

async function openFirstEvent(page: import('@playwright/test').Page) {
  await page.goto('/events')
  await page.locator('.ecard a').first().click()
  await expect(page).toHaveURL(/\/events\/[\w-]+$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

for (const width of [375, 768, 1280]) {
  test(`event detail has no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await openFirstEvent(page)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the hero is a single static screen, not a pinned scroll scene', async ({ page }) => {
    await page.goto('/')
    const heights = await page.evaluate(() => ({
      hero: document.querySelector('.hero')?.getBoundingClientRect().height ?? 0,
      viewport: window.innerHeight,
    }))
    expect(heights.hero).toBeLessThanOrEqual(heights.viewport + 2)
    await expect(page.getByRole('link', { name: /explore events/i }).first()).toBeVisible()
  })
})

test.describe('accessibility', () => {
  test('has no serious axe violations on an event page', async ({ page }) => {
    await openFirstEvent(page)
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(blocking.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([])
  })

  for (const path of ['/', '/events']) {
    test(`has no serious axe violations on ${path}`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(blocking.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([])
    })
  }
})

test.describe('scroll rocket', () => {
  test('rides to the end of the page, lands, and launches back to the top', async ({ page }) => {
    await page.goto('/events')
    await page.mouse.move(200, 300)
    // Wheel scrolling is the visitor's path (Lenis owns scrolling on desktop) and also mounts the lazy rocket.
    await expect
      .poll(
        async () => {
          await page.mouse.wheel(0, 4000)
          return page.getByRole('button', { name: /launch again/i }).isVisible()
        },
        { timeout: 20_000 },
      )
      .toBe(true)

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(blocking.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([])

    await page.getByRole('button', { name: /launch again/i }).click()
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeLessThan(5)
  })
})
