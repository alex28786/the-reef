// Retro Clerk Edge Function (Octi's Analysis)
// Deploy with: supabase functions deploy retro-clerk

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Anthropic from 'npm:@anthropic-ai/sdk@0.26.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
    narrative: string
    prompt: string
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

        const { narrative, prompt } = await req.json() as RequestBody

        const anthropic = new Anthropic({ apiKey: anthropicKey })

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: prompt + '\n\n' + narrative
            }]
        })

        const responseText = response.content[0].type === 'text'
            ? response.content[0].text
            : ''

        // Try to parse JSON from the response
        let analysis = {
            videoFacts: [],
            interpretations: [],
            mindReads: [],
            emotionalUndertones: []
        }

        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0])
            }
        } catch {
            console.error('Failed to parse response as JSON')
        }

        return new Response(
            JSON.stringify(analysis),
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
