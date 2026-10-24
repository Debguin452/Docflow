import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

/** Everything runs locally, so being offline is fine. Say so instead of alarming people. */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)

  useEffect(() => {
    const off = () => setOffline(true)
    const on = () => setOffline(false)
    window.addEventListener('offline', off)
    window.addEventListener('online', on)
    return () => {
      window.removeEventListener('offline', off)
      window.removeEventListener('online', on)
    }
  }, [])

  if (!offline) return null
  return (
    <div
      role="status"
      className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-900 text-white text-xs font-medium shadow-lg animate-toast-in"
    >
      <WifiOff className="w-3.5 h-3.5" />
      You&rsquo;re offline &mdash; your files never needed the internet anyway
    </div>
  )
}
