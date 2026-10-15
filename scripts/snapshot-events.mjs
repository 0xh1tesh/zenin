/**
 * Build-time snapshot of the Events API.
 *   - writes public/events-snapshot.json  { generated_at, events, details }  (offline fallback, see src/lib/api.ts)
 *   - writes public/sitemap.xml          (home, events, and one URL per event)
 * If the API is unreachable, the last committed snapshot is kept so builds never break.
 */
import { access, readFile, writeFile } from 'node:fs/promises'

const BASE = 'https://render72.pages.dev/api/test'
const SITE_URL = (process.env.SITE_URL ?? 'https://zenin26.vercel.app').replace(/\/$/, '')
const SNAPSHOT = new URL('../public/events-snapshot.json', import.meta.url)
const SITEMAP = new URL('../public/sitemap.xml', import.meta.url)
const CONCURRENCY = 6

async function getJson(path) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(BASE + path, { signal: AbortSignal.timeout(8000) })
      if (res.ok) return await res.json()
      lastError = new Error(`HTTP ${res.status} for ${path}`)
    } catch (err) {
      lastError = err
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
  }
  throw lastError
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return results
}

function sitemapXml(events) {
  const urls = ['/', '/events', ...events.map((e) => `/events/${e.id}`)]
  const body = urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

async function exists(url) {
  try {
    await access(url)
    return true
  } catch {
    return false
  }
}

try {
  const { events } = await getJson('/events')
  if (!Array.isArray(events) || events.length === 0) throw new Error('API returned no events')
  const fetched = await mapLimit(events, CONCURRENCY, async (e) => [e.id, (await getJson(`/events/${e.id}`)).event])
  const snapshot = { generated_at: new Date().toISOString(), events, details: Object.fromEntries(fetched) }
  await writeFile(SNAPSHOT, JSON.stringify(snapshot))
  await writeFile(SITEMAP, sitemapXml(events))
  console.log(`snapshot: ${events.length} events written`)
} catch (err) {
  if (await exists(SNAPSHOT)) {
    const kept = JSON.parse(await readFile(SNAPSHOT, 'utf8'))
    await writeFile(SITEMAP, sitemapXml(kept.events))
    console.warn(`snapshot: API unreachable (${err.message}); keeping committed snapshot of ${kept.events.length} events`)
  } else {
    console.error(`snapshot: API unreachable and no committed snapshot (${err.message})`)
    process.exit(1)
  }
}
