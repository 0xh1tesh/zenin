import { responsiveImage } from '../../lib/image'
import './detail-sections.css'

interface GallerySectionProps {
  images: string[]
  eventName: string
  num?: string
}

export default function GallerySection({ images, eventName, num = '06' }: GallerySectionProps) {
  if (!images || images.length === 0) return null

  return (
    <section id="gallery" className="detail-section" aria-labelledby="gallery-heading">
      <div className="detail-section__header">
        <span className="detail-section__num">{num} //</span>
        <h2 id="gallery-heading" className="detail-section__title">
          Gallery
        </h2>
      </div>
      <div className="detail-section__rule" aria-hidden="true" />

      <div
        className="detail-gallery__grid"
        role="list"
        aria-label={`${images.length} event photos`}
      >
        {images.map((url, i) => {
          const resp = responsiveImage(url, {
            widths: [360, 600, 900],
            ratio: 4 / 3,
            sizes: '(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 100vw',
          })

          return (
            <div key={i} className="detail-gallery__item" role="listitem">
              <img
                src={resp?.src ?? url}
                srcSet={resp?.srcSet}
                sizes={resp?.sizes}
                width={resp?.width ?? 600}
                height={resp?.height ?? 450}
                alt={`${eventName} photo ${i + 1}`}
                className="detail-gallery__img"
                loading="lazy"
                decoding="async"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
