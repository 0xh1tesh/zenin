import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/**
 * Embeds the build-time event list in index.html (`#seed-events`) so first-time visitors
 * render cards immediately; the app always revalidates it against the live API.
 */
function seedEvents(): Plugin {
  return {
    name: 'seed-events',
    transformIndexHtml(html) {
      try {
        const snapshot = JSON.parse(readFileSync(new URL('./public/events-snapshot.json', import.meta.url), 'utf8')) as {
          generated_at?: string
          events?: unknown
        }
        // "<" is escaped so the payload can never close its own script tag.
        const seed = JSON.stringify({ generated_at: snapshot.generated_at, events: snapshot.events }).replace(/</g, '\\u003c')
        return html.replace('</head>', `    <script type="application/json" id="seed-events">${seed}</script>\n  </head>`)
      } catch {
        return html
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), seedEvents()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
  },
  server: {
    // Mirrors the production rewrite in vercel.json: /img/* -> images.pexels.com/*
    proxy: {
      '/img': {
        target: 'https://images.pexels.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/img/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      exclude: ['src/lib/motion.ts', 'src/lib/smoothScroll.ts', 'src/lib/useNow.ts', 'src/lib/useAsync.ts'],
      reporter: ['text', 'html'],
    },
  },
})
