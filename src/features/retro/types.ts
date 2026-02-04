// Retro Module Types - "Octi" AI Assistant (The Rashomon Protocol)

export type RetroStatus = 'pending' | 'submitted' | 'revealed'

export interface RetroAIAnalysis {
    videoFacts?: string[]        // Indisputable facts (what a camera would see)
    interpretations?: string[]   // Subjective readings
    mindReads?: string[]         // Assumptions about intent (flagged)
    emotionalUndertones?: string[]
    patterns?: string[]          // Recurring behavior patterns
}

export interface Retro {
    id: string
    reef_id: string
    title: string
    event_date?: Date
    status: RetroStatus
    submissions_count: number
    ai_summary: Record<string, unknown>
    created_at: Date
}

export interface RetroSubmission {
    id: string
    retro_id: string
    author_id: string
    raw_narrative: string
    ai_analysis: RetroAIAnalysis
    future_script?: string  // "In the future, when [Trigger] happens, I need [Action]"
    submitted_at: Date
}

export interface CreateRetroInput {
    title: string
    eventDate?: string
}

export interface SubmitNarrativeInput {
    retroId: string
    narrative: string
}

// System prompt keys for Retro feature
export const RETRO_PROMPTS = {
    CLERK_ANALYSIS: 'retro_clerk_analysis_v1',
    FUTURE_SCRIPT: 'retro_future_script_v1',
    SUMMARY: 'retro_summary_v1',
} as const
