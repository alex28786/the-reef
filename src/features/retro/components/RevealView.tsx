import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Video, Brain, AlertTriangle, FileText } from 'lucide-react'
import { Button, Card, Textarea } from '../../../shared/components'
import { fetchSingleRow, fetchRows, updateRow } from '../../../shared/lib/supabaseApi'
import { useAuth } from '../../auth'
import type { Retro, RetroSubmission, RetroAIAnalysis } from '../types'
import { analyzeNarrative, generateMockAnalysis } from '../utils/aiService'

export function RevealView() {
    const { retroId } = useParams<{ retroId: string }>()
    const { profile, accessToken } = useAuth()
    const navigate = useNavigate()
    const [retro, setRetro] = useState<Retro | null>(null)
    const [submissions, setSubmissions] = useState<RetroSubmission[]>([])
    const [mySubmission, setMySubmission] = useState<RetroSubmission | null>(null)
    const [partnerSubmission, setPartnerSubmission] = useState<RetroSubmission | null>(null)
    const [futureScript, setFutureScript] = useState('')
    const [loading, setLoading] = useState(true)
    const [analyzing, setAnalyzing] = useState(false)
    const [savingScript, setSavingScript] = useState(false)

    useEffect(() => {
        if (retroId && profile?.id && accessToken) {
            fetchData()
        }
    }, [retroId, profile?.id, accessToken])

    async function fetchData() {
        if (!accessToken || !retroId || !profile?.id) return
        setLoading(true)

        const { data: retroData } = await fetchSingleRow<Retro>(
            'retros',
            accessToken,
            `&id=eq.${retroId}`
        )

        if (retroData) {
            setRetro(retroData)
        }

        const { data: submissionsData } = await fetchRows<RetroSubmission>(
            'retro_submissions',
            accessToken,
            `&retro_id=eq.${retroId}`
        )

        if (submissionsData) {
            setSubmissions(submissionsData)
            const mine = submissionsData.find((s) => s.author_id === profile?.id)
            const partner = submissionsData.find((s) => s.author_id !== profile?.id)
            setMySubmission(mine || null)
            setPartnerSubmission(partner || null)
            if (mine?.future_script) {
                setFutureScript(mine.future_script)
            }

            // If not analyzed yet, trigger analysis
            if (mine && (!mine.ai_analysis || Object.keys(mine.ai_analysis).length === 0)) {
                await analyzeSubmissions(submissionsData)
            }
        }

        setLoading(false)
    }

    async function analyzeSubmissions(subs: RetroSubmission[]) {
        if (!accessToken || !retroId) return
        setAnalyzing(true)

        try {
            // In production, this would call an Edge Function
            for (const sub of subs) {
                const analysis = await generateMockAnalysis(sub.raw_narrative)

                await updateRow(
                    'retro_submissions',
                    accessToken,
                    `id=eq.${sub.id}`,
                    { ai_analysis: analysis }
                )
            }

            // Update retro status to revealed
            await updateRow(
                'retros',
                accessToken,
                `id=eq.${retroId}`,
                { status: 'revealed' }
            )

            await fetchData()
        } catch (err) {
            console.error('Analysis failed:', err)
        } finally {
            setAnalyzing(false)
        }
    }

    async function handleSaveScript() {
        if (!mySubmission || !futureScript.trim() || !accessToken) return

        setSavingScript(true)

        try {
            await updateRow(
                'retro_submissions',
                accessToken,
                `id=eq.${mySubmission.id}`,
                { future_script: futureScript.trim() }
            )
        } catch (err) {
            console.error(err)
        } finally {
            setSavingScript(false)
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

    if (analyzing) {
        return (
            <div className="text-center py-12">
                <div className="text-4xl animate-pulse">🐙</div>
                <p className="text-[var(--color-text)] font-medium mt-4">Octi is analyzing both perspectives...</p>
                <p className="text-[var(--color-text-muted)] text-sm mt-2">
                    Separating facts from interpretations
                </p>
            </div>
        )
    }

    if (!retro || !mySubmission || !partnerSubmission) {
        return (
            <div className="text-center py-12">
                <p className="text-[var(--color-text-muted)]">
                    Waiting for both perspectives to be submitted
                </p>
                <Button onClick={() => navigate(`/retro/${retroId}/submit`)} className="mt-4">
                    Go to Submission
                </Button>
            </div>
        )
    }

    const myAnalysis = mySubmission.ai_analysis as RetroAIAnalysis
    const partnerAnalysis = partnerSubmission.ai_analysis as RetroAIAnalysis

    return (
        <div className="py-6 max-w-4xl mx-auto">
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

            {/* Side by Side Narratives */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
                <Card>
                    <h3 className="font-medium text-[var(--color-text)] mb-3 flex items-center gap-2">
                        <Eye size={18} />
                        Your Perspective
                    </h3>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        {mySubmission.raw_narrative}
                    </p>
                </Card>

                <Card>
                    <h3 className="font-medium text-[var(--color-text)] mb-3 flex items-center gap-2">
                        <Eye size={18} />
                        Partner's Perspective
                    </h3>
                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                        {partnerSubmission.raw_narrative}
                    </p>
                </Card>
            </div>

            {/* AI Analysis */}
            <h2 className="text-lg font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
                🐙 Octi's Analysis
            </h2>

            {/* Video Camera Facts */}
            <Card className="mb-4">
                <h3 className="font-medium text-[var(--color-text)] mb-3 flex items-center gap-2">
                    <Video size={18} className="text-green-400" />
                    Video Camera Facts
                    <span className="text-xs text-[var(--color-text-muted)]">(What a camera would see)</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-2">From your story:</p>
                        <ul className="list-disc list-inside text-sm text-[var(--color-text)] space-y-1">
                            {myAnalysis?.videoFacts?.map((fact, i) => (
                                <li key={i}>{fact}</li>
                            )) || <li className="text-[var(--color-text-muted)]">Analysis pending...</li>}
                        </ul>
                    </div>
                    <div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-2">From partner's story:</p>
                        <ul className="list-disc list-inside text-sm text-[var(--color-text)] space-y-1">
                            {partnerAnalysis?.videoFacts?.map((fact, i) => (
                                <li key={i}>{fact}</li>
                            )) || <li className="text-[var(--color-text-muted)]">Analysis pending...</li>}
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Interpretations */}
            <Card className="mb-4">
                <h3 className="font-medium text-[var(--color-text)] mb-3 flex items-center gap-2">
                    <Brain size={18} className="text-blue-400" />
                    Interpretations
                    <span className="text-xs text-[var(--color-text-muted)]">(Subjective readings)</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-2">Your interpretations:</p>
                        <ul className="list-disc list-inside text-sm text-[var(--color-text)] space-y-1">
                            {myAnalysis?.interpretations?.map((interp, i) => (
                                <li key={i}>{interp}</li>
                            )) || <li className="text-[var(--color-text-muted)]">Analysis pending...</li>}
                        </ul>
                    </div>
                    <div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-2">Partner's interpretations:</p>
                        <ul className="list-disc list-inside text-sm text-[var(--color-text)] space-y-1">
                            {partnerAnalysis?.interpretations?.map((interp, i) => (
                                <li key={i}>{interp}</li>
                            )) || <li className="text-[var(--color-text-muted)]">Analysis pending...</li>}
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Mind Reads */}
            {((myAnalysis?.mindReads?.length || 0) > 0 || (partnerAnalysis?.mindReads?.length || 0) > 0) && (
                <Card className="mb-4 border-orange-500/50">
                    <h3 className="font-medium text-[var(--color-text)] mb-3 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-orange-400" />
                        Mind Reading Detected
                        <span className="text-xs text-[var(--color-text-muted)]">(Assumptions about intent)</span>
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {(myAnalysis?.mindReads?.length || 0) > 0 && (
                            <div>
                                <p className="text-xs text-orange-400 mb-2">In your story:</p>
                                <ul className="list-disc list-inside text-sm text-[var(--color-text)] space-y-1">
                                    {myAnalysis?.mindReads?.map((read, i) => (
                                        <li key={i}>{read}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(partnerAnalysis?.mindReads?.length || 0) > 0 && (
                            <div>
                                <p className="text-xs text-orange-400 mb-2">In partner's story:</p>
                                <ul className="list-disc list-inside text-sm text-[var(--color-text)] space-y-1">
                                    {partnerAnalysis?.mindReads?.map((read, i) => (
                                        <li key={i}>{read}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* The Script */}
            <Card className="mt-8">
                <h2 className="text-lg font-bold text-[var(--color-text)] mb-2 flex items-center gap-2">
                    <FileText size={20} />
                    The Script
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    Complete this sentence to create a clear agreement for the future:
                </p>

                <div className="bg-[var(--color-navy)] rounded-xl p-4 mb-4">
                    <p className="text-[var(--color-seafoam)] font-medium mb-2">
                        "In the future, when [trigger] happens, I need [action]."
                    </p>
                    <Textarea
                        placeholder="In the future, when we disagree about plans, I need us to take a 10-minute break before discussing..."
                        value={futureScript}
                        onChange={(e) => setFutureScript(e.target.value)}
                        rows={3}
                    />
                </div>

                <Button
                    onClick={handleSaveScript}
                    disabled={savingScript || !futureScript.trim()}
                    variant="secondary"
                    className="w-full"
                >
                    {savingScript ? 'Saving...' : 'Save My Script'}
                </Button>
            </Card>
        </div>
    )
}
