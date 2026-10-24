import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Info } from 'lucide-react'
import clsx from 'clsx'
import type { ToastDetail } from '../../lib/events'

interface Toast extends ToastDetail { id: number }

export default function ToastHost() {
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<number>()
  const seq = useRef(0)

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastDetail>).detail
      setToast({ ...detail, id: ++seq.current })
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setToast(null), 3800)
    }
    window.addEventListener('filedit:toast', onToast)
    return () => {
      window.removeEventListener('filedit:toast', onToast)
      window.clearTimeout(timer.current)
    }
  }, [])

  return (
    <div aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] pointer-events-none">
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 pl-3 pr-5 py-3 bg-white border border-gray-200 rounded-2xl shadow-xl animate-toast-in"
        >
          <span className="relative flex w-8 h-8 items-center justify-center shrink-0">
            {toast.type === 'success' && (
              <>
                <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ring-out" />
                <span className="relative w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="30" className="animate-check-draw" />
                  </svg>
                </span>
              </>
            )}
            {toast.type === 'error' && <AlertCircle className="w-8 h-8 text-red-500" />}
            {toast.type === 'info' && <Info className="w-8 h-8 text-primary-500" />}
          </span>
          <div>
            <p className={clsx('text-sm font-semibold', toast.type === 'error' ? 'text-red-700' : 'text-gray-900')}>
              {toast.title}
            </p>
            {toast.message && <p className="text-xs text-gray-500">{toast.message}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
