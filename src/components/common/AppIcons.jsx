/**
 * Ikon SVG berwarna pengganti emoji di UI.
 * props: size (number), className, title (opsional aksesibilitas)
 */
import './AppIcons.css'

function SvgShell({ size = 18, className = '', title, children, viewBox = '0 0 24 24' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox={viewBox}
            className={`app-icon ${className}`.trim()}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role={title ? 'img' : 'presentation'}
            aria-hidden={title ? undefined : true}
            aria-label={title}
        >
            {title ? <title>{title}</title> : null}
            {children}
        </svg>
    )
}

export function IconStar({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path
                d="M12 2.4l2.7 6.2 6.7.6-5.1 4.5 1.5 6.6L12 16.8 6.2 20.3l1.5-6.6L2.6 9.2l6.7-.6L12 2.4z"
                fill="#FBBF24"
                stroke="#D97706"
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
            <path d="M12 5.2l1.5 3.5 3.7.3-2.8 2.5.8 3.7L12 13.4" fill="#FDE68A" opacity="0.85" />
        </SvgShell>
    )
}

export function IconBooks({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <rect x="3" y="5" width="7" height="15" rx="1.2" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
            <rect x="4.2" y="7" width="4.6" height="1.2" rx="0.4" fill="#FDE68A" />
            <rect x="4.2" y="9.5" width="4.6" height="1.2" rx="0.4" fill="#FDE68A" />
            <rect x="10.5" y="4" width="7.5" height="16" rx="1.2" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
            <rect x="11.8" y="6.5" width="5" height="1.2" rx="0.4" fill="#BFDBFE" />
            <rect x="11.8" y="9" width="5" height="1.2" rx="0.4" fill="#BFDBFE" />
            <rect x="11.8" y="11.5" width="3.5" height="1.2" rx="0.4" fill="#BFDBFE" />
            <path d="M17.5 4.2c1.2-.4 2.8-.2 3.2 1.2V19c-.5-1.1-1.8-1.4-3.2-1" fill="#60A5FA" stroke="#1D4ED8" strokeWidth="0.9" />
        </SvgShell>
    )
}

export function IconTrophy({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M8 4h8v3.5c0 2.6-1.8 4.8-4 5.2-2.2-.4-4-2.6-4-5.2V4z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M8 5.2H5.5C4.7 5.2 4 5.9 4 6.7c0 2 1.3 3.4 3.2 3.8" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M16 5.2h2.5c.8 0 1.5.7 1.5 1.5 0 2-1.3 3.4-3.2 3.8" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
            <rect x="10.2" y="12.5" width="3.6" height="2.2" rx="0.6" fill="#F59E0B" />
            <path d="M8.5 20h7l-1.2-4.2H9.7L8.5 20z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" strokeLinejoin="round" />
            <circle cx="12" cy="8" r="1.3" fill="#FEF3C7" />
        </SvgShell>
    )
}

export function IconLock({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <rect x="5" y="10" width="14" height="11" rx="2.2" fill="#FBBF24" stroke="#B45309" strokeWidth="1.2" />
            <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="#64748B" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="12" cy="14.5" r="1.6" fill="#92400E" />
            <path d="M12 16v2.2" stroke="#92400E" strokeWidth="1.6" strokeLinecap="round" />
        </SvgShell>
    )
}

export function IconSparkles({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M12 2.5l1.4 4.2L17.5 8l-4.1 1.3L12 13.5l-1.4-4.2L6.5 8l4.1-1.3L12 2.5z" fill="#FDE047" stroke="#EAB308" strokeWidth="0.9" strokeLinejoin="round" />
            <path d="M18.5 13l.8 2.2 2.2.7-2.2.7-.8 2.2-.8-2.2-2.2-.7 2.2-.7.8-2.2z" fill="#A78BFA" stroke="#7C3AED" strokeWidth="0.8" />
            <path d="M5.5 14l.7 1.8 1.8.6-1.8.6-.7 1.8-.7-1.8-1.8-.6 1.8-.6.7-1.8z" fill="#F472B6" stroke="#DB2777" strokeWidth="0.8" />
        </SvgShell>
    )
}

