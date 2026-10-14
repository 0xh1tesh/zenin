import { useEffect, useState, type MouseEvent } from 'react'
import { cx } from '../../lib/cx'
import { prefersReducedMotion } from '../../lib/motion'
import './detail-nav.css'

export interface NavSection {
  id: string
  label: string
  num: string
}

interface SectionNavProps {
  sections: NavSection[]
}

export default function SectionNav({ sections }: SectionNavProps) {
  const [activeId, setActiveId] = useState<string>(() => sections[0]?.id || '')

  useEffect(() => {
    if (sections.length === 0 || typeof window === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          const topEntry = visible.reduce((prev, curr) =>
            Math.abs(prev.boundingClientRect.top) < Math.abs(curr.boundingClientRect.top)
              ? prev
              : curr,
          )
          if (topEntry.target.id) {
            setActiveId(topEntry.target.id)
          }
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      },
    )

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  const handleClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
      setActiveId(id)
      window.history.replaceState(null, '', `#${id}`)
    }
  }

  if (sections.length <= 1) return null

  return (
    <nav className="detail-nav-bar" aria-label="Table of contents">
      <div className="container">
        <ul className="detail-nav" role="tablist">
          {sections.map((sec) => {
            const isActive = activeId === sec.id
            return (
              <li key={sec.id} className="detail-nav__item" role="presentation">
                <a
                  href={`#${sec.id}`}
                  role="tab"
                  aria-selected={isActive}
                  className={cx('detail-nav__link', isActive && 'is-active')}
                  onClick={(e) => handleClick(e, sec.id)}
                >
                  <span className="detail-nav__num">{sec.num}</span>
                  <span>{sec.label}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
