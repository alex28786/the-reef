import { Video, Brain, AlertTriangle, Eye } from 'lucide-react'
import { Card } from '../../../shared/components'
import type { RetroAIAnalysis } from '../types'

interface AnalysisColumnProps {
    title: string
    narrative: string
    analysis?: RetroAIAnalysis
    isUser?: boolean
    isLoading?: boolean
}

export function AnalysisColumn({ title, narrative, analysis, isUser, isLoading }: AnalysisColumnProps) {
    const avatarColor = isUser ? 'bg-[var(--color-coral)]' : 'bg-[var(--color-seafoam)]'
    const avatarText = isUser ? 'text-white' : 'text-[var(--color-navy)]'
    const avatarLabel = isUser ? 'You' : 'P'

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-surface-hover)]">
                <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center ${avatarText} font-bold`}>
                    {avatarLabel}
                </div>
                <h2 className="font-bold text-[var(--color-text)]">{title}</h2>
            </div>

            <Card className="bg-[var(--color-surface)]">
                <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase mb-2 flex items-center gap-1">
                    <Eye size={14} /> Narrative
                </h3>
                <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
                    {narrative}
                </p>
            </Card>

            <Card className="bg-blue-500/5 border-blue-500/20">
                <h3 className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-1">
                    <Video size={14} /> Video Camera Facts
                </h3>
                <ul className="list-disc list-inside text-sm text-[var(--color-text)] space-y-1">
                    {analysis?.videoFacts?.map((fact, i) => (
                        <li key={i}>{fact}</li>
                    )) || <li className="text-[var(--color-text-muted)]">{isLoading ? 'Analyzing...' : 'Analysis pending...'}</li>}
                </ul>
            </Card>

            <Card className="bg-purple-500/5 border-purple-500/20">
                <h3 className="text-xs font-bold text-purple-400 uppercase mb-2 flex items-center gap-1">
                    <Brain size={14} /> Interpretations
                </h3>
                <ul className="list-disc list-inside text-sm text-[var(--color-text)] space-y-1">
                    {analysis?.interpretations?.map((interp, i) => (
                        <li key={i}>{interp}</li>
                    )) || <li className="text-[var(--color-text-muted)]">{isLoading ? 'Analyzing...' : 'Analysis pending...'}</li>}
                </ul>
            </Card>

            {(analysis?.mindReads?.length || 0) > 0 && (
                <Card className="bg-orange-500/5 border-orange-500/20">
                    <h3 className="text-xs font-bold text-orange-400 uppercase mb-2 flex items-center gap-1">
                        <AlertTriangle size={14} /> Mind Reads
                    </h3>
                    <ul className="list-disc list-inside text-sm text-[var(--color-text)] space-y-1">
                        {analysis?.mindReads?.map((read, i) => (
                            <li key={i}>{read}</li>
                        ))}
                    </ul>
                </Card>
            )}
        </div>
    )
}
