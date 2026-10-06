import React, { useEffect, useRef } from 'react'
import Icon from './Icon'
export default function Dialog({ title, onClose, children }) {
 const ref = useRef(null)
 useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close() }, [])
 return <dialog ref={ref} className="detail-dialog" aria-label={title} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose() }}><div className="dialog-inner"><div className="section-heading"><h2>{title}</h2><button autoFocus className="icon-button" aria-label="Закрыть" onClick={onClose}><Icon name="close"/></button></div>{children}</div></dialog>
}

