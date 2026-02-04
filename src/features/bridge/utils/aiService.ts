import type { AIAnalysis, Horseman } from '../types'
import { BRIDGE_PROMPTS } from '../types'
import { supabase } from '../../../shared/lib/supabase'

// Default prompts for local fallback
const DEFAULT_FOUR_HORSEMEN_PROMPT = `You are an expert in the Gottman Method. Analyze this text for "The Four Horsemen of the Apocalypse" - destructive communication patterns:

1. CRITICISM: Attacking the person's character rather than the behavior (e.g., "You always...", "You never...", "Why can't you...")
2. CONTEMPT: Treating with disrespect, mockery, sarcasm, eye-rolling, name-calling
3. DEFENSIVENESS: Victimizing yourself, making excuses, meeting criticism with criticism
4. STONEWALLING: Withdrawing, shutting down, refusing to engage (e.g., "I'm done", "Forget it", "Whatever")

Respond with a JSON object containing:
- horsemenFlags: array of horsemen found (use lowercase: "criticism", "contempt", "defensiveness", "stonewalling")
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

async function getSystemPrompt(key: string, defaultPrompt: string): Promise<string> {
    try {
        const { data, error } = await supabase
            .from('system_prompts')
            .select('prompt_text')
            .eq('key', key)
            .single()

        if (error || !data) {
            console.log(`Using default prompt for ${key}`)
            return defaultPrompt
        }
        if ('prompt_text' in data) {
            return (data as { prompt_text: string }).prompt_text
        }
        return defaultPrompt
    } catch {
        return defaultPrompt
    }
}

interface AIResponse {
    analysis: AIAnalysis
    transformedText: string
}

export async function analyzeAndTransform(text: string): Promise<AIResponse> {
    // Get prompts from database (or use defaults)
    const [fourHorsemenPrompt, nvcPrompt] = await Promise.all([
        getSystemPrompt(BRIDGE_PROMPTS.FOUR_HORSEMEN, DEFAULT_FOUR_HORSEMEN_PROMPT),
        getSystemPrompt(BRIDGE_PROMPTS.NVC_TRANSFORM, DEFAULT_NVC_PROMPT),
    ])

    // Call the Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bridge-ai`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
            text,
            fourHorsemenPrompt,
            nvcPrompt,
        }),
    })

    if (!response.ok) {
        // Fallback to mock response for development
        console.warn('Edge function unavailable, using mock response')
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
    const horsemenPatterns: { pattern: RegExp; horseman: Horseman }[] = [
        { pattern: /you always|you never/i, horseman: 'criticism' },
        { pattern: /whatever|i'm done|forget it/i, horseman: 'stonewalling' },
        { pattern: /but you|it's not my fault/i, horseman: 'defensiveness' },
        { pattern: /eye roll|pathetic|ridiculous/i, horseman: 'contempt' },
    ]

    const horsemenFlags: Horseman[] = []
    for (const { pattern, horseman } of horsemenPatterns) {
        if (pattern.test(text)) {
            horsemenFlags.push(horseman)
        }
    }

    // Simple mock transformation
    const transformedText = `I'm feeling upset right now. When ${text.toLowerCase().replace(/^you /, 'I notice that ').replace(/always|never/gi, 'sometimes')}, I feel hurt because I need to feel valued. Could we talk about this when we're both calm?`

    return {
        analysis: {
            horsemenFlags,
            sentiment: horsemenFlags.length > 0 ? 'tense' : 'neutral',
            suggestions: horsemenFlags.length > 0
                ? ['Try using "I feel" statements', 'Focus on specific behaviors, not character']
                : ['Good job expressing yourself!'],
        },
        transformedText,
    }
}
