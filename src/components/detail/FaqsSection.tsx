import type { Faq } from '../../types'
import './detail-sections.css'

interface FaqsSectionProps {
  faqs: Faq[]
  num?: string
}

export default function FaqsSection({ faqs, num = '05' }: FaqsSectionProps) {
  if (!faqs || faqs.length === 0) return null

  return (
    <section id="faqs" className="detail-section" aria-labelledby="faqs-heading">
      <div className="detail-section__header">
        <span className="detail-section__num">{num} //</span>
        <h2 id="faqs-heading" className="detail-section__title">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="detail-section__rule" aria-hidden="true" />

      <div className="detail-faqs__list" role="list">
        {faqs.map((faq, i) => (
          <details key={i} className="detail-faq" role="listitem">
            <summary className="detail-faq__summary">
              <span>{faq.question}</span>
              <svg
                className="detail-faq__chevron"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <p className="detail-faq__answer">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
