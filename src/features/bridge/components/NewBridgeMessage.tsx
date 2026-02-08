import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmotionSelector } from '../components/EmotionSelector'
import { InputGuard } from '../components/InputGuard'
import { NvcTransform } from '../components/NvcTransform'
import { MessageDelivery } from '../components/MessageDelivery'
import type { Emotion, BridgeFormData, AIAnalysis } from '../types'

type BridgeStep = 'emotion' | 'input' | 'transform' | 'delivery'

export function NewBridgeMessage() {
    const navigate = useNavigate()
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
        // Navigate back to overview after sending
        navigate('/bridge')
    }

    function handleBack() {
        if (step === 'emotion') navigate('/bridge')
        else if (step === 'input') setStep('emotion')
        else if (step === 'transform') setStep('input')
        else if (step === 'delivery') setStep('transform')
    }

    return (
        <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-[var(--color-text)] mb-6 text-center">
                New Message
            </h2>

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
            <div className="relative">
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
