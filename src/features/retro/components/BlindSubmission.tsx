import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, CheckCircle, Clock } from 'lucide-react'
import { Button, Card, Textarea } from '../../../shared/components'
import { fetchSingleRow, fetchRows, insertRow, updateRow } from '../../../shared/lib/supabaseApi'
import { useAuth } from '../../auth'
import type { Retro, RetroSubmission } from '../types'

export function BlindSubmission() {
    const { retroId } = useParams<{ retroId: string }>()
    const { profile, accessToken } = useAuth()
    const navigate = useNavigate()
    const [retro, setRetro] = useState<Retro | null>(null)
    const [existingSubmission, setExistingSubmission] = useState<RetroSubmission | null>(null)
    const [partnerSubmitted, setPartnerSubmitted] = useState(false)
    const [narrative, setNarrative] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (retroId && profile?.id && accessToken) {
            fetchData()
        }
    }, [retroId, profile?.id, accessToken])

    async function fetchData() {
        if (!accessToken || !retroId || !profile?.id) return
        setLoading(true)

        // Fetch retro
        const { data: retroData, error: retroError } = await fetchSingleRow<Retro>(
            'retros',
            accessToken,
            `&id=eq.${retroId}`
        )

        if (retroError || !retroData) {
            console.error(retroError)
            setLoading(false)
            return
        }

        setRetro(retroData)

        // Check for existing submission
        const { data: submissionData } = await fetchSingleRow<RetroSubmission>(
            'retro_submissions',
            accessToken,
            `&retro_id=eq.${retroId}&author_id=eq.${profile.id}`
        )

        if (submissionData) {
            setExistingSubmission(submissionData)
            setNarrative(submissionData.raw_narrative)
        }

        // Check if partner has submitted
        const { data: partnerSubmissions } = await fetchRows<RetroSubmission>(
            'retro_submissions',
            accessToken,
            `&retro_id=eq.${retroId}&author_id=neq.${profile.id}`
        )

        setPartnerSubmitted((partnerSubmissions?.length || 0) > 0)
        setLoading(false)
    }

    async function handleSubmit() {
        if (!retroId || !profile?.id || !narrative.trim() || !accessToken) return

        setSubmitting(true)
        setError('')

        try {
            if (existingSubmission) {
                // Update existing
                const { error: updateError } = await updateRow(
                    'retro_submissions',
                    accessToken,
                    `id=eq.${existingSubmission.id}`,
                    {
                        raw_narrative: narrative.trim(),
                        submitted_at: new Date().toISOString(),
                    }
                )

                if (updateError) throw updateError
            } else {
                // Create new
                const { error: insertError } = await insertRow(
                    'retro_submissions',
                    accessToken,
                    {
                        retro_id: retroId,
                        author_id: profile.id,
                        raw_narrative: narrative.trim(),
                    }
                )

                if (insertError) throw insertError
            }

            // Check if both have now submitted
            const { data: allSubmissions } = await fetchRows<RetroSubmission>(
                'retro_submissions',
                accessToken,
                `&retro_id=eq.${retroId}`
            )

            if (allSubmissions?.length === 2) {
                // Both submitted - update retro status
                await updateRow(
                    'retros',
                    accessToken,
                    `id=eq.${retroId}`,
                    { status: 'submitted' }
                )

                // Trigger AI analysis (in production, this would call an Edge Function)
                navigate(`/retro/${retroId}/reveal`)
            } else {
                // Waiting for partner
                await fetchData()
            }
        } catch (err) {
            console.error(err)
            setError('Failed to submit. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="text-4xl animate-bounce">🐙</div>
                <p className="text-[var(--color-text-muted)] mt-2">Loading...</p>
            </div>
        )
    }

    if (!retro) {
        return (
            <div className="text-center py-12">
                <p className="text-[var(--color-text-muted)]">Retrospective not found</p>
            </div>
        )
    }

    const isRevealReady = existingSubmission && partnerSubmitted

    return (
        <div className="py-6 max-w-lg mx-auto">
            <button
                onClick={() => navigate('/retro')}
                className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                <span>Back to Retros</span>
            </button>

            <Card className="mb-6">
                <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">
                    {retro.title}
                </h1>
                {retro.event_date && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                        Event date: {new Date(retro.event_date).toLocaleDateString()}
                    </p>
                )}
            </Card>

            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Card className={existingSubmission ? 'border-green-500/50' : ''}>
                    <div className="flex items-center gap-2">
                        {existingSubmission ? (
                            <CheckCircle className="text-green-400" size={18} />
                        ) : (
                            <Clock className="text-yellow-400" size={18} />
                        )}
                        <span className="text-sm text-[var(--color-text)]">Your story</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {existingSubmission ? 'Submitted' : 'Not yet submitted'}
                    </p>
                </Card>

                <Card className={partnerSubmitted ? 'border-green-500/50' : ''}>
                    <div className="flex items-center gap-2">
                        {partnerSubmitted ? (
                            <CheckCircle className="text-green-400" size={18} />
                        ) : (
                            <Clock className="text-yellow-400" size={18} />
                        )}
                        <span className="text-sm text-[var(--color-text)]">Partner's story</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {partnerSubmitted ? 'Submitted' : 'Waiting...'}
                    </p>
                </Card>
            </div>

            {isRevealReady ? (
                <Card className="text-center py-6">
                    <div className="text-4xl mb-3">🐙</div>
                    <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">
                        Both stories submitted!
                    </h2>
                    <p className="text-[var(--color-text-muted)] text-sm mb-4">
                        Octi is ready to help you compare perspectives.
                    </p>
                    <Button onClick={() => navigate(`/retro/${retroId}/reveal`)} className="w-full">
                        View The Reveal
                    </Button>
                </Card>
            ) : (
                <Card>
                    <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">
                        Write your perspective
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)] mb-4">
                        🐙 Share what happened from YOUR point of view. Be honest - your partner won't see this until you both submit.
                    </p>

                    <Textarea
                        placeholder="I remember that day... Here's what happened from my perspective..."
                        value={narrative}
                        onChange={(e) => setNarrative(e.target.value)}
                        rows={8}
                        className="mb-4"
                    />

                    {error && (
                        <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
                    )}

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !narrative.trim()}
                        className="w-full"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Submitting...
                            </>
                        ) : existingSubmission ? (
                            'Update My Story'
                        ) : (
                            'Submit My Story'
                        )}
                    </Button>
                </Card>
            )}
        </div>
    )
}
