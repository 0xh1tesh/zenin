import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import type { RegistrationTone } from './StatusBadge'
import './ui.css'

/** Decorative rotated stamp. The same fact is always available as text elsewhere. */
export default function Stamp({ tone, children }: { tone: Exclude<RegistrationTone, 'open'>; children: ReactNode }) {
  return (
    <span className={cx('ui-stamp', `ui-stamp--${tone}`)} aria-hidden="true">
      {children}
    </span>
  )
}
