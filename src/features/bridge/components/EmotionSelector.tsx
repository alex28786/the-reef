import type { Emotion } from '../types'
import { EMOTIONS } from '../types'
import { Card } from '../../../shared/components'

interface EmotionSelectorProps {
    onSelect: (emotion: Emotion) => void
}

export function EmotionSelector({ onSelect }: EmotionSelectorProps) {
    return (
        <div>
            <h2 className="text-lg font-medium text-[var(--color-text)] mb-2 text-center">
                How are you feeling right now?
            </h2>
            <p className="text-[var(--color-text-muted)] text-sm mb-6 text-center">
                Take a moment to identify your primary emotion
            </p>

            <div className="grid grid-cols-2 gap-3">
                {EMOTIONS.map((emotion) => (
                    <button
                        key={emotion.value}
                        onClick={() => onSelect(emotion.value)}
                        className="group"
                    >
                        <Card className="hover:border-[var(--color-coral)] transition-all duration-200 group-hover:scale-[1.02]">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl group-hover:scale-110 transition-transform">
                                    {emotion.emoji}
                                </span>
                                <span className="font-medium text-[var(--color-text)]">
                                    {emotion.label}
                                </span>
                            </div>
                        </Card>
                    </button>
                ))}
            </div>
        </div>
    )
}
