import type { AIAnalysis, Horseman } from '../types'
import { BRIDGE_PROMPTS } from '../types'
import { fetchSingleRow } from '../../../shared/lib/supabaseApi'
import { buildEdgeHeaders, getAiMockFlag } from '../../../shared/lib/aiConfig'
import { logger } from '../../../shared/lib/logger'

// Default prompts for local fallback
const DEFAULT_FOUR_HORSEMEN_PROMPT = `You are an expert in the Gottman Method. Analyze this text for "The Four Horsemen of the Apocalypse" - destructive communication patterns:

1. CRITICISM: Attacking the person's character rather than the behavior (e.g., "You always...", "You never...", "Why can't you...")
2. CONTEMPT: Treating with disrespect, mockery, sarcasm, eye-rolling, name-calling
3. DEFENSIVENESS: Victimizing yourself, making excuses, meeting criticism with criticism
4. STONEWALLING: Withdrawing, shutting down, refusing to engage (e.g., "I'm done", "Forget it", "Whatever")

Respond with a JSON object containing:
- horsemenFlags: array of horsemen types found (lowercase strings)
- detectedHorsemen: array of objects with { type, reason, quote } for each horseman found. 'reason' should explain specifically why this text counts as that horseman. 'quote' is the specific excerpt.
- sentiment: single word describing the overall emotional tone
- suggestions: array of 1-3 brief suggestions for improvement

TEXT TO ANALYZE:
`

const DEFAULT_NVC_PROMPT = `You are a compassionate communication coach trained in Non-Violent Communication (NVC). 

Rewrite the following text using the NVC framework:
1. OBSERVATION: State what happened without judgment
2. FEELING: Express the emotion ("I feel...")
3. NEED: Identify the underlying need
4. REQUEST: Make a clear, positive request

Keep the message authentic and personal while removing blame and accusation.
Do NOT use therapy-speak or make it sound robotic.
Keep it conversational and genuine.

TEXT TO REWRITE:
`

async function getSystemPrompt(key: string, defaultPrompt: string, accessToken?: string): Promise<string> {
    try {
        const token = accessToken ?? import.meta.env.VITE_SUPABASE_ANON_KEY
        if (!token) {
            return defaultPrompt
        }
        const { data, error } = await fetchSingleRow<{ prompt_text: string }>(
            'system_prompts',
            token,
            `&key=eq.${key}`
        )

        if (error || !data) {
            logger.debug(`Using default prompt for ${key}`)
            return defaultPrompt
        }
        return data.prompt_text
    } catch {
        return defaultPrompt
    }
}

interface AIResponse {
    analysis: AIAnalysis
    transformedText: string
}

export async function analyzeAndTransform(text: string, accessToken?: string): Promise<AIResponse> {
    // Get prompts from database (or use defaults)
    const [fourHorsemenPrompt, nvcPrompt] = await Promise.all([
        getSystemPrompt(BRIDGE_PROMPTS.FOUR_HORSEMEN, DEFAULT_FOUR_HORSEMEN_PROMPT, accessToken),
        getSystemPrompt(BRIDGE_PROMPTS.NVC_TRANSFORM, DEFAULT_NVC_PROMPT, accessToken),
    ])

    // Call the Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bridge-ai`, {
        method: 'POST',
        headers: buildEdgeHeaders(accessToken),
        body: JSON.stringify({
            text,
            fourHorsemenPrompt,
            nvcPrompt,
            mock: getAiMockFlag(),
        }),
    })

    if (!response.ok) {
        // Fallback to mock response for development
        logger.warn('Edge function unavailable, using mock response')
        return getMockResponse(text)
    }

    const data = await response.json()
    return {
        analysis: data.analysis,
        transformedText: data.transformedText,
    }
}

// Mock response for development/testing
function getMockResponse(text: string): AIResponse {
    const horsemenPatterns: { pattern: RegExp; horseman: Horseman; reason: string }[] = [
        { pattern: /you always|you never/i, horseman: 'criticism', reason: 'Using absolute terms like "always" or "never" attacks character instead of specific behavior.' },
        { pattern: /whatever|i'm done|forget it/i, horseman: 'stonewalling', reason: 'Withdrawing from the conversation helps no one.' },
        { pattern: /but you|it's not my fault/i, horseman: 'defensiveness', reason: 'Deflecting blame prevents understanding the core issue.' },
        { pattern: /eye roll|pathetic|ridiculous/i, horseman: 'contempt', reason: 'Mockery and disrespect are the most destructive predictors of divorce.' },
    ]

    const detectedHorsemen: { type: Horseman; reason: string; quote: string }[] = []
    const horsemenFlags: Horseman[] = []

    for (const { pattern, horseman, reason } of horsemenPatterns) {
        const match = text.match(pattern)
        if (match) {
            horsemenFlags.push(horseman)
            detectedHorsemen.push({
                type: horseman,
                reason,
                quote: match[0]
            })
        }
    }

    // Simple mock transformation
    const transformedText = `I'm feeling upset right now. When ${text.toLowerCase().replace(/^you /, 'I notice that ').replace(/always|never/gi, 'sometimes')}, I feel hurt because I need to feel valued. Could we talk about this when we're both calm?`

    return {
        analysis: {
            horsemenFlags,
            detectedHorsemen,
            sentiment: horsemenFlags.length > 0 ? 'tense' : 'neutral',
            suggestions: horsemenFlags.length > 0
                ? ['Try using "I feel" statements', 'Focus on specific behaviors, not character']
                : ['Good job expressing yourself!'],
        },
        transformedText,
    }
}
