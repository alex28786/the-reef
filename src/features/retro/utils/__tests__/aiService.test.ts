import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRetroStatus } from '../aiService'
import { buildEdgeHeaders, getAiMockFlag } from '../../../../shared/lib/aiConfig'

vi.mock('../../../../shared/lib/aiConfig', () => ({
    buildEdgeHeaders: vi.fn(() => ({ 'Content-Type': 'application/json' })),
    getAiMockFlag: vi.fn(),
}))

describe('retro aiService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('passes the mock flag to the edge function', async () => {
        vi.mocked(getAiMockFlag).mockReturnValue(true)
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ status: 'waiting' }),
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await checkRetroStatus('retro-id', 'token')

        const body = JSON.parse(fetchMock.mock.calls[0][1].body)
        expect(buildEdgeHeaders).toHaveBeenCalledWith('token')
        expect(body.mock).toBe(true)
        expect(result.status).toBe('waiting')
    })
})
