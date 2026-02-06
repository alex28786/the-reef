import { fetchSingleRow } from './supabaseApi'

export interface Profile {
    id: string
    display_name: string
    avatar_url: string | null
    reef_id: string | null
    role: 'husband' | 'wife' | null
}

export async function fetchProfileById(accessToken: string, userId: string) {
    return fetchSingleRow<Profile>('profiles', accessToken, `&id=eq.${userId}`)
}
