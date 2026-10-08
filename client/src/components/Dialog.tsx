import { useEffect, useRef, type ReactNode } from 'react'
import Icon from './Icon'
interface DialogProps {
 title: string
 onClose: () => void
 children: ReactNode
}

export default function Dialog({ title, onClose, children }: DialogProps) {
 const ref = useRef<HTMLDialogElement>(null)
 useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close() }, [])
 return <dialog ref={ref} className="detail-dialog" aria-label={title} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose() }}><div className="dialog-inner"><div className="section-heading"><h2>{title}</h2><button autoFocus className="icon-button" aria-label="Закрыть" onClick={onClose}><Icon name="close"/></button></div>{children}</div></dialog>
}

