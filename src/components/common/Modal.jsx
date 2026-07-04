import { X } from 'lucide-react'

/**
 * Modal – reusable overlay + card wrapper.
 *
 * Props:
 *   onClose   – called when backdrop or close icon is clicked
 *   title     – optional heading rendered inside the card
 *   className – extra class(es) appended to modal-card (e.g. "modal-detail")
 *   children  – modal body content
 */
function Modal({ onClose, title, className = '', children }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-card${className ? ` ${className}` : ''}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                {(title || onClose) && (
                    <div className="modal-header">
                        {title ? (
                            <h2 id="modal-title" className="modal-title">{title}</h2>
                        ) : (
                            <span className="modal-header-spacer" aria-hidden="true" />
                        )}
                        {onClose && (
                            <button
                                type="button"
                                className="modal-close"
                                onClick={onClose}
                                aria-label="Tutup"
                            >
                                <X size={20} strokeWidth={2.25} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                )}
                <div className="modal-body">{children}</div>
            </div>
        </div>
    )
}

export default Modal
