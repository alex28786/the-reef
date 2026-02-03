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
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
        if (!anthropicKey) {
            throw new Error('ANTHROPIC_API_KEY not configured')
        }

        const { text, fourHorsemenPrompt, nvcPrompt } = await req.json() as RequestBody

        const anthropic = new Anthropic({ apiKey: anthropicKey })

        // Analyze for Four Horsemen
        const analysisResponse = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            messages: [{
                role: 'user',
                content: fourHorsemenPrompt + '\n\n' + text
            }]
        })

        let analysis = {
            horsemenFlags: [],
            sentiment: 'neutral',
            suggestions: []
        }

        try {
            const analysisText = analysisResponse.content[0].type === 'text'
                ? analysisResponse.content[0].text
                : ''
            // Try to parse JSON from the response
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0])
            }
        } catch {
            console.error('Failed to parse analysis response')
        }

        // Generate NVC transformation
        const transformResponse = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            messages: [{
                role: 'user',
                content: nvcPrompt + '\n\n' + text
            }]
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
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})
