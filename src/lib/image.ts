const PEXELS_HOST = 'images.pexels.com'
/** Same-origin path that Vercel (and the Vite dev server) proxy to Pexels: one connection, first-party. */
export const IMAGE_PROXY = '/img'

export type ImageFormat = 'webp' | 'jpeg'

function sized(u: URL, width: number, height: number | undefined, format: ImageFormat) {
  u.searchParams.set('auto', 'compress')
  u.searchParams.set('cs', 'tinysrgb')
  u.searchParams.set('w', String(width))
  if (height) {
    u.searchParams.set('h', String(Math.round(height)))
    u.searchParams.set('fit', 'crop')
  } else {
    u.searchParams.delete('h')
    u.searchParams.delete('fit')
  }
  if (format === 'webp') u.searchParams.set('fm', 'webp')
  else u.searchParams.delete('fm')
}

/**
 * Rewrites a Pexels URL to the requested size/format and serves it through the same-origin
 * proxy (`/img/...`). Other hosts are returned untouched.
 */
export function resizeImage(url: string, width: number, height?: number, format: ImageFormat = 'webp'): string {
  try {
    const u = new URL(url)
    if (u.hostname !== PEXELS_HOST) return url
    sized(u, width, height, format)
    return `${IMAGE_PROXY}${u.pathname}${u.search}`
  } catch {
    return url
  }
}

/** Absolute, directly-hosted variant for places that need a full URL (Open Graph, JSON-LD). */
export function externalImage(url: string, width: number, height?: number, format: ImageFormat = 'jpeg'): string {
  try {
    const u = new URL(url)
    if (u.hostname !== PEXELS_HOST) return url
    sized(u, width, height, format)
    return u.toString()
  } catch {
    return url
  }
}

export interface ResponsiveImage {
  src: string
  srcSet: string
  sizes: string
  /** Intrinsic size for the width/height attributes (prevents layout shift). */
  width: number
  height: number
}

export interface ResponsiveImageOptions {
  widths: readonly number[]
  /** width / height. `null` keeps the source aspect ratio (no crop). */
  ratio?: number | null
  sizes: string
  format?: ImageFormat
}

export function responsiveImage(url: string, opts: ResponsiveImageOptions): ResponsiveImage | null {
  if (!url) return null
  const ratio = opts.ratio === undefined ? 3 / 2 : opts.ratio
  const widths = [...opts.widths].sort((a, b) => a - b)
  const heightFor = (w: number) => (ratio ? w / ratio : undefined)
  const largest = widths[widths.length - 1]
  const mid = widths[Math.min(1, widths.length - 1)]
  return {
    src: resizeImage(url, mid, heightFor(mid), opts.format),
    srcSet: widths.map((w) => `${resizeImage(url, w, heightFor(w), opts.format)} ${w}w`).join(', '),
    sizes: opts.sizes,
    width: largest,
    height: Math.round(ratio ? largest / ratio : largest * 0.66),
  }
}
