import './detail-sections.css'

interface ListSectionProps {
  id: string
  title: string
  items: string[]
  num?: string
  isOrdered?: boolean
}

export default function ListSection({
  id,
  title,
  items,
  num = '02',
  isOrdered = false,
}: ListSectionProps) {
  if (!items || items.length === 0) return null

  return (
    <section id={id} className="detail-section" aria-labelledby={`${id}-heading`}>
      <div className="detail-section__header">
        <span className="detail-section__num">{num} //</span>
        <h2 id={`${id}-heading`} className="detail-section__title">
          {title}
        </h2>
      </div>
      <div className="detail-section__rule" aria-hidden="true" />

      {isOrdered ? (
        <ol className="detail-rules__list">
          {items.map((item, idx) => (
            <li key={idx} className="detail-rules__item">
              <span>{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="detail-checklist">
          {items.map((item, idx) => (
            <li key={idx} className="detail-checklist__item">
              <svg
                className="detail-checklist__icon"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
