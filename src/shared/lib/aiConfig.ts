const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export function getAiMockFlag(): boolean {
    const configured = import.meta.env.VITE_AI_USE_MOCK
    if (configured === 'true') return true
    if (configured === 'false') return false
    return import.meta.env.DEV
}

export function buildEdgeHeaders(accessToken?: string): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken ?? supabaseAnonKey}`,
    }
}
