import { getQuestionTypeConfig } from '../../utils/questionTypes'
import './TypeBadge.css'

export default function TypeBadge({ type, className = '' }) {
    const config = getQuestionTypeConfig(type)
    return (
        <span
            className={`type-badge${className ? ` ${className}` : ''}`}
            style={{ color: config.color, background: config.bg }}
        >
            {config.label}
        </span>
    )
}
