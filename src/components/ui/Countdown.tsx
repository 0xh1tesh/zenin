import { useNow } from '../../lib/useNow'
import { splitDuration } from '../../lib/format'
import { cx } from '../../lib/cx'
import './ui.css'

interface CountdownProps {
  /** ISO string, epoch ms or Date. */
  to: string | number | Date
  className?: string
  doneLabel?: string
  /** Hide seconds (cheaper to read in dense lists). */
  compact?: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Live `0D.23H.00M.34S` countdown on a single shared 1s ticker. */
export default function Countdown({ to, className, doneLabel = 'Closed', compact = false }: CountdownProps) {
  const now = useNow()
  const target = new Date(to).getTime()
  if (Number.isNaN(target)) return null

  const remaining = target - now
  if (remaining <= 0) return <span className={cx('ui-countdown ui-countdown--done', className)}>{doneLabel}</span>

  const { days, hours, minutes, seconds } = splitDuration(remaining)
  const text = `${days}D.${pad(hours)}H.${pad(minutes)}M${compact ? '' : `.${pad(seconds)}S`}`

  return (
    <span className={cx('ui-countdown', className)}>
      <span className="sr-only">{`${days} days ${hours} hours left`}</span>
      <span aria-hidden="true">{text}</span>
    </span>
  )
}
