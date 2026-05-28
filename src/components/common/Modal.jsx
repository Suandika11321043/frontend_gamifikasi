/**
 * Modal – reusable overlay + card wrapper.
 *
 * Props:
 *   onClose   – called when backdrop is clicked
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
            >
                {title && <h2 className="modal-title">{title}</h2>}
                <div className="modal-body">{children}</div>
            </div>
        </div>
    )
}

export default Modal
