import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../shared/components'
import { useAuth } from '../../features/auth'
import { fetchRows } from '../../shared/lib/supabaseApi'
import { Bell, ListTodo } from 'lucide-react'
import type { BridgeMessage } from '../../features/bridge/types'
import type { Retro, RetroSubmission } from '../../features/retro/types'

export function HomePage() {
    const { profile, accessToken } = useAuth()
    const [newMessageCount, setNewMessageCount] = useState(0)
    const [openRetroCount, setOpenRetroCount] = useState(0)

    useEffect(() => {
        async function fetchIndicators() {
            if (!profile?.reef_id || !accessToken) return

            // 1. Check for new queries (Received & Unacknowledged)
            const { data: messages } = await fetchRows<BridgeMessage>(
                'bridge_messages',
                accessToken,
                `&reef_id=eq.${profile.reef_id}&recipient_id=eq.${profile.id}&acknowledged_at=is.null`
            )
            setNewMessageCount(messages?.length || 0)

            // 2. Check for open retro to-dos (Pending retros where I haven't submitted)
            // First get pending retros
            const { data: pendingRetros } = await fetchRows<Retro>(
                'retros',
                accessToken,
                `&reef_id=eq.${profile.reef_id}&status=eq.pending`
            )

            if (pendingRetros && pendingRetros.length > 0) {
                // Get my submissions
                const { data: mySubmissions } = await fetchRows<RetroSubmission>(
                    'retro_submissions',
                    accessToken,
                    `&author_id=eq.${profile.id}`
                )

                const submittedRetroIds = new Set(mySubmissions?.map((s) => s.retro_id))
                const todos = pendingRetros.filter((r) => !submittedRetroIds.has(r.id))
                setOpenRetroCount(todos.length)
            } else {
                setOpenRetroCount(0)
            }
        }

        if (profile?.reef_id && accessToken) {
            fetchIndicators()
        }
    }, [profile?.reef_id, profile?.id, accessToken])

    return (
        <div className="py-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
                    Welcome to Your Reef
                </h1>
                <p className="text-[var(--color-text-muted)]">
                    Choose where you'd like to go today
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
                {/* The Bridge */}
                <Link to="/bridge">
                    <Card className="h-full hover:border-[var(--color-coral)] transition-colors cursor-pointer group relative overflow-hidden py-6">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl group-hover:scale-110 transition-transform">
                                🦭
                            </div>
                            <div className="flex-1 text-left">
                                <h2 className="text-lg font-bold text-[var(--color-text)]">
                                    The Bridge
                                </h2>
                                <p className="text-[var(--color-text-muted)] text-xs">
                                    Conflict resolution
                                </p>
                            </div>
                            {newMessageCount > 0 && (
                                <div className="bg-[var(--color-coral)] text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-lg animate-pulse">
                                    <Bell size={12} fill="currentColor" />
                                    {newMessageCount} New
                                </div>
                            )}
                        </div>
                    </Card>
                </Link>

                {/* The Retro */}
                <Link to="/retro">
                    <Card className="h-full hover:border-[var(--color-seafoam)] transition-colors cursor-pointer group relative overflow-hidden py-6">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl group-hover:scale-110 transition-transform">
                                🐙
                            </div>
                            <div className="flex-1 text-left">
                                <h2 className="text-lg font-bold text-[var(--color-text)]">
                                    The Retro
                                </h2>
                                <p className="text-[var(--color-text-muted)] text-xs">
                                    Understand perspectives
                                </p>
                            </div>
                            {openRetroCount > 0 && (
                                <div className="bg-[var(--color-seafoam)] text-[var(--color-navy)] px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-lg">
                                    <ListTodo size={12} />
                                    {openRetroCount} To-Do
                                </div>
                            )}
                        </div>
                    </Card>
                </Link>
            </div>

            <div className="mt-8 flex justify-center gap-4">
                {/* Quick Actions (if needed in future, or keep clean) */}
            </div>
        </div>
    )
}
