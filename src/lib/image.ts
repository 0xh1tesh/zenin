const PEXELS_HOST = 'images.pexels.com'

export type ImageFormat = 'webp' | 'jpeg'

/** Rewrites a Pexels URL to the requested size/format. Other hosts are returned untouched. */
export function resizeImage(url: string, width: number, height?: number, format: ImageFormat = 'webp'): string {
  try {
    const u = new URL(url)
    if (u.hostname !== PEXELS_HOST) return url
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
