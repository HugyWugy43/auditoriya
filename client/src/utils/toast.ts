export type ToastKind = 'success' | 'error' | 'info'

export interface ToastDetail {
  message: string
  kind: ToastKind
}

export function showToast(message: string, kind: ToastKind = 'info') {
  window.dispatchEvent(new CustomEvent<ToastDetail>('app:toast', { detail: { message, kind } }))
}
