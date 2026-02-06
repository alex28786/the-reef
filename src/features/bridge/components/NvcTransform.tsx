import { ArrowLeft, AlertTriangle, Sparkles } from 'lucide-react'
import type { AIAnalysis, Horseman } from '../types'
import { Button, Card } from '../../../shared/components'

interface NvcTransformProps {
    originalText: string
    transformedText: string
    aiAnalysis: AIAnalysis
    onAccept: () => void
    onBack: () => void
}

const HORSEMAN_INFO: Record<Horseman, { label: string; color: string; description: string }> = {
    criticism: {
        label: 'Criticism',
        color: 'text-orange-400',
        description: 'Attacking character rather than behavior',
    },
    contempt: {
        label: 'Contempt',
        color: 'text-red-400',
        description: 'Showing disrespect or mockery',
    },
    defensiveness: {
        label: 'Defensiveness',
        color: 'text-yellow-400',
        description: 'Making excuses or meeting criticism with criticism',
    },
    stonewalling: {
        label: 'Stonewalling',
        color: 'text-purple-400',
        description: 'Withdrawing or shutting down',
    },
}

export function NvcTransform({
    originalText,
    transformedText,
    aiAnalysis,
    onAccept,
    onBack,
}: NvcTransformProps) {
    const hasHorsemen = aiAnalysis.horsemenFlags && aiAnalysis.horsemenFlags.length > 0

    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4 transition-colors"
            >
                <ArrowLeft size={18} />
                <span>Back</span>
            </button>

            {/* Horsemen Warnings */}
            {hasHorsemen && (
                <Card className="mb-4 border-orange-500/50">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-orange-400 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-medium text-[var(--color-text)] mb-2">
                                Seal noticed some patterns
                            </p>
                            <div className="space-y-4">
                                {(aiAnalysis.detectedHorsemen && aiAnalysis.detectedHorsemen.length > 0) ? (
                                    aiAnalysis.detectedHorsemen.map((detection, i) => {
                                        const info = HORSEMAN_INFO[detection.type]
                                        return (
                                            <div key={i} className="bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-surface-hover)]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`font-medium ${info.color}`}>{info.label}</span>
                                                    <span className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider">detected</span>
                                                </div>
                                                <p className="text-sm text-[var(--color-text)] mb-2">
                                                    "{detection.quote}"
                                                </p>
                                                <p className="text-sm text-[var(--color-text-muted)] italic">
                                                    {detection.reason}
                                                </p>
                                            </div>
                                        )
                                    })
                                ) : (
                                    aiAnalysis.horsemenFlags?.map((horseman) => {
                                        const info = HORSEMAN_INFO[horseman]
                                        return (
                                            <div key={horseman} className="flex items-center gap-2">
                                                <span className={`font-medium ${info.color}`}>{info.label}</span>
                                                <span className="text-[var(--color-text-muted)] text-sm">
                                                    – {info.description}
                                                </span>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Original Text */}
            <Card className="mb-4 bg-[var(--color-navy)]">
                <p className="text-sm text-[var(--color-text-muted)] mb-2">Your original message:</p>
                <p className="text-[var(--color-text)] italic">"{originalText}"</p>
            </Card>

            {/* Transformed Text */}
            <Card className="mb-4 border-[var(--color-seafoam)]/50">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="text-[var(--color-seafoam)]" size={18} />
                    <p className="font-medium text-[var(--color-text)]">
                        Seal's gentle rewrite:
                    </p>
                </div>
                <p className="text-[var(--color-text)] leading-relaxed">
                    "{transformedText}"
                </p>
            </Card>

            {/* Suggestions */}
            {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                <div className="mb-6 text-sm text-[var(--color-text-muted)]">
                    <p className="font-medium mb-1">💡 Tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                        {aiAnalysis.suggestions.map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex gap-3">
                <Button variant="secondary" onClick={onBack} className="flex-1">
                    Edit Message
                </Button>
                <Button onClick={onAccept} className="flex-1">
                    Send This Version
                </Button>
            </div>
        </div>
    )
}
