import { describe, it, expect, vi } from 'vitest'
import { fetchProfileById } from '../profileRepository'
import { fetchSingleRow } from '../supabaseApi'

vi.mock('../supabaseApi', () => ({
    fetchSingleRow: vi.fn()
}))

describe('profileRepository', () => {
    it('fetches a profile by id', async () => {
        vi.mocked(fetchSingleRow).mockResolvedValueOnce({ data: { id: '1' }, error: null })

        const result = await fetchProfileById('token', '1')

        expect(fetchSingleRow).toHaveBeenCalledWith('profiles', 'token', '&id=eq.1')
        expect(result.data?.id).toBe('1')
    })
})
