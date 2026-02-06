import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { Emotion, AIAnalysis } from '../types'
import { EMOTIONS } from '../types'
import { Button, Card, Textarea } from '../../../shared/components'
import { analyzeAndTransform } from '../utils/aiService'

interface InputGuardProps {
    emotion: Emotion
    initialValue?: string
    onSubmit: (grievance: string, analysis: AIAnalysis, transformed: string) => void
    onBack: () => void
}

export function InputGuard({ emotion, initialValue = '', onSubmit, onBack }: InputGuardProps) {
    const [grievance, setGrievance] = useState(initialValue)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const selectedEmotion = EMOTIONS.find((e) => e.value === emotion)

    async function handleSubmit() {
        if (!grievance.trim()) return

        setLoading(true)
        setError('')

        try {
            const { analysis, transformedText } = await analyzeAndTransform(grievance)
            onSubmit(grievance, analysis, transformedText)
        } catch (err) {
            setError('Failed to process your message. Please try again.')
            console.error(err)
        } finally {
            setLoading(false)
        }
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
                {/* Selected Emotion Display */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--color-surface-hover)]">
                    <span className="text-3xl">{selectedEmotion?.emoji}</span>
                    <div>
                        <p className="text-sm text-[var(--color-text-muted)]">You're feeling</p>
                        <p className="font-medium text-[var(--color-text)]">{selectedEmotion?.label}</p>
                    </div>
                </div>

                {/* Grievance Input */}
                <Textarea
                    label="What's on your mind?"
                    placeholder="Express what you're experiencing. Be honest – Seal will help you communicate it kindly..."
                    value={grievance}
                    onChange={(e) => setGrievance(e.target.value)}
                    rows={6}
                    className="mb-4"
                />

                <p className="text-xs text-[var(--color-text-muted)] mb-4">
                    🦭 Seal will check for communication patterns and suggest a gentler way to express your feelings
                </p>

                {error && (
                    <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
                )}

                <Button
                    onClick={handleSubmit}
                    disabled={!grievance.trim() || loading}
                    className="w-full"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Processing...
                        </>
                    ) : (
                        'Let Seal Help'
                    )}
                </Button>
            </Card>
        </div>
    )
}
