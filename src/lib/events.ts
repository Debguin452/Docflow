export interface ToastDetail {
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
}

/** Fire-and-forget global toast; rendered by <ToastHost/>. */
export function notify(detail: ToastDetail): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<ToastDetail>('filedit:toast', { detail }))
}
