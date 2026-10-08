import { useEffect, useRef, useState } from 'react'
import type { ToastDetail } from '../utils/toast'

interface Toast extends ToastDetail {
  id: number
}

function ToastViewport() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, number>())

  useEffect(() => {
    const remove = (id: number) => {
      const timer = timers.current.get(id)
      if (timer !== undefined) window.clearTimeout(timer)
      timers.current.delete(id)
      setToasts(current => current.filter(toast => toast.id !== id))
    }

    const handleToast = (event: Event) => {
      const { message, kind } = (event as CustomEvent<ToastDetail>).detail
      const id = ++nextId.current
      setToasts(current => [...current.slice(-2), { id, message, kind }])
      timers.current.set(id, window.setTimeout(() => remove(id), 5000))
    }

    window.addEventListener('app:toast', handleToast)
    return () => {
      window.removeEventListener('app:toast', handleToast)
      timers.current.forEach(timer => window.clearTimeout(timer))
      timers.current.clear()
    }
  }, [])

  return (
    <div className="toast-viewport" aria-live="polite" aria-label="Уведомления">
      {toasts.map(toast => (
        <div className={`toast toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'} key={toast.id}>
          <span className="toast-mark" aria-hidden="true">{toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '!' : 'i'}</span>
          <p>{toast.message}</p>
          <button type="button" className="toast-close" aria-label="Закрыть уведомление" onClick={() => {
            const timer = timers.current.get(toast.id)
            if (timer !== undefined) window.clearTimeout(timer)
            timers.current.delete(toast.id)
            setToasts(current => current.filter(item => item.id !== toast.id))
          }}>×</button>
        </div>
      ))}
    </div>
  )
}

export default ToastViewport
