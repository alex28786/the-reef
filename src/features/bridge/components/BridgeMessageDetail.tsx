import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Sparkles, Loader2, MessageSquare } from 'lucide-react'
import { Button, Card, Textarea } from '../../../shared/components'
import { fetchSingleRow, updateRow } from '../../../shared/lib/supabaseApi'
import { useAuth } from '../../auth'
import { analyzeAndTransform } from '../utils/aiService'
import type { BridgeMessage, AIAnalysis, Emotion } from '../types'
import { EMOTIONS } from '../types'

export function BridgeMessageDetail() {
    const { messageId } = useParams<{ messageId: string }>()
    const { profile, accessToken } = useAuth()
    const navigate = useNavigate()
    const [message, setMessage] = useState<BridgeMessage | null>(null)
    const [loading, setLoading] = useState(true)
    const [responseText, setResponseText] = useState('')
    const [isResponding, setIsResponding] = useState(false)
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
    const [transformedResponse, setTransformedResponse] = useState('')
    const [sending, setSending] = useState(false)
    const [submittingAnalysis, setSubmittingAnalysis] = useState(false)

    const fetchMessage = useCallback(async () => {
        if (!messageId || !accessToken) return
        setLoading(true)

        const { data, error } = await fetchSingleRow<BridgeMessage>(
            'bridge_messages',
            accessToken,
            `&id=eq.${messageId}`
        )

        if (error) {
            console.error('Error fetching message:', error)
        } else {
            setMessage(data)
            // Auto-acknowledge if I am the recipient and it's not acknowledged
            if (data && data.recipient_id === profile?.id && !data.acknowledged_at) {
                // Internal helper to acknowledge
                if (!accessToken) return
                await updateRow(
                    'bridge_messages',
                    accessToken,
                    `id=eq.${data.id}`,
                    { acknowledged_at: new Date().toISOString() }
                )
            }
        }
        setLoading(false)
    }, [messageId, accessToken, profile?.id])

    useEffect(() => {
        if (messageId && accessToken) {
            fetchMessage()
        }
    }, [messageId, accessToken, fetchMessage])

    async function handleAnalyzeResponse() {
        if (!responseText.trim() || !accessToken) return
        setSubmittingAnalysis(true)

        try {
            const result = await analyzeAndTransform(responseText, accessToken)
            setAiAnalysis(result.analysis)
            setTransformedResponse(result.transformedText)
        } catch (error) {
            console.error('Analysis failed:', error)
        } finally {
            setSubmittingAnalysis(false)
        }
    }

    async function handleSendResponse(textToSend: string) {
        if (!message || !accessToken) return
        setSending(true)

        try {
            const { error } = await updateRow(
                'bridge_messages',
                accessToken,
                `id=eq.${message.id}`,
                {
                    response_text: textToSend,
                    response_ai_analysis: aiAnalysis || {},
                }
            )

            if (error) throw error

            // Refresh to show sent state
            await fetchMessage()
            setIsResponding(false)
        } catch (error) {
            console.error('Failed to send response:', error)
        } finally {
            setSending(false)
        }
    }

    function getEmotionData(emotion: Emotion) {
        return EMOTIONS.find(e => e.value === emotion)
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <Loader2 className="animate-spin mx-auto text-[var(--color-text-muted)]" size={32} />
            </div>
        )
    }

    if (!message) {
        return (
            <div className="text-center py-12">
                <p className="text-[var(--color-text-muted)]">Message not found</p>
                <Button variant="secondary" onClick={() => navigate('/bridge')} className="mt-4">Back to Overview</Button>
            </div>
        )
    }

    const isMe = message.sender_id === profile?.id
    const emotionData = getEmotionData(message.emotion)
    const hasResponse = !!message.response_text

    return (
        <div className="max-w-lg mx-auto py-6">
            <button
                onClick={() => navigate('/bridge')}
                className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                <span>Back to Overview</span>
            </button>

            {/* Original Message Card */}
            <Card className="mb-6 border-l-4 border-l-[var(--color-coral)]">
                <div className="flex items-center gap-3 mb-4 border-b border-[var(--color-surface-hover)] pb-4">
                    <span className="text-4xl">{emotionData?.emoji}</span>
                    <div>
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                            {isMe ? 'You felt' : 'Partner felt'}
                        </p>
                        <p className="text-xl font-bold text-[var(--color-text)]">
                            {emotionData?.label}
                        </p>
                    </div>
                </div>

                <div className="bg-[var(--color-navy)] rounded-xl p-4 mb-2">
                    <p className="text-[var(--color-text)] leading-relaxed italic">
                        "{message.transformed_text || message.original_text}"
                    </p>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] text-right">
                    Sent {new Date(message.created_at).toLocaleDateString()}
                </p>
            </Card>

            {/* Response Section */}
            {hasResponse ? (
                <Card className="border-l-4 border-l-[var(--color-seafoam)]">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="text-[var(--color-seafoam)]" size={24} />
                        <h3 className="font-bold text-[var(--color-text)]">Response</h3>
                    </div>
                    <div className="bg-[var(--color-surface-hover)]/30 rounded-xl p-4">
                        <p className="text-[var(--color-text)]">
                            {message.response_text}
                        </p>
                    </div>
                </Card>
            ) : !isMe ? (
                <div className="space-y-4">
                    {!isResponding ? (
                        <Button onClick={() => setIsResponding(true)} className="w-full py-4">
                            <MessageSquare className="mr-2" size={20} />
                            Reply with Seal's Help
                        </Button>
                    ) : (
                        <Card>
                            <h3 className="font-bold text-[var(--color-text)] mb-2">Draft your response</h3>
                            <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                Seal will help you validate your partner's feelings and respond consistently.
                            </p>

                            {!aiAnalysis ? (
                                <>
                                    <Textarea
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        placeholder="Write your response here..."
                                        rows={6}
                                        className="mb-4"
                                    />
                                    <div className="flex gap-3">
                                        <Button variant="secondary" onClick={() => setIsResponding(false)} className="flex-1">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAnalyzeResponse}
                                            disabled={!responseText.trim() || submittingAnalysis}
                                            className="flex-1"
                                        >
                                            {submittingAnalysis ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="mr-2" />}
                                            Check with Seal
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-[var(--color-navy)] p-4 rounded-lg">
                                        <p className="text-sm text-[var(--color-text-muted)] mb-2">Original Draft:</p>
                                        <p className="italic text-[var(--color-text-muted)] mb-4">"{responseText}"</p>

                                        <div className="flex items-center gap-2 mb-2 text-[var(--color-seafoam)]">
                                            <Sparkles size={16} />
                                            <p className="font-medium text-sm">Seal's Suggestion:</p>
                                        </div>
                                        <p className="text-[var(--color-text)]">{transformedResponse}</p>
                                    </div>

                                    {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                                        <div className="text-sm bg-[var(--color-surface-hover)] p-3 rounded-lg">
                                            <p className="font-medium text-[var(--color-text)] mb-1">💡 Tips:</p>
                                            <ul className="list-disc list-inside text-[var(--color-text-muted)]">
                                                {aiAnalysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex gap-3 flex-col sm:flex-row">
                                        <Button variant="secondary" onClick={() => setAiAnalysis(null)} className="flex-1">
                                            Edit Draft
                                        </Button>
                                        <Button
                                            onClick={() => handleSendResponse(transformedResponse)}
                                            disabled={sending}
                                            className="flex-1 bg-[var(--color-seafoam)] text-[var(--color-navy)] hover:bg-[var(--color-seafoam)]/90"
                                        >
                                            {sending ? <Loader2 className="animate-spin" /> : <Send size={18} className="mr-2" />}
                                            Send Suggested
                                        </Button>
                                        <Button
                                            onClick={() => handleSendResponse(responseText)}
                                            disabled={sending}
                                            variant="secondary"
                                            className="flex-1"
                                        >
                                            Send Original
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            ) : (
                <div className="text-center p-6 bg-[var(--color-surface)] rounded-xl border border-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
                    Waiting for partner to respond...
                </div>
            )}
        </div>
    )
}
