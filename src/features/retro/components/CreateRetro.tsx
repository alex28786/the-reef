import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button, Card, Input, Textarea } from '../../../shared/components'
import { insertRow } from '../../../shared/lib/supabaseApi'
import { useAuth } from '../../auth'
import type { Retro } from '../types'

export function CreateRetro() {
    const { profile, accessToken } = useAuth()
    const navigate = useNavigate()
    const [title, setTitle] = useState('')
    const [eventDate, setEventDate] = useState('')
    const [context, setContext] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!profile?.reef_id || !title.trim() || !accessToken) return

        setLoading(true)
        setError('')

        try {
            const { data, error: insertError } = await insertRow<Retro>(
                'retros',
                accessToken,
                {
                    reef_id: profile.reef_id,
                    title: title.trim(),
                    event_date: eventDate || null,
                    status: 'pending',
                    ai_summary: context ? { initial_context: context } : {},
                }
            )

            if (insertError) throw insertError
            if (!data) throw new Error('No data returned')

            navigate(`/retro/${data.id}/submit`)
        } catch (err) {
            console.error(err)
            setError('Failed to create retrospective. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="py-6 max-w-lg mx-auto">
            <button
                onClick={() => navigate('/retro')}
                className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                <span>Back to Retros</span>
            </button>

            <div className="text-center mb-6">
                <div className="text-4xl mb-3">🐙</div>
                <h1 className="text-xl font-bold text-[var(--color-text)]">
                    Start a New Retrospective
                </h1>
                <p className="text-[var(--color-text-muted)] text-sm mt-1">
                    Pick a past event you both want to work through
                </p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="What event should we discuss?"
                        placeholder="e.g., The argument about vacation plans"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <Input
                        label="When did it happen? (optional)"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                    />

                    <Textarea
                        label="Any context to share? (optional)"
                        placeholder="Brief context that might help frame the discussion..."
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        rows={3}
                    />

                    <p className="text-xs text-[var(--color-text-muted)]">
                        🐙 Both of you will write your perspectives separately. Octi will help find the truth between your stories.
                    </p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4">
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        </div>
                    )}

                    <Button type="submit" disabled={loading || !title.trim()} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Retrospective'
                        )}
                    </Button>
                </form>
            </Card>
        </div>
    )
}
