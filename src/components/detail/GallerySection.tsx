import { type EventDetail } from '../../types'

interface GallerySectionProps {
  event: EventDetail
}

export default function GallerySection({ event }: GallerySectionProps) {
  if (!event.gallery_images || event.gallery_images.length === 0) return null

  return (
    <section id="gallery" className="detail-section" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" className="detail-section__heading">
        <span className="detail-section__heading-num">05</span>
        Gallery
      </h2>
      <div
        className="detail-gallery__grid"
        role="list"
        aria-label={`${event.gallery_images.length} event photos`}
      >
        {event.gallery_images.map((url, i) => (
          <div
            key={i}
            className="detail-gallery__item"
            role="listitem"
          >
            <img
              src={url}
              alt={`${event.name} gallery photo ${i + 1}`}
              loading="lazy"
              width={400}
              height={300}
              decoding="async"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
