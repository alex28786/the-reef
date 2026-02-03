import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button, Card } from '../../../shared/components'
import { fetchRows } from '../../../shared/lib/supabaseApi'
import { useAuth } from '../../auth'
import type { Retro } from '../types'
import { CreateRetro } from '../components/CreateRetro'
import { BlindSubmission } from '../components/BlindSubmission'
import { RevealView } from '../components/RevealView'

export function RetroPage() {
    return (
        <Routes>
            <Route index element={<RetroList />} />
            <Route path="new" element={<CreateRetro />} />
            <Route path=":retroId/submit" element={<BlindSubmission />} />
            <Route path=":retroId/reveal" element={<RevealView />} />
        </Routes>
    )
}

function RetroList() {
    const { profile, accessToken } = useAuth()
    const navigate = useNavigate()
    const [retros, setRetros] = useState<Retro[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile?.reef_id && accessToken) {
            fetchRetrosData()
        }
    }, [profile?.reef_id, accessToken])

    async function fetchRetrosData() {
        if (!profile?.reef_id || !accessToken) return

        const { data, error } = await fetchRows<Retro>(
            'retros',
            accessToken,
            `&reef_id=eq.${profile.reef_id}&order=created_at.desc`
        )

        if (error) {
            console.error('Error fetching retros:', error)
        } else {
            setRetros(data || [])
        }
        setLoading(false)
    }

    function getStatusBadge(status: string) {
        const styles = {
            pending: 'bg-yellow-500/20 text-yellow-300',
            submitted: 'bg-blue-500/20 text-blue-300',
            revealed: 'bg-green-500/20 text-green-300',
        }
        return styles[status as keyof typeof styles] || styles.pending
    }

    function handleRetroClick(retro: Retro) {
        if (retro.status === 'revealed') {
            navigate(`/retro/${retro.id}/reveal`)
        } else {
            navigate(`/retro/${retro.id}/submit`)
        }
    }

    return (
        <div className="py-6">
            <div className="text-center mb-8">
                <div className="text-4xl mb-3">🐙</div>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">The Retro</h1>
                <p className="text-[var(--color-text-muted)] text-sm mt-1">
                    Let Octi help you untangle the past together
                </p>
            </div>

            <div className="max-w-lg mx-auto">
                <Button
                    onClick={() => navigate('/retro/new')}
                    className="w-full mb-6"
                >
                    <Plus size={20} />
                    Start New Retrospective
                </Button>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="text-3xl animate-bounce">🐙</div>
                        <p className="text-[var(--color-text-muted)] mt-2">Loading...</p>
                    </div>
                ) : retros.length === 0 ? (
                    <Card className="text-center py-8">
                        <p className="text-[var(--color-text-muted)]">
                            No retrospectives yet. Start one to work through a past event together.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {retros.map((retro) => (
                            <button
                                key={retro.id}
                                onClick={() => handleRetroClick(retro)}
                                className="w-full text-left"
                            >
                                <Card className="hover:border-[var(--color-seafoam)] transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-medium text-[var(--color-text)]">
                                                {retro.title}
                                            </h3>
                                            {retro.event_date && (
                                                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                                    Event: {new Date(retro.event_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(retro.status)}`}>
                                            {retro.status}
                                        </span>
                                    </div>
                                </Card>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