export function IconPlay({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M8 5.5v13l11-6.5L8 5.5z" fill="#22C55E" stroke="#15803D" strokeWidth="1.1" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconParty({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M4 20l6.5-2.2L6.2 13.5 4 20z" fill="#F97316" stroke="#C2410C" strokeWidth="1" strokeLinejoin="round" />
            <path d="M9.2 16.5l8.3-8.3" stroke="#FBBF24" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="18.5" cy="5.5" r="1.3" fill="#EF4444" />
            <circle cx="14.5" cy="5" r="1.1" fill="#3B82F6" />
            <circle cx="20" cy="9" r="1.1" fill="#22C55E" />
            <circle cx="16.5" cy="10.5" r="1" fill="#A855F7" />
            <circle cx="12" cy="7.5" r="0.9" fill="#EC4899" />
        </SvgShell>
    )
}

export function IconThumbsUp({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M8 10.5V19H5.8c-.8 0-1.3-.6-1.3-1.3v-5.9c0-.7.5-1.3 1.3-1.3H8z" fill="#FDBA74" stroke="#C2410C" strokeWidth="1" />
            <path d="M8 10.8l2.2-5.2c.4-1 1.5-1.4 2.4-.9.5.3.7.9.6 1.5L12.8 9h5.2c1.2 0 2.1 1.1 1.9 2.3l-1 6.2c-.2 1.1-1.1 1.9-2.2 1.9H8V10.8z" fill="#FDBA74" stroke="#C2410C" strokeWidth="1" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconMuscle({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M4.5 14c0-2.2 1.5-3.5 3.2-3.5.7 0 1.3.2 1.8.6V9.2c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7v1.2c.4-.2.9-.3 1.4-.3 1.8 0 3.2 1.5 3.2 3.5 0 2.8-2 5.3-5.5 6.2-3.8-1-6.5-3.5-6.5-6.5z" fill="#FDBA74" stroke="#C2410C" strokeWidth="1.1" strokeLinejoin="round" />
            <circle cx="9.2" cy="13.2" r="1.2" fill="#FECACA" />
        </SvgShell>
    )
}

export function IconHand({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M8.2 11V6.2a1.2 1.2 0 0 1 2.4 0V11" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M10.6 11V5a1.2 1.2 0 0 1 2.4 0v6" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M13 11V5.8a1.2 1.2 0 0 1 2.4 0V11" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M15.4 11.2V7.5a1.2 1.2 0 0 1 2.4 0v6.2c0 3.2-2.2 5.5-5.3 5.5H11c-2.4 0-4.3-1.6-4.8-3.8L5.5 12a1.1 1.1 0 0 1 2.1-.6l.8 2.4" fill="#FDE68A" stroke="#D97706" strokeWidth="1.1" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconPoint({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M10 3.8a1.4 1.4 0 0 1 2.8 0V12l5.2-1.2a1.5 1.5 0 0 1 1.7 2.1l-3.3 6.2A3.5 3.5 0 0 1 13.2 21H9.5c-1.8 0-3.3-1.3-3.5-3.1L5.5 12a1.3 1.3 0 0 1 2.5-.5L9 14V3.8z" fill="#FDE68A" stroke="#D97706" strokeWidth="1.1" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconSun({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <circle cx="12" cy="12" r="4.2" fill="#FBBF24" stroke="#D97706" strokeWidth="1.1" />
            <g stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
            </g>
        </SvgShell>
    )
}

export function IconFire({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M12 2.5c1.5 2.8-.2 4.2-.2 6.2 0 1.3.8 2.2 2 2.8 1.6-2.5 2.8-4.2 2.8-6.8 2.4 2.6 3.7 4.8 3.7 7.8 0 4.2-3.3 7-6.3 7-3.2 0-6.5-2.6-6.5-7.2C7.5 8.2 10 5.5 12 2.5z" fill="#F97316" stroke="#C2410C" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M12 14.2c.6 1 .4 1.8.4 2.6 0 .7-.4 1.2-.9 1.6 1.8-.2 3-1.5 3-3.4 0-1.2-.7-2.1-1.5-2.8-.2.8-.6 1.5-1 2z" fill="#FDE047" />
        </SvgShell>
    )
}

export function IconLeaf({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M19.5 4.5c-6.5-.8-12.2 3.2-13.5 9.5-1 4.8 1.5 7.8 4.8 8 5.2.3 10.5-5.2 8.7-17.5z" fill="#34D399" stroke="#059669" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M8 20.5c2.5-3.5 5.5-6.2 10-8.5" stroke="#A7F3D0" strokeWidth="1.3" strokeLinecap="round" />
        </SvgShell>
    )
}

export function IconDroplet({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M12 2.8C12 2.8 5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.8 12 2.8z" fill="#60A5FA" stroke="#2563EB" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M9.2 14.2c0-1.8 1-3.2 1.8-4" stroke="#DBEAFE" strokeWidth="1.3" strokeLinecap="round" />
        </SvgShell>
    )
}

export function IconRainbow({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M4 16a8 8 0 0 1 16 0" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            <path d="M5.5 16a6.5 6.5 0 0 1 13 0" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 16a5 5 0 0 1 10 0" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
            <path d="M8.5 16a3.5 3.5 0 0 1 7 0" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 16a2 2 0 0 1 4 0" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
        </SvgShell>
    )
}

export function IconCalendar({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <rect x="3.5" y="5" width="17" height="15" rx="2.2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.2" />
            <path d="M3.5 9.2h17" stroke="#F59E0B" strokeWidth="1.2" />
            <path d="M8 3.5v3.2M16 3.5v3.2" stroke="#B45309" strokeWidth="1.6" strokeLinecap="round" />
            <rect x="7" y="12" width="3" height="3" rx="0.6" fill="#F97316" />
            <rect x="11.5" y="12" width="3" height="3" rx="0.6" fill="#FB923C" />
        </SvgShell>
    )
}

export function IconMap({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M4 6.5l5-2 6 2 5-2v13l-5 2-6-2-5 2v-13z" fill="#86EFAC" stroke="#059669" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M9 4.5v13M15 6.5v13" stroke="#059669" strokeWidth="1" opacity="0.7" />
            <circle cx="12" cy="11" r="2.2" fill="#EF4444" stroke="#B91C1C" strokeWidth="0.9" />
        </SvgShell>
    )
}

export function IconCheck({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <circle cx="12" cy="12" r="9" fill="#22C55E" stroke="#15803D" strokeWidth="1.2" />
            <path d="M7.5 12.2l2.8 2.8 6-6.2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconRefresh({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <circle cx="12" cy="12" r="9" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.2" />
            <path d="M16.5 8.2A5.5 5.5 0 0 0 8 9.5" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M7.5 15.8A5.5 5.5 0 0 0 16 14.5" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M16.5 5.8v3.2h-3.2M7.5 18.2v-3.2h3.2" stroke="#2563EB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconBook({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M5 5.5c2-.8 4-.5 5.5.5v12c-1.5-1-3.5-1.3-5.5-.5v-12z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
            <path d="M19 5.5c-2-.8-4-.5-5.5.5v12c1.5-1 3.5-1.3 5.5-.5v-12z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
        </SvgShell>
    )
}

export function IconPuzzle({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M9 4h4v2.2a1.8 1.8 0 1 0 0 3.6V12h2.2a1.8 1.8 0 1 0 3.6 0H21v4h-2.2a1.8 1.8 0 1 0-3.6 0H13v2.2a1.8 1.8 0 1 1-3.6 0V18H5v-4h2.2a1.8 1.8 0 1 0 0-3.6H5V6h4V4z" fill="#A78BFA" stroke="#6D28D9" strokeWidth="1.1" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconArrowRight({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M5 12h12" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M13 6l6 6-6 6" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconSchool({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M3 11l9-6 9 6v9H3v-9z" fill="#93C5FD" stroke="#1D4ED8" strokeWidth="1.1" strokeLinejoin="round" />
            <rect x="10" y="14" width="4" height="6" fill="#F59E0B" stroke="#B45309" strokeWidth="0.9" />
            <rect x="5.5" y="12.5" width="3" height="3" rx="0.4" fill="#DBEAFE" />
            <rect x="15.5" y="12.5" width="3" height="3" rx="0.4" fill="#DBEAFE" />
            <path d="M12 5l7 4.5H5L12 5z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconTarget({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <circle cx="12" cy="12" r="9" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.2" />
            <circle cx="12" cy="12" r="6" fill="#FECACA" stroke="#DC2626" strokeWidth="1.1" />
            <circle cx="12" cy="12" r="3" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" />
            <circle cx="12" cy="12" r="1.2" fill="#FEF2F2" />
        </SvgShell>
    )
}

export function IconCrown({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M4 17l1.5-9 3.5 4L12 5l3 7 3.5-4L20 17H4z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.1" strokeLinejoin="round" />
            <rect x="5" y="17" width="14" height="2.5" rx="0.8" fill="#F59E0B" />
            <circle cx="5.5" cy="8" r="1.2" fill="#FDE68A" />
            <circle cx="12" cy="5" r="1.2" fill="#FDE68A" />
            <circle cx="18.5" cy="8" r="1.2" fill="#FDE68A" />
        </SvgShell>
    )
}

export function IconFlag({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M6 3.5v17" stroke="#78716C" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 4.5h10l-2.2 3.2L17 11H7V4.5z" fill="#22C55E" stroke="#15803D" strokeWidth="1" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconBalloon({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <ellipse cx="12" cy="9" rx="6" ry="7" fill="#F472B6" stroke="#BE185D" strokeWidth="1.1" />
            <path d="M12 16l-1 2h2l-1-2z" fill="#BE185D" />
            <path d="M12 18c0 2 .5 3.5 0 4.5" stroke="#A8A29E" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="10" cy="7" rx="1.6" ry="2.2" fill="#FBCFE8" opacity="0.8" />
        </SvgShell>
    )
}

export function IconButterfly({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <ellipse cx="7" cy="9" rx="4.2" ry="5" fill="#A78BFA" stroke="#6D28D9" strokeWidth="1" />
            <ellipse cx="17" cy="9" rx="4.2" ry="5" fill="#F472B6" stroke="#BE185D" strokeWidth="1" />
            <ellipse cx="7.5" cy="15" rx="2.8" ry="3.2" fill="#C4B5FD" stroke="#6D28D9" strokeWidth="0.9" />
            <ellipse cx="16.5" cy="15" rx="2.8" ry="3.2" fill="#F9A8D4" stroke="#BE185D" strokeWidth="0.9" />
            <path d="M12 6v12" stroke="#57534E" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="12" cy="7.5" r="1.2" fill="#44403C" />
        </SvgShell>
    )
}

export function IconCandy({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M4 10c2-3 4-2 4-2s0 2.5 2.5 4.5S14 16 14 16s-2 2-5 1C5.5 16 4 13 4 10z" fill="#F9A8D4" stroke="#DB2777" strokeWidth="1" />
            <ellipse cx="14.5" cy="9.5" rx="5" ry="4.2" fill="#FDE68A" stroke="#D97706" strokeWidth="1.1" />
            <path d="M11.5 8.2c2 .2 3.5 1.2 4.2 2.8" stroke="#F97316" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M16 14c2 1.5 3.5 1 4 .5s0-2.5-1.5-3.5" fill="#A78BFA" stroke="#6D28D9" strokeWidth="0.9" />
        </SvgShell>
    )
}

export function IconFox({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M4 10l3-6 2.5 4H14.5L17 4l3 6-1.5 8.5H5.5L4 10z" fill="#FB923C" stroke="#C2410C" strokeWidth="1.1" strokeLinejoin="round" />
            <circle cx="9" cy="12" r="1.3" fill="#1C1917" />
            <circle cx="15" cy="12" r="1.3" fill="#1C1917" />
            <ellipse cx="12" cy="15.2" rx="1.6" ry="1.1" fill="#FDBA74" />
            <path d="M7 8.5l-1.5-3.5 3 2.2M17 8.5l1.5-3.5-3 2.2" fill="#FDBA74" stroke="#C2410C" strokeWidth="0.8" />
        </SvgShell>
    )
}

export function IconSleep({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <circle cx="12" cy="13" r="7.5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.1" />
            <path d="M8.5 12.5c.6-.6 1.5-.6 2 0M13.5 12.5c.6-.6 1.5-.6 2 0" stroke="#92400E" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M9.5 16c1.2 1 2.8 1 4 0" stroke="#92400E" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M16 5.5h4l-4 3h4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconGamepad({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <rect x="2.5" y="8" width="19" height="10" rx="4" fill="#64748B" stroke="#334155" strokeWidth="1.1" />
            <circle cx="8" cy="13" r="1.6" fill="#F8FAFC" />
            <path d="M7.2 13h1.6M8 12.2v1.6" stroke="#334155" strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="15" cy="12" r="1" fill="#EF4444" />
            <circle cx="17.2" cy="13.8" r="1" fill="#22C55E" />
            <circle cx="12.8" cy="13.8" r="1" fill="#3B82F6" />
            <circle cx="15" cy="15.5" r="1" fill="#FBBF24" />
        </SvgShell>
    )
}

export function IconCloud({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <path d="M7.5 17h10.2A4.3 4.3 0 0 0 18 8.6a5.5 5.5 0 0 0-10.4 1.4A3.8 3.8 0 0 0 7.5 17z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.1" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconUser({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <circle cx="12" cy="8" r="3.5" fill="#FDBA74" stroke="#C2410C" strokeWidth="1.1" />
            <path d="M5 19.5c1.5-3.5 4-5 7-5s5.5 1.5 7 5" fill="#93C5FD" stroke="#1D4ED8" strokeWidth="1.1" strokeLinejoin="round" />
        </SvgShell>
    )
}

export function IconLion({ size = 18, className = '', title }) {
    return (
        <SvgShell size={size} className={className} title={title}>
            <circle cx="12" cy="12" r="8" fill="#F59E0B" stroke="#B45309" strokeWidth="1.1" />
            <circle cx="12" cy="12.5" r="5.2" fill="#FDBA74" />
            <circle cx="10" cy="11.5" r="0.9" fill="#1C1917" />
            <circle cx="14" cy="11.5" r="0.9" fill="#1C1917" />
            <ellipse cx="12" cy="14" rx="1.2" ry="0.9" fill="#EA580C" />
            <path d="M9.5 15.5c1.5 1 3.5 1 5 0" stroke="#9A3412" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M4.5 8.5l2 2M19.5 8.5l-2 2M6 5.5l1.5 2.5M18 5.5l-1.5 2.5" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round" />
        </SvgShell>
    )
}

/** Map kunci hari / dekorasi → komponen ikon */
export const DAY_ICONS = {
    sun: IconSun,
    fire: IconFire,
    leaf: IconLeaf,
    droplet: IconDroplet,
    star: IconStar,
    rainbow: IconRainbow,
    party: IconParty,
    calendar: IconCalendar,
    book: IconBook,
    map: IconMap,
    check: IconCheck,
    refresh: IconRefresh,
}

export function DayIcon({ name, size = 18, className = '' }) {
    const Comp = DAY_ICONS[name] || IconCalendar
    return <Comp size={size} className={className} />
}
