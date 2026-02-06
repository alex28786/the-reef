import { useState } from 'react'
import { EmotionSelector } from '../components/EmotionSelector'
import { InputGuard } from '../components/InputGuard'
import { NvcTransform } from '../components/NvcTransform'
import { MessageDelivery } from '../components/MessageDelivery'
import type { Emotion, BridgeFormData, AIAnalysis } from '../types'

type BridgeStep = 'emotion' | 'input' | 'transform' | 'delivery'

export function BridgePage() {
    const [step, setStep] = useState<BridgeStep>('emotion')
    const [formData, setFormData] = useState<BridgeFormData>({
        emotion: null,
        grievance: '',
    })
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
    const [transformedText, setTransformedText] = useState<string>('')

    function handleEmotionSelect(emotion: Emotion) {
        setFormData((prev) => ({ ...prev, emotion }))
        setStep('input')
    }

    function handleGrievanceSubmit(grievance: string, analysis: AIAnalysis, transformed: string) {
        setFormData((prev) => ({ ...prev, grievance }))
        setAiAnalysis(analysis)
        setTransformedText(transformed)
        setStep('transform')
    }

    function handleTransformAccept() {
        setStep('delivery')
    }

    function handleDeliverySent() {
        // Reset for new message
        setStep('emotion')
        setFormData({ emotion: null, grievance: '' })
        setAiAnalysis(null)
        setTransformedText('')
    }

    function handleBack() {
        if (step === 'input') setStep('emotion')
        else if (step === 'transform') setStep('input')
        else if (step === 'delivery') setStep('transform')
    }

    return (
        <div className="py-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="text-4xl mb-3">🦭</div>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">The Bridge</h1>
                <p className="text-[var(--color-text-muted)] text-sm mt-1">
                    Let Seal guide you through expressing your feelings
                </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex justify-center gap-2 mb-8">
                {['emotion', 'input', 'transform', 'delivery'].map((s, i) => (
                    <div
                        key={s}
                        className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${step === s
                                ? 'w-8 bg-[var(--color-coral)]'
                                : i < ['emotion', 'input', 'transform', 'delivery'].indexOf(step)
                                    ? 'bg-[var(--color-coral)]'
                                    : 'bg-[var(--color-surface-hover)]'
                            }
            `}
                    />
                ))}
            </div>

            {/* Step Content */}
            <div className="max-w-lg mx-auto">
                {step === 'emotion' && (
                    <EmotionSelector onSelect={handleEmotionSelect} />
                )}

                {step === 'input' && formData.emotion && (
                    <InputGuard
                        emotion={formData.emotion}
                        initialValue={formData.grievance}
                        onSubmit={handleGrievanceSubmit}
                        onBack={handleBack}
                    />
                )}

                {step === 'transform' && formData.emotion && aiAnalysis && (
                    <NvcTransform
                        originalText={formData.grievance}
                        transformedText={transformedText}
                        aiAnalysis={aiAnalysis}
                        onAccept={handleTransformAccept}
                        onBack={handleBack}
                    />
                )}

                {step === 'delivery' && formData.emotion && (
                    <MessageDelivery
                        emotion={formData.emotion}
                        transformedText={transformedText}
                        onSent={handleDeliverySent}
                        onBack={handleBack}
                    />
                )}
            </div>
        </div>
    )
}
