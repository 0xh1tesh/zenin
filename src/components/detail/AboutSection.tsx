import { splitDescription } from './helpers'
import './detail-sections.css'

interface AboutSectionProps {
  description: string
  num?: string
}

export default function AboutSection({ description, num = '01' }: AboutSectionProps) {
  const paragraphs = splitDescription(description)
  if (paragraphs.length === 0) return null

  return (
    <section id="about" className="detail-section" aria-labelledby="about-heading">
      <div className="detail-section__header">
        <span className="detail-section__num">{num} //</span>
        <h2 id="about-heading" className="detail-section__title">
          About
        </h2>
      </div>
      <div className="detail-section__rule" aria-hidden="true" />

      <div className="detail-about__body">
        {paragraphs.map((para, i) => (
          <p key={i} className="detail-about__para">
            {para}
          </p>
        ))}
      </div>
    </section>
  )
}
