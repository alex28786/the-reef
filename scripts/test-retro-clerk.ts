/**
 * Edge Function Integration Test Script
 * 
 * This script tests the retro-clerk edge function by:
 * 1. Setting up test data via Supabase client
 * 2. Calling the edge function
 * 3. Verifying the results in the database
 * 
 * Run with: npx tsx scripts/test-retro-clerk.ts
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sisrlbxaijnfrrvfjhli.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Xww6V1I6XgOGP0RJAApAuw_srgLCr0W'

// Test user IDs (from the remote database)
const ALEX_ID = '0cf6d8d1-c217-4347-be8f-82eb10fbb8a3'
const TIFF_ID = '47aba352-8c35-4a82-91ea-02f3ce392f7e'
const REEF_ID = '03fd9135-2611-4182-84df-b98170e055cd'

async function testRetroClerk() {
    console.log('🐙 Testing retro-clerk Edge Function...\n')

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Use a specific test retro ID that we know has 2 submissions
    const retroId = '29c124c1-cd67-45ed-8a68-16e9607d42d7'

    console.log(`📋 Using Retro ID: ${retroId}`)

    // Step 1: Check current state
    console.log('\n1️⃣ Checking current submissions...')
    const { data: submissions, error: fetchError } = await supabase
        .from('retro_submissions')
        .select('id, author_id, raw_narrative, ai_analysis')
        .eq('retro_id', retroId)

    if (fetchError) {
        console.error('❌ Failed to fetch submissions:', fetchError)
        return
    }

    console.log(`   Found ${submissions?.length || 0} submissions`)
    submissions?.forEach((s, i) => {
        console.log(`   ${i + 1}. Author: ${s.author_id.substring(0, 8)}..., AI Analysis: ${JSON.stringify(s.ai_analysis).substring(0, 50)}...`)
    })

    if (!submissions || submissions.length < 2) {
        console.log('⚠️  Client sees 0 submissions (RLS). But function uses service role, so continuing...')
    }

    // Step 2: Call the Edge Function
    console.log('\n2️⃣ Calling retro-clerk edge function...')
    const functionUrl = `${SUPABASE_URL}/functions/v1/retro-clerk`

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ retro_id: retroId }),
        })

        const result = await response.json()
        console.log(`   Response Status: ${response.status}`)
        console.log(`   Response Body: ${JSON.stringify(result, null, 2)}`)

        if (result.status === 'revealed') {
            console.log('\n✅ SUCCESS: Edge function returned "revealed"!')
        } else if (result.status === 'waiting') {
            console.log('\n⏳ WAITING: Partner submission not found')
        } else if (result.error) {
            console.log(`\n❌ ERROR: ${result.error}`)
        }

    } catch (err) {
        console.error('❌ Failed to call edge function:', err)
        return
    }

    // Step 3: Verify database state
    console.log('\n3️⃣ Verifying database state...')

    const { data: retroAfter } = await supabase
        .from('retros')
        .select('id, title, status')
        .eq('id', retroId)
        .single()

    console.log(`   Retro Status: ${retroAfter?.status}`)

    const { data: submissionsAfter } = await supabase
        .from('retro_submissions')
        .select('author_id, ai_analysis')
        .eq('retro_id', retroId)

    console.log(`   Submissions with AI Analysis:`)
    submissionsAfter?.forEach((s, i) => {
        const hasAnalysis = s.ai_analysis && Object.keys(s.ai_analysis).length > 0
        console.log(`   ${i + 1}. Author ${s.author_id.substring(0, 8)}...: ${hasAnalysis ? '✅ Has AI Analysis' : '❌ No AI Analysis'}`)
        if (hasAnalysis) {
            console.log(`      Preview: ${JSON.stringify(s.ai_analysis).substring(0, 100)}...`)
        }
    })

    console.log('\n🐙 Test complete!')
}

testRetroClerk().catch(console.error)
