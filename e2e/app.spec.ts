import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('landing', () => {
  test('shows the hero and leads to the events page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/zenith/i)
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

test.describe('accessibility', () => {
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
