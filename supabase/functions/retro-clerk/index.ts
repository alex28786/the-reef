// Retro Clerk Edge Function (Octi's Analysis)
// Deploy with: supabase functions deploy retro-clerk

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@0.26.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
    retro_id: string
    mock?: boolean
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { retro_id, mock } = await req.json() as RequestBody

        if (!retro_id) throw new Error('Missing retro_id')

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

        // Initialize Supabase Admin Client (Bypass RLS)
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Fetch Submissions
        const { data: submissions, error: fetchError } = await supabase
            .from('retro_submissions')
            .select('*')
            .eq('retro_id', retro_id)

        if (fetchError) throw fetchError

        // 2. Check Count
        if (!submissions || submissions.length < 2) {
            return new Response(
                JSON.stringify({ status: 'waiting', message: 'Waiting for partner submission' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // 3. Analyze Submissions (if needed) and Update
        // Only run analysis if it's missing (idempotency)
        const updates = submissions.map(async (sub) => {
            if (sub.ai_analysis && Object.keys(sub.ai_analysis).length > 0) {
                return // Already analyzed
            }

            // Run Analysis
            let analysis = {}
            if (mock) {
                console.log('Using Mock Analysis')
                analysis = generateMockAnalysis(sub.raw_narrative)
            } else if (anthropicKey) {
                analysis = await runAnthropicAnalysis(sub.raw_narrative, anthropicKey)
            } else {
                // Should not happen in prod, but safe fallback for tests/local without key
                console.warn('No Anthropic Key, using fallback')
                analysis = generateMockAnalysis(sub.raw_narrative)
            }

            // Update Submission
            const { error: updateError } = await supabase
                .from('retro_submissions')
                .update({ ai_analysis: analysis })
                .eq('id', sub.id)

            if (updateError) throw updateError
        })

        await Promise.all(updates)

        // 4. Update Retro Status to 'revealed'
        const { error: retroError } = await supabase
            .from('retros')
            .update({ status: 'revealed' })
            .eq('id', retro_id)

        if (retroError) throw retroError

        return new Response(
            JSON.stringify({ status: 'revealed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})

// Helper: Run Anthropic Analysis
async function runAnthropicAnalysis(narrative: string, apiKey: string) {
    const anthropic = new Anthropic({ apiKey })

    const systemPrompt = `You are Octi, a wise and neutral mediator for couples. 
Your goal is to help them separate "Video Camera Facts" (what happened) from "Interpretations" (the meaning they assigned to it) and "Mind Reads" (assumptions about the other's intent).

Analyze the provided narrative and extract:
1. "videoFacts": A list of objective actions that a security camera would record, stripped of emotional language.
2. "interpretations": A list of subjective meanings or feelings the author experienced.
3. "mindReads": A list of assumptions the author made about their partner's thoughts or intentions (e.g., "He didn't care," "She was doing it to annoy me").
4. "emotionalUndertones": A list of 1-2 word emotion labels detected.

Output ONLY valid JSON in this format:
{
  "videoFacts": ["..."],
  "interpretations": ["..."],
  "mindReads": ["..."],
  "emotionalUndertones": ["..."]
}`

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: 'user', content: narrative }]
        })

        const text = response.content[0].type === 'text' ? response.content[0].text : ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        return jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch (e) {
        console.error('Anthropic Error:', e)
        return generateMockAnalysis(narrative) // Fallback if API fails
    }
}

// Helper: Mock Analysis (from aiService.ts)
function generateMockAnalysis(narrative: string) {
    return {
        videoFacts: ['[MOCK] Event occurred at ' + new Date().toLocaleTimeString(), '[MOCK] Action observed'],
        interpretations: ['[MOCK] User felt ignored', '[MOCK] Situation interpreted as negative'],
        mindReads: ['[MOCK] Partner did not care', '[MOCK] Partner was busy'],
        emotionalUndertones: ['[MOCK] Frustration', '[MOCK] Longing']
    }
}
