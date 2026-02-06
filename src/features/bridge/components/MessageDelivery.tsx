import { useState } from 'react'
import { ArrowLeft, Send, Loader2, CheckCircle } from 'lucide-react'
import type { Emotion } from '../types'
import { EMOTIONS } from '../types'
import { Button, Card } from '../../../shared/components'
import { fetchRows, insertRow } from '../../../shared/lib/supabaseApi'
import { useAuth } from '../../auth'

interface MessageDeliveryProps {
    emotion: Emotion
    transformedText: string
    onSent: () => void
    onBack: () => void
}

export function MessageDelivery({
    emotion,
    transformedText,
    onSent,
    onBack,
}: MessageDeliveryProps) {
    const { profile, accessToken } = useAuth()
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    const selectedEmotion = EMOTIONS.find((e) => e.value === emotion)

    async function handleSend() {
        if (!profile?.reef_id || !accessToken) {
            setError('You must be linked to a reef to send messages')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Get all profiles in the reef to find partner
            const { data: profiles, error: profilesError } = await fetchRows<any>(
                'profiles',
                accessToken,
                `&reef_id=eq.${profile.reef_id}`
            )

            if (profilesError || !profiles) {
                console.error('Error fetching profiles:', profilesError)
                throw new Error('Could not verify reef members')
            }

            console.log('Reef Members:', profiles)
            let partnerData = profiles.find((p: any) => p.id !== profile.id)

            if (!partnerData) {
                // For testing/dev, if ONLY 1 member exists, maybe allow proceed or warn?
                // But for now, just informative error
                console.warn('No partner found in reef:', profile.reef_id)
                throw new Error('Could not find your partner. Are they linked to your reef? (Reef ID: ' + profile.reef_id + ')')
            }

            // Insert bridge message
            const { error: insertError } = await insertRow(
                'bridge_messages',
                accessToken,
                {
                    reef_id: profile.reef_id,
                    sender_id: profile.id,
                    recipient_id: partnerData.id,
                    emotion,
                    original_text: transformedText,
                    transformed_text: transformedText,
                    ai_analysis: {},
                }
            )

            if (insertError) throw insertError

            setSent(true)
            setTimeout(onSent, 2000)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (sent) {
        return (
            <Card className="text-center py-8">
                <CheckCircle className="text-green-400 mx-auto mb-4" size={48} />
                <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
                    Message Sent! 🦭
                </h2>
                <p className="text-[var(--color-text-muted)]">
                    Your partner will see your emotion first and acknowledge it before reading the message.
                </p>
            </Card>
        )
    }

    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4 transition-colors"
            >
                <ArrowLeft size={18} />
                <span>Back</span>
            </button>

            <Card>
                <h2 className="text-lg font-medium text-[var(--color-text)] mb-4">
                    Ready to send?
                </h2>

                {/* Preview */}
                <div className="bg-[var(--color-navy)] rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--color-surface-hover)]">
                        <span className="text-2xl">{selectedEmotion?.emoji}</span>
                        <span className="text-[var(--color-text)]">
                            Feeling <strong>{selectedEmotion?.label}</strong>
                        </span>
                    </div>
                    <p className="text-[var(--color-text)] leading-relaxed">
                        {transformedText}
                    </p>
                </div>

                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    📬 Your partner will first see how you're feeling and acknowledge it before reading your message.
                </p>

                {error && (
                    <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
                )}

                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onBack} className="flex-1">
                        Go Back
                    </Button>
                    <Button onClick={handleSend} disabled={loading} className="flex-1">
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Send Message
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
