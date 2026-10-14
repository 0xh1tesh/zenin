import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

/**
 * The failure drills the judges describe: server errors, timeouts, empty and broken data.
 * The live API is replaced with deterministic responses so these never depend on the network.
 */
const LIST = /\/api\/test\/events$/
const SNAPSHOT = /\/events-snapshot\.json$/

const snapshot = JSON.parse(readFileSync(new URL('../public/events-snapshot.json', import.meta.url), 'utf8')) as {
  events: unknown[]
}

async function snapshotMissing(page: Page) {
  await page.route(SNAPSHOT, (route) => route.fulfill({ status: 404, body: 'not found' }))
}

test('retries three times, then shows the offline snapshot when the API returns 500', async ({ page }) => {
  let calls = 0
  await page.route(LIST, (route) => {
    calls += 1
    return route.fulfill({ status: 500, body: '{}' })
  })
  await page.goto('/events')
  await expect(page.getByText(/offline snapshot/i)).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.ecard').first()).toBeVisible()
  expect(calls).toBe(3)
})

test('tells the visitor it is retrying while the server keeps failing', async ({ page }) => {
  await snapshotMissing(page)
  await page.route(LIST, (route) => route.fulfill({ status: 503, body: '{}' }))
  await page.goto('/events')
  await expect(page.getByText(/retrying 2\/3/i)).toBeVisible({ timeout: 10_000 })
})

test('shows a branded error with a retry button when the network is down and nothing is cached', async ({ page }) => {
  await snapshotMissing(page)
  await page.route(LIST, (route) => route.abort('connectionrefused'))
  await page.goto('/events')
  await expect(page.getByRole('heading', { name: /signal lost/i })).toBeVisible({ timeout: 15_000 })

  await page.unroute(LIST)
  await page.route(LIST, (route) => route.fulfill({ json: snapshot }))
  await page.getByRole('button', { name: /try again/i }).click()
  await expect(page.locator('.ecard').first()).toBeVisible()
})

test('shows a friendly empty state when the API returns no events', async ({ page }) => {
  await page.route(LIST, (route) => route.fulfill({ json: { events: [] } }))
  await page.goto('/events')
  await expect(page.getByText(/no events yet/i)).toBeVisible()
})

test('survives a malformed response', async ({ page }) => {
  await snapshotMissing(page)
  await page.route(LIST, (route) => route.fulfill({ json: { unexpected: true } }))
  await page.goto('/events')
  await expect(page.getByRole('heading', { name: /garbled transmission/i })).toBeVisible({ timeout: 15_000 })
})

test('skips malformed items but keeps the valid ones', async ({ page }) => {
  // Archived events are hidden by default, so pick active ones.
  const valid = (snapshot.events as Array<{ event_status: string }>).filter((e) => e.event_status === 'ACTIVE').slice(0, 3)
  await page.route(LIST, (route) => route.fulfill({ json: { events: [...valid, { broken: true }, null] } }))
  await page.goto('/events')
  await expect(page.locator('.ecard')).toHaveCount(3)
})

test('?chaos=timeout simulates a slow server', async ({ page }) => {
  await page.goto('/events?chaos=timeout&snapshot=off')
  await expect(page.getByRole('heading', { name: /taking too long/i })).toBeVisible({ timeout: 25_000 })
})

test('?chaos=500 falls back to the snapshot and says so', async ({ page }) => {
  await page.goto('/events?chaos=500')
  await expect(page.getByText(/offline snapshot/i)).toBeVisible({ timeout: 15_000 })
})

test('an offline event page still opens from the snapshot', async ({ page }) => {
  await page.goto('/events')
  const first = page.locator('.ecard a').first()
  const href = await first.getAttribute('href')
  expect(href).toBeTruthy()

  await page.route(/\/api\/test\/events\/.+/, (route) => route.fulfill({ status: 500, body: '{}' }))
  await page.evaluate(() => localStorage.clear())
  await page.goto(href as string)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
})
