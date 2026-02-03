import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../../shared/lib/supabase'

interface Profile {
    id: string
    display_name: string
    avatar_url: string | null
    reef_id: string | null
    role: 'husband' | 'wife' | null
}

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    accessToken: string | null
    loading: boolean
    signInWithGoogle: () => Promise<{ error: AuthError | null }>
    signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signUpWithEmail: (email: string, password: string, displayName: string) => Promise<{ error: AuthError | null }>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session with error handling
        console.log('[Auth] Starting initial session check...')
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                console.log('[Auth] Got session:', session ? 'YES' : 'NO', session?.user?.id)
                setSession(session)
                setUser(session?.user ?? null)
                if (session?.user && session.access_token) {
                    console.log('[Auth] User found, fetching profile...')
                    fetchProfile(session.user.id, session.access_token)
                } else {
                    console.log('[Auth] No user, setting loading to false')
                    setLoading(false)
                }
            })
            .catch((error) => {
                console.error('[Auth] Error getting session:', error)
                setLoading(false)
            })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[Auth] Auth state changed:', event, session?.user?.id)
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user && session.access_token) {
                    console.log('[Auth] Session user found after state change, fetching profile...')
                    await fetchProfile(session.user.id, session.access_token)
                } else {
                    console.log('[Auth] No session user after state change')
                    setProfile(null)
                }
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(userId: string, accessToken: string, retries = 3): Promise<void> {
        console.log('[Auth] fetchProfile called with userId:', userId)

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        for (let attempt = 1; attempt <= retries; attempt++) {
            console.log(`[Auth] Attempting profile fetch (attempt ${attempt}/${retries})...`)
            try {
                // Use raw fetch to bypass Supabase client's AbortController
                const response = await fetch(
                    `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
                    {
                        method: 'GET',
                        headers: {
                            'apikey': supabaseAnonKey,
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/vnd.pgrst.object+json',
                        },
                    }
                )

                console.log('[Auth] Profile fetch response status:', response.status)

                if (!response.ok) {
                    if (response.status === 406) {
                        // No profile found
                        console.log('[Auth] No profile found (406)')
                        setProfile(null)
                        setLoading(false)
                        return
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }

                const data = await response.json()
                console.log('[Auth] Profile data received:', data)

                setProfile(data)
                setLoading(false)
                return
            } catch (err) {
                console.error(`[Auth] Exception fetching profile (attempt ${attempt}):`, err)
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, 500 * attempt))
                    continue
                }
            }
        }
        // All retries failed
        console.error('[Auth] All profile fetch attempts failed')
        setProfile(null)
        setLoading(false)
    }

    async function signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        })
        return { error }
    }

    async function signInWithEmail(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { error }
    }

    async function signUpWithEmail(email: string, password: string, displayName: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (!error && data.user) {
            // Create profile for new user
            await supabase.from('profiles').insert({
                id: data.user.id,
                display_name: displayName,
            })
        }

        return { error }
    }

    async function signOut() {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setSession(null)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                accessToken: session?.access_token ?? null,
                loading,
                signInWithGoogle,
                signInWithEmail,
                signUpWithEmail,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
