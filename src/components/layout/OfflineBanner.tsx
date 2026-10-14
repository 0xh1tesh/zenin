import { useSyncExternalStore } from 'react'
import './layout.css'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

const getOnline = () => navigator.onLine

export default function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, getOnline, () => true)
  if (online) return null
  return (
    <div className="offline-banner" role="status">
      You&apos;re offline. We&apos;ll show saved events where we can.
    </div>
  )
}
