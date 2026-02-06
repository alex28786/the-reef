import type { RetroAIAnalysis } from '../types'
import { RETRO_PROMPTS } from '../types'
import { supabase } from '../../../shared/lib/supabase'

const DEFAULT_CLERK_PROMPT = `You are Octi, a wise and compassionate AI assistant helping a couple understand their different perspectives of the same event.

Analyze this narrative and extract:
1. VIDEO CAMERA FACTS - Things a neutral camera would record (observable actions, words spoken, times, places)
2. INTERPRETATIONS - Subjective readings of the situation, feelings, conclusions drawn
3. MIND READS - Assumptions about what the other person was thinking or intending

Be gentle but honest. The goal is understanding, not blame.

NARRATIVE:
`

// Response type from Edge Function
export interface RetroStatusResponse {
    status: 'waiting' | 'revealed' | 'error'
    message?: string
}

export async function checkRetroStatus(retroId: string, accessToken?: string): Promise<RetroStatusResponse> {
    try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/retro-clerk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                retro_id: retroId,
                mock: true // Enabled for testing/dev 
            }),
        })

        if (response.ok) {
            return await response.json()
        }
        return { status: 'error', message: 'Function error' }
    } catch (e) {
        console.warn('Edge function unavailable', e)
        return { status: 'error', message: 'Network error' }
    }
}

export async function generateMockAnalysis(narrative: string): Promise<RetroAIAnalysis> {
    // Simple mock analysis based on text patterns
    const sentences = narrative.split(/[.!?]+/).filter(s => s.trim())

    const videoFacts: string[] = []
    const interpretations: string[] = []
    const mindReads: string[] = []

    for (const sentence of sentences.slice(0, 6)) {
        const cleaned = sentence.trim()
        if (!cleaned) continue

        // Pattern matching for categorization
        if (cleaned.match(/because.*(?:wanted|trying|meant)/i)) {
            mindReads.push(cleaned)
        } else if (cleaned.match(/(?:felt|seemed|appeared|think|believe|assume)/i)) {
            interpretations.push(cleaned)
        } else if (cleaned.match(/(?:said|did|went|came|called|texted|at \d)/i)) {
            videoFacts.push(cleaned)
        } else {
            // Default to interpretation if unclear
            interpretations.push(cleaned)
        }
    }

    // Ensure at least some content in each category
    if (videoFacts.length === 0) {
        videoFacts.push('Event occurred between the two parties')
    }
    if (interpretations.length === 0) {
        interpretations.push('Narrator has feelings about the situation')
    }

    return {
        videoFacts: videoFacts.slice(0, 3),
        interpretations: interpretations.slice(0, 3),
        mindReads: mindReads.slice(0, 2),
        emotionalUndertones: ['Processing', 'Seeking understanding'],
    }
}
