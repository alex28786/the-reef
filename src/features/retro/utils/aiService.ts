import type { RetroAIAnalysis } from '../types'
import { buildEdgeHeaders, getAiMockFlag } from '../../../shared/lib/aiConfig'
import { logger } from '../../../shared/lib/logger'



// Response type from Edge Function
export interface RetroStatusResponse {
    status: 'waiting' | 'revealed' | 'error'
    message?: string
}

export async function checkRetroStatus(retroId: string, accessToken?: string): Promise<RetroStatusResponse> {
    try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/retro-clerk`, {
            method: 'POST',
            headers: buildEdgeHeaders(accessToken),
            body: JSON.stringify({
                retro_id: retroId,
                mock: getAiMockFlag()
            }),
        })

        if (response.ok) {
            return await response.json()
        }
        return { status: 'error', message: 'Function error' }
    } catch (e) {
        logger.warn('Edge function unavailable', e)
        return { status: 'error', message: 'Network error' }
    }
}

export async function generateMockAnalysis(narrative: string): Promise<RetroAIAnalysis> {
    const sentences = narrative.split(/[.!?]+/).filter(s => s.trim())

    // Dynamic extraction based on regex
    const videoFacts: string[] = []
    const interpretations: string[] = []
    const mindReads: string[] = []

    // Helper to find time
    const timeMatch = narrative.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/)
    if (timeMatch) videoFacts.push(`Event occurred around ${timeMatch[0]}`)
    else videoFacts.push("Event occurred (time unspecified)")

    sentences.forEach(s => {
        const lower = s.toLowerCase()
        if (lower.includes('felt') || lower.includes('seemed')) {
            interpretations.push(s)
        } else if (lower.includes('thought you') || lower.includes('wanted to')) {
            mindReads.push(s)
        } else if (lower.includes('said') || lower.includes('went') || lower.includes('did')) {
            videoFacts.push(s)
        }
    })

    // Fallbacks if empty
    if (videoFacts.length < 2) videoFacts.push("Two people interacted.")
    if (interpretations.length === 0) interpretations.push("The situation felt tense.")
    if (mindReads.length === 0) mindReads.push("Assumed the worst.")

    return {
        videoFacts: videoFacts.slice(0, 3),
        interpretations: interpretations.slice(0, 3),
        mindReads: mindReads.slice(0, 2),
        emotionalUndertones: ['Processing', 'Seeking connection', 'Uncertainty'],
    }
}
