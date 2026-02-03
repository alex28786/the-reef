// Raw fetch-based Supabase API helpers to bypass AbortController issues
// Use this instead of the supabase client for data operations

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

interface FetchOptions {
    accessToken: string
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
    single?: boolean
}

export async function supabaseFetch<T>(
    table: string,
    query: string,
    options: FetchOptions
): Promise<{ data: T | null; error: Error | null }> {
    const { accessToken, method = 'GET', body, single } = options

    try {
        const headers: Record<string, string> = {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        }

        // For single row responses
        if (single) {
            headers['Accept'] = 'application/vnd.pgrst.object+json'
        }

        // For upsert/returning data
        if (method === 'POST' || method === 'PATCH') {
            headers['Prefer'] = 'return=representation'
        }

        const response = await fetch(
            `${supabaseUrl}/rest/v1/${table}${query}`,
            {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        // Handle empty responses (204 No Content)
        if (response.status === 204) {
            return { data: null, error: null }
        }

        const data = await response.json()
        return { data, error: null }
    } catch (err) {
        console.error('[supabaseFetch] Error:', err)
        return { data: null, error: err as Error }
    }
}

// Convenience methods
export async function fetchRows<T>(
    table: string,
    accessToken: string,
    filters: string = ''
): Promise<{ data: T[] | null; error: Error | null }> {
    return supabaseFetch<T[]>(table, `?select=*${filters}`, { accessToken })
}

export async function fetchSingleRow<T>(
    table: string,
    accessToken: string,
    filters: string
): Promise<{ data: T | null; error: Error | null }> {
    return supabaseFetch<T>(table, `?select=*${filters}`, { accessToken, single: true })
}

export async function insertRow<T>(
    table: string,
    accessToken: string,
    data: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
    return supabaseFetch<T>(table, '?select=*', {
        accessToken,
        method: 'POST',
        body: data,
        single: true
    })
}

export async function updateRow<T>(
    table: string,
    accessToken: string,
    filters: string,
    data: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
    return supabaseFetch<T>(table, `?${filters}&select=*`, {
        accessToken,
        method: 'PATCH',
        body: data,
        single: true
    })
}

export async function deleteRow(
    table: string,
    accessToken: string,
    filters: string
): Promise<{ error: Error | null }> {
    const result = await supabaseFetch(table, `?${filters}`, {
        accessToken,
        method: 'DELETE'
    })
    return { error: result.error }
}
