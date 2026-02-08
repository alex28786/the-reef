// Bridge AI Edge Function
// Deploy with: supabase functions deploy bridge-ai

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Anthropic from 'npm:@anthropic-ai/sdk@0.26.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
    text: string
    fourHorsemenPrompt: string
    nvcPrompt: string
    mock?: boolean
}

interface AnalysisResult {
    horsemenFlags: string[]
    detectedHorsemen: Array<{ type: string; reason: string; quote: string }>
    sentiment: string
    suggestions: string[]
}

const defaultAnalysis: AnalysisResult = {
    horsemenFlags: [],
    detectedHorsemen: [],
    sentiment: 'neutral',
    suggestions: [],
}

function normalizeAnalysis(raw: unknown): AnalysisResult {
    if (!raw || typeof raw !== 'object') return defaultAnalysis
    const candidate = raw as Partial<AnalysisResult>
    return {
        horsemenFlags: Array.isArray(candidate.horsemenFlags) ? candidate.horsemenFlags : [],
        detectedHorsemen: Array.isArray(candidate.detectedHorsemen) ? candidate.detectedHorsemen : [],
        sentiment: typeof candidate.sentiment === 'string' ? candidate.sentiment : 'neutral',
        suggestions: Array.isArray(candidate.suggestions) ? candidate.suggestions : [],
    }
}

function extractJson(text: string) {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    try {
        return JSON.parse(jsonMatch[0])
    } catch {
        return null
    }
}

Deno.serve(async (req: Request) => {
    const requestId = crypto.randomUUID()
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { ...corsHeaders, 'x-request-id': requestId } })
    }

    try {
        const { text, fourHorsemenPrompt, nvcPrompt, mock } = await req.json() as RequestBody
        const allowMock = Deno.env.get('ALLOW_MOCK') === 'true'
        const useMock = Boolean(mock && allowMock)

        if (!text || typeof text !== 'string' || text.trim().length < 3) {
            return new Response(
                JSON.stringify({ error: 'Invalid text input' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
                    status: 400,
                }
            )
        }

        // MOCK MODE
        if (useMock) {
            console.log('Using Mock Mode', requestId)
            return new Response(
                JSON.stringify({
                    analysis: {
                        horsemenFlags: ['criticism'],
                        detectedHorsemen: [{
                            type: 'criticism',
                            reason: 'Mock Reason: Used "always/never"',
                            quote: text.substring(0, 20)
                        }],
                        sentiment: 'tense',
                        suggestions: ['Try using "I feel" statements']
                    },
                    transformedText: `[MOCK] I feel frustrated when I see ${text} because I need support.`
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
                    status: 200
                }
            )
        }

        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
        if (!anthropicKey) {
            throw new Error('ANTHROPIC_API_KEY not configured')
        }

        const anthropic = new Anthropic({ apiKey: anthropicKey })

        // Analyze for Four Horsemen
        const analysisResponse = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            system: `${fourHorsemenPrompt}\n\nReturn ONLY valid JSON.`,
            messages: [{ role: 'user', content: text }]
        })

        let analysis = defaultAnalysis

        try {
            const analysisText = analysisResponse.content[0].type === 'text'
                ? analysisResponse.content[0].text
                : ''
            const parsed = extractJson(analysisText)
            analysis = normalizeAnalysis(parsed)
        } catch {
            console.error('Failed to parse analysis response', requestId)
        }

        // Generate NVC transformation
        const transformResponse = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            system: nvcPrompt,
            messages: [{ role: 'user', content: text }]
        })

        const transformedText = transformResponse.content[0].type === 'text'
            ? transformResponse.content[0].text
            : text

        return new Response(
            JSON.stringify({
                analysis,
                transformedText: transformedText.trim()
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
                status: 200
            }
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId },
                status: 500
            }
        )
    }
})
