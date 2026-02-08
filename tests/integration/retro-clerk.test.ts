
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Only run if explicitly requested to save tokens
const runAiTests = process.env.RUN_AI_TESTS === 'true'

describe.skipIf(!runAiTests)('Retro Clerk Integration', () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Need this locally
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    it('should reveal retro when 2 submissions exist', async () => {
        // 1. Create Reef & Retro
        const { data: reef } = await supabase.from('reefs').insert({ name: 'Integration Test Reef' }).select().single().throwOnError()
        const { data: retro } = await supabase.from('retros').insert({
            reef_id: reef.id,
            title: 'AI Test Retro',
            status: 'pending'
        }).select().single().throwOnError()

        // 2. Create Users (Profiles)
        // We need auth users... this is hard in integration test without creating real auth users.
        // Alternative: Just insert into 'profiles' if foreign key allows? 
        // Profiles refs auth.users. We need UUIDs that exist in auth.users?
        // Or we might fail FK constraint.
        // If local Supabase, we can use existing users or mock?
        // Let's assume we can't easily create auth users.

        // Actually, for "retro_submissions", author_id refers to profiles(id). profiles(id) refers to auth.users(id).
        // So we need real users.
        // We can pick existing users from DB?
        const { data: users } = await supabase.from('profiles').select('id').limit(2)
        if (!users || users.length < 2) {
            console.warn('Not enough users for integration test')
            return
        }

        const [user1, user2] = users

        // 3. Create Submissions
        await supabase.from('retro_submissions').insert([
            { retro_id: retro.id, author_id: user1.id, raw_narrative: 'I washed the dishes.' },
            { retro_id: retro.id, author_id: user2.id, raw_narrative: 'He broke a plate.' }
        ]).throwOnError()

        // 4. Call Edge Function
        // Assuming running locally at default port 54321
        const response = await fetch(`${supabaseUrl}/functions/v1/retro-clerk`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`, // Use service key to call function
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ retro_id: retro.id })
        })

        const result = await response.json()
        expect(response.status).toBe(200)
        expect(result.status).toBe('revealed')

        // 5. Verify DB
        const { data: updatedRetro } = await supabase.from('retros').select('*').eq('id', retro.id).single()
        expect(updatedRetro.status).toBe('revealed')

        const { data: submissions } = await supabase.from('retro_submissions').select('*').eq('retro_id', retro.id)

        if (submissions) {
            expect(submissions[0].ai_analysis).not.toEqual({})
            expect(submissions[1].ai_analysis).not.toEqual({})
        } else {
            throw new Error('No submissions found')
        }
    })
})
