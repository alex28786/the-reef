import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeAndTransform } from '../aiService'
import { fetchSingleRow } from '../../../../shared/lib/supabaseApi'
import { buildEdgeHeaders, getAiMockFlag } from '../../../../shared/lib/aiConfig'

vi.mock('../../../../shared/lib/supabaseApi', () => ({
    fetchSingleRow: vi.fn(),
}))

vi.mock('../../../../shared/lib/aiConfig', () => ({
    buildEdgeHeaders: vi.fn(() => ({ 'Content-Type': 'application/json' })),
    getAiMockFlag: vi.fn(),
}))

describe('bridge aiService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('calls the edge function with prompts and mock flag', async () => {
        vi.mocked(fetchSingleRow).mockResolvedValue({ data: { prompt_text: 'prompt' }, error: null })
        vi.mocked(getAiMockFlag).mockReturnValue(true)

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ analysis: { horsemenFlags: [], detectedHorsemen: [], sentiment: 'neutral', suggestions: [] }, transformedText: 'ok' }),
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await analyzeAndTransform('hello', 'token')

        const body = JSON.parse(fetchMock.mock.calls[0][1].body)
        expect(buildEdgeHeaders).toHaveBeenCalledWith('token')
        expect(body.mock).toBe(true)
        expect(body.fourHorsemenPrompt).toBe('prompt')
        expect(result.transformedText).toBe('ok')
    })

    it('falls back to mock response when edge function fails', async () => {
        vi.mocked(fetchSingleRow).mockResolvedValue({ data: { prompt_text: 'prompt' }, error: null })
        vi.mocked(getAiMockFlag).mockReturnValue(false)

        const fetchMock = vi.fn().mockResolvedValue({ ok: false })
        vi.stubGlobal('fetch', fetchMock)

        const result = await analyzeAndTransform('You always do this', 'token')

        expect(result.transformedText).toContain('I\'m feeling upset')
        expect(result.analysis.horsemenFlags).toBeDefined()
        expect(result.analysis.horsemenFlags!.length).toBeGreaterThan(0)
    })
})
