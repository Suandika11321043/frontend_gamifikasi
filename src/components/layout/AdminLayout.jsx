import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

/**
 * AdminLayout – shared wrapper for all admin pages.
 * Handles responsive sidebar (mobile hamburger + overlay).
 */
function AdminLayout({ activePath, children }) {
    const [mobileOpen, setMobileOpen] = useState(false)

    // Auto-close overlay when resizing back to desktop
    useEffect(() => {
        const handler = () => {
            if (window.innerWidth > 768) setMobileOpen(false)
        }
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    // Prevent body scroll when overlay open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [mobileOpen])

    return (
        <div className="dashboard-wrapper">
            {/* Mobile overlay backdrop */}
            {mobileOpen && (
                <div
                    className="mobile-sidebar-overlay"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            <Sidebar
                activePath={activePath}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            <main className="dashboard-main">
                {/* Hamburger – only visible on mobile */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Buka menu navigasi"
                >
                    <Menu size={20} />
                </button>

                {children}
            </main>
        </div>
    )
}

export default AdminLayout
