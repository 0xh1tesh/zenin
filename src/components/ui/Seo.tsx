import { useLocation } from 'react-router-dom'

const SITE_NAME = "Zenith '26"
const SITE_URL: string =
  (import.meta.env.VITE_SITE_URL as string | undefined) ??
  (typeof window !== 'undefined' ? window.location.origin : '')

interface SeoProps {
  title: string
  description: string
  image?: string
  noindex?: boolean
}

/** React 19 hoists <title>/<meta>/<link> rendered here into <head>. */
export default function Seo({ title, description, image, noindex = false }: SeoProps) {
  const { pathname } = useLocation()
  const fullTitle = title.includes('Zenith') ? title : `${title} · ${SITE_NAME}`
  const url = `${SITE_URL}${pathname}`
  const img = image ?? `${SITE_URL}/og.png`

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex" />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
    </>
  )
}
