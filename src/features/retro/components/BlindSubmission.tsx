import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, CheckCircle, Clock } from 'lucide-react'
import { Button, Card, Textarea } from '../../../shared/components'
import { fetchRows, insertRow, updateRow } from '../../../shared/lib/supabaseApi'
import { useAuth } from '../../auth'
import { checkRetroStatus } from '../utils/aiService'
import { callRpc } from '../../../shared/lib/supabaseApi'
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


    const fetchData = useCallback(async () => {
        if (!accessToken || !retroId || !profile?.id) return
        setLoading(true)

        // Fetch retro
        const { data: retros, error: retroError } = await fetchRows<Retro>(
            'retros',
            accessToken,
            `&id=eq.${retroId}`
        )

        if (retroError || !retros || retros.length === 0) {
            console.error(retroError || 'Retro not found')
            setLoading(false)
            return
        }

        const retroData = retros[0]
        setRetro(retroData)

        // Check for existing submission
        const { data: submissions } = await fetchRows<RetroSubmission>(
            'retro_submissions',
            accessToken,
            `&retro_id=eq.${retroId}&author_id=eq.${profile.id}`
        )

        if (submissions && submissions.length > 0) {
            const submissionData = submissions[0]
            setExistingSubmission(submissionData)
            setNarrative(submissionData.raw_narrative)
        }

        // Check if partner has submitted using the secure RPC
        const { data: submissionInfos, error: rpcError } = await callRpc<{ author_id: string }[]>(
            'get_retro_submission_info',
            accessToken,
            { p_retro_id: retroId }
        )

        if (rpcError) {
            console.error('Error fetching submission info:', rpcError)
        } else {
            const hasPartner = (submissionInfos || []).some(s => s.author_id !== profile.id)
            setPartnerSubmitted(hasPartner)
        }

        setLoading(false)
    }, [accessToken, retroId, profile?.id])

    useEffect(() => {
        if (retroId && profile?.id && accessToken) {
            fetchData()
        }
    }, [retroId, profile?.id, accessToken, fetchData])

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

            // Trigger Check Logic (Server Side)
            setLoading(true)
            try {
                const statusResult = await checkRetroStatus(retroId, accessToken)
                // No longer showing raw debugStatus in production
                // setDebugStatus(statusResult)

                if (statusResult.status === 'revealed') {
                    navigate(`/retro/${retroId}/reveal`)
                } else {
                    // Still waiting for partner
                    await fetchData()
                    setLoading(false)
                }
            } catch (err) {
                console.error('Status check failed:', err)

                setLoading(false)
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
                    {/* Errors are shown at the bottom of the card now */}
                    <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">
                        Write your perspective
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)] mb-4">
                        🐙 Share what happened from YOUR point of view. Be honest - your partner won't see this until you both submit.
                    </p>

                    {retro.ai_summary && (retro.ai_summary as { initial_context?: string })?.initial_context && (
                        <div className="bg-[var(--color-navy)] p-4 rounded-lg mb-4 text-sm">
                            <h3 className="font-bold text-[var(--color-text)] mb-1">Initial Context:</h3>
                            <p className="text-[var(--color-text-muted)]">
                                {(retro.ai_summary as { initial_context?: string })?.initial_context}
                            </p>
                        </div>
                    )}

                    <Textarea
                        placeholder="I remember that day... Here's what happened from my perspective..."
                        value={narrative}
                        onChange={(e) => setNarrative(e.target.value)}
                        rows={8}
                        className="mb-4"
                    />

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4">
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        </div>
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
