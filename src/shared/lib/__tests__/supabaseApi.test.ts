import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ; (globalThis as any).fetch = mockFetch

// Set env vars before importing
vi.stubGlobal('import.meta', {
    env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    }
})

describe('supabaseApi', () => {
    beforeEach(() => {
        mockFetch.mockReset()
    })

    describe('fetchRows', () => {
        it('fetches rows successfully', async () => {
            const mockData = [{ id: '1', name: 'Test' }]
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockData),
            })

            // Import dynamically to use mocked globals
            const { fetchRows } = await import('../supabaseApi')
            const result = await fetchRows('profiles', 'test-token')

            expect(result.data).toEqual(mockData)
            expect(result.error).toBeNull()
            expect(mockFetch).toHaveBeenCalled()
        })

        it('handles errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: () => Promise.resolve('Internal Server Error'),
            })

            const { fetchRows } = await import('../supabaseApi')
            const result = await fetchRows('profiles', 'test-token')

            expect(result.data).toBeNull()
            expect(result.error).toBeInstanceOf(Error)
        })
    })

    describe('insertRow', () => {
        it('inserts row with POST method', async () => {
            const mockData = { id: '1', name: 'New Profile' }
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: () => Promise.resolve(mockData),
            })

            const { insertRow } = await import('../supabaseApi')
            const result = await insertRow('profiles', 'test-token', { name: 'New Profile' })

            expect(result.data).toEqual(mockData)
            expect(mockFetch).toHaveBeenCalled()

            // Verify POST method was used
            const callArgs = mockFetch.mock.calls[0]
            expect(callArgs[1].method).toBe('POST')
        })
    })

    describe('updateRow', () => {
        it('updates row with PATCH method', async () => {
            const mockData = { id: '1', name: 'Updated' }
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockData),
            })

            const { updateRow } = await import('../supabaseApi')
            const result = await updateRow('profiles', 'test-token', 'id=eq.1', { name: 'Updated' })

            expect(result.data).toEqual(mockData)

            // Verify PATCH method was used
            const callArgs = mockFetch.mock.calls[0]
            expect(callArgs[1].method).toBe('PATCH')
        })
    })

    describe('deleteRow', () => {
        it('deletes row with DELETE method', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 204,
            })

            const { deleteRow } = await import('../supabaseApi')
            const result = await deleteRow('profiles', 'test-token', 'id=eq.1')

            expect(result.error).toBeNull()

            // Verify DELETE method was used
            const callArgs = mockFetch.mock.calls[0]
            expect(callArgs[1].method).toBe('DELETE')
        })
    })
})
