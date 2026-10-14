import { type EventDetail } from '../../types'

interface FaqsSectionProps {
  event: EventDetail
}

export default function FaqsSection({ event }: FaqsSectionProps) {
  if (!event.faqs || event.faqs.length === 0) return null

  return (
    <section id="faqs" className="detail-section" aria-labelledby="faqs-heading">
      <h2 id="faqs-heading" className="detail-section__heading">
        <span className="detail-section__heading-num">04</span>
        FAQs
      </h2>
      <div className="detail-faqs__list" role="list">
        {event.faqs.map((faq, i) => (
          <details key={i} className="detail-faq" role="listitem">
            <summary>
              {faq.question}
              <span className="sr-only">{' '}(click to expand)</span>
            </summary>
            <p className="detail-faq__answer">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
