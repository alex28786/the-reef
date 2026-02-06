import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Video, Brain, AlertTriangle, FileText, RefreshCw, Sparkles, Loader2, CheckCircle } from 'lucide-react'
import { Button, Card, Textarea } from '../../../shared/components'
import { fetchSingleRow, fetchRows, updateRow } from '../../../shared/lib/supabaseApi'
import { useAuth } from '../../auth'
import type { Retro, RetroSubmission, RetroAIAnalysis } from '../types'
import { checkRetroStatus, generateMockAnalysis } from '../utils/aiService'
import { AnalysisColumn } from './AnalysisColumn'

export function RevealView() {
    const { retroId } = useParams<{ retroId: string }>()
    const { profile, accessToken } = useAuth()
    const navigate = useNavigate()
    const [retro, setRetro] = useState<Retro | null>(null)
    const [mySubmission, setMySubmission] = useState<RetroSubmission | null>(null)
    const [partnerSubmission, setPartnerSubmission] = useState<RetroSubmission | null>(null)
    const [futureScript, setFutureScript] = useState('')
    const [loading, setLoading] = useState(true)
    const [checkingStatus, setCheckingStatus] = useState(false)
    const [savingScript, setSavingScript] = useState(false)
    const [scriptError, setScriptError] = useState('')
    const [scriptSuccess, setScriptSuccess] = useState(false)

    useEffect(() => {
        if (retroId && profile?.id && accessToken) {
            fetchData()
        }
    }, [retroId, profile?.id, accessToken])

    async function fetchData() {
        if (!accessToken || !retroId || !profile?.id) return
        setLoading(true)

        // Fetch retro
        const { data: retroData } = await fetchSingleRow<Retro>(
            'retros',
            accessToken,
            `&id=eq.${retroId}`
        )

        if (retroData) {
            setRetro(retroData)
        }

        // Fetch submissions
        const { data: submissionsData } = await fetchRows<RetroSubmission>(
            'retro_submissions',
            accessToken,
            `&retro_id=eq.${retroId}`
        )

        if (submissionsData) {
            const mine = submissionsData.find((s) => s.author_id === profile?.id)
            const partner = submissionsData.find((s) => s.author_id !== profile?.id)
            setMySubmission(mine || null)
            setPartnerSubmission(partner || null)

            if (mine?.future_script) {
                setFutureScript(mine.future_script)
            }
        }

        setLoading(false)
    }

    async function handleCheckStatus() {
        if (!retroId || !accessToken) return
        setCheckingStatus(true)
        try {
            const status = await checkRetroStatus(retroId, accessToken)
            if (status.status === 'revealed') {
                await fetchData()
            }
        } catch (e) {
            console.error('Status check failed:', e)
        } finally {
            setCheckingStatus(false)
        }
    }

    async function handleSaveScript() {
        if (!mySubmission || !futureScript.trim() || !accessToken) return

        setSavingScript(true)
        setScriptError('')
        setScriptSuccess(false)

        try {
            const { error } = await updateRow(
                'retro_submissions',
                accessToken,
                `id=eq.${mySubmission.id}`,
                { future_script: futureScript.trim() }
            )

            if (error) throw error
            setScriptSuccess(true)
            setTimeout(() => setScriptSuccess(false), 3000)
        } catch (err) {
            console.error(err)
            setScriptError('Failed to save script. Please try again.')
        } finally {
            setSavingScript(false)
        }
    }

    async function generateScriptSuggestion() {
        if (!futureScript.trim()) {
            setFutureScript("In the future, when we notice we're interrupting each other, I need us to pause and take turns identifying one feeling each.")
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

    if (!retro || !mySubmission) {
        return (
            <div className="text-center py-12">
                <p className="text-[var(--color-text-muted)]">
                    Waiting for data...
                </p>
                <Button onClick={() => navigate(`/retro`)} className="mt-4">
                    Back
                </Button>
            </div>
        )
    }

    // Logic for "Analysis Pending" or "Partner Missing"
    const isRevealed = retro.status === 'revealed'
    const hasPartner = !!partnerSubmission

    if (!isRevealed || !hasPartner) {
        return (
            <div className="py-6 max-w-lg mx-auto text-center px-4">
                <div className="text-4xl mb-4 animate-pulse">🐙</div>
                <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
                    Analysis Pending
                </h1>
                <p className="text-[var(--color-text-muted)] mb-6">
                    {hasPartner
                        ? "Octi is analyzing your perspectives..."
                        : "Waiting for your partner's submission..."}
                </p>

                <Card className="mb-6">
                    <p className="text-sm text-[var(--color-text)] mb-2">
                        <strong>My Status:</strong> Submitted ✅
                    </p>
                    <p className="text-sm text-[var(--color-text)]">
                        <strong>Partner Status:</strong> {hasPartner ? 'Submitted ✅' : 'Waiting ⏳'}
                    </p>
                </Card>

                <Button
                    onClick={handleCheckStatus}
                    disabled={checkingStatus}
                    className="w-full"
                >
                    {checkingStatus ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Checking...
                        </>
                    ) : (
                        <>
                            <RefreshCw size={18} />
                            Check Status
                        </>
                    )}
                </Button>
            </div>
        )
    }

    const myAnalysis = mySubmission.ai_analysis as RetroAIAnalysis
    const partnerAnalysis = partnerSubmission.ai_analysis as RetroAIAnalysis

    return (
        <div className="py-6 max-w-6xl mx-auto px-4">
            <button
                onClick={() => navigate('/retro')}
                className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                <span>Back to Retros</span>
            </button>

            <div className="text-center mb-8">
                <div className="text-4xl mb-3">🐙</div>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">The Reveal</h1>
                <p className="text-lg text-[var(--color-text-muted)]">{retro.title}</p>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <AnalysisColumn
                    title="Your Perspective"
                    narrative={mySubmission.raw_narrative}
                    analysis={myAnalysis}
                    isUser={true}
                />
                <AnalysisColumn
                    title="Partner's Perspective"
                    narrative={partnerSubmission.raw_narrative}
                    analysis={partnerAnalysis}
                    isUser={false}
                />
            </div>

            {/* The Script */}
            <div className="max-w-2xl mx-auto">
                <Card className="mt-8 border-[var(--color-seafoam)]/30">
                    <h2 className="text-lg font-bold text-[var(--color-text)] mb-2 flex items-center gap-2">
                        <FileText size={20} />
                        The Script
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)] mb-4">
                        Complete this sentence to create a clear agreement for the future:
                    </p>

                    <div className="bg-[var(--color-navy)] rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[var(--color-seafoam)] font-medium">
                                "In the future, when [trigger] happens, I need [action]."
                            </p>
                            <button
                                onClick={generateScriptSuggestion}
                                className="text-xs flex items-center gap-1 text-[var(--color-coral)] hover:underline"
                                title="Get a suggestion from Octi"
                            >
                                <Sparkles size={12} /> Suggestion
                            </button>
                        </div>

                        <Textarea
                            placeholder="In the future, when we disagree about plans, I need us to take a 10-minute break before discussing..."
                            value={futureScript}
                            onChange={(e) => setFutureScript(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {scriptError && (
                        <p className="text-red-400 text-sm mb-4 text-center">{scriptError}</p>
                    )}

                    {scriptSuccess && (
                        <p className="text-green-400 text-sm mb-4 text-center flex items-center justify-center gap-2">
                            <CheckCircle size={14} /> Saved successfully!
                        </p>
                    )}

                    <Button
                        onClick={handleSaveScript}
                        disabled={savingScript || !futureScript.trim()}
                        variant="primary"
                        className="w-full"
                    >
                        {savingScript ? <Loader2 size={16} className="animate-spin" /> : 'Save My Script'}
                    </Button>
                </Card>
            </div>
        </div>
    )
}
