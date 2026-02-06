import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, History, User, LogOut } from 'lucide-react'
import { useAuth } from '../features/auth'

interface LayoutProps {
    children: ReactNode
}

export function Layout({ children }: LayoutProps) {
    const { profile, signOut } = useAuth()
    const location = useLocation()

    const navItems = [
        { path: '/bridge', label: 'The Bridge', icon: MessageCircle, mascot: '🦭' },
        { path: '/retro', label: 'The Retro', icon: History, mascot: '🐙' },
    ]

    const isActive = (path: string) => location.pathname.startsWith(path)

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-[var(--color-surface)] border-b border-[var(--color-surface-hover)] px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl">🐚</span>
                        <span className="font-bold text-lg text-[var(--color-text)]">The Reef</span>
                    </Link>

                    {profile && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                <User size={18} />
                                <span className="text-sm font-medium text-[var(--color-text)]">{profile.display_name}</span>
                            </div>
                            <button
                                onClick={signOut}
                                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                                title="Sign out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pb-20 lg:pb-0">
                <div className="max-w-6xl mx-auto p-4">
                    {children}
                </div>
            </main>

            {/* Bottom Navigation (Mobile) / Side Navigation (Desktop) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-surface-hover)] lg:hidden">
                <div className="flex justify-around py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                  flex flex-col items-center gap-1 px-4 py-2 rounded-xl
                  transition-all duration-200
                  ${isActive(item.path)
                                        ? 'text-[var(--color-coral)]'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                    }
                `}
                            >
                                <div className="flex items-center gap-1">
                                    <span className="text-lg">{item.mascot}</span>
                                    <Icon size={20} />
                                </div>
                                <span className="text-xs">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Desktop Side Nav */}
            <nav className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 flex-col gap-2 p-2">
                {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200
                ${isActive(item.path)
                                    ? 'bg-[var(--color-surface)] text-[var(--color-coral)] border border-[var(--color-coral)]'
                                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
                                }
              `}
                        >
                            <span className="text-xl">{item.mascot}</span>
                            <Icon size={20} />
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
