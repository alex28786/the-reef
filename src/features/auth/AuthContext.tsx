import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../../shared/lib/supabase'
import { fetchProfileById } from '../../shared/lib/profileRepository'
import type { Profile } from '../../shared/lib/profileRepository'
import { logger } from '../../shared/lib/logger'

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
    const enableAutologin = import.meta.env.VITE_ENABLE_AUTOLOGIN === 'true' || import.meta.env.DEV

    // Auto-login via URL parameter: ?autologin=email/password
    useEffect(() => {
        if (!enableAutologin) return
        const params = new URLSearchParams(window.location.search)
        const autologin = params.get('autologin')

        if (autologin) {
            const [email, password] = autologin.split('/')
            if (email && password) {
                logger.info('[Auth] Auto-login detected for:', email)
                // Remove the autologin param from URL to prevent re-triggering
                const newUrl = window.location.pathname +
                    (params.toString() ? '?' + (() => { params.delete('autologin'); return params.toString() })() : '')
                window.history.replaceState({}, '', newUrl || window.location.pathname)

                // Trigger auto-login
                supabase.auth.signInWithPassword({ email, password })
                    .then(({ error }) => {
                        if (error) {
                            logger.error('[Auth] Auto-login failed:', error.message)
                        } else {
                            logger.info('[Auth] Auto-login successful!')
                        }
                    })
            }
        }
    }, [enableAutologin])

    useEffect(() => {
        // Get initial session with error handling
        logger.info('[Auth] Starting initial session check...')
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                logger.debug('[Auth] Got session:', session ? 'YES' : 'NO', session?.user?.id)
                setSession(session)
                setUser(session?.user ?? null)
                if (session?.user && session.access_token) {
                    logger.debug('[Auth] User found, fetching profile...')
                    fetchProfile(session.user.id, session.access_token)
                } else {
                    logger.debug('[Auth] No user, setting loading to false')
                    setLoading(false)
                }
            })
            .catch((error) => {
                logger.error('[Auth] Error getting session:', error)
                setLoading(false)
            })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                logger.debug('[Auth] Auth state changed:', event, session?.user?.id)
                setLoading(true)
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user && session.access_token) {
                    logger.debug('[Auth] Session user found after state change, fetching profile...')
                    await fetchProfile(session.user.id, session.access_token)
                } else {
                    logger.debug('[Auth] No session user after state change')
                    setProfile(null)
                }
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(userId: string, accessToken: string, retries = 3): Promise<void> {
        for (let attempt = 1; attempt <= retries; attempt++) {
            logger.debug(`[Auth] Attempting profile fetch (attempt ${attempt}/${retries})...`)
            try {
                const { data, error } = await fetchProfileById(accessToken, userId)
                if (error) {
                    if (error.message.includes('406')) {
                        logger.debug('[Auth] No profile found (406)')
                        setProfile(null)
                        setLoading(false)
                        return
                    }
                    throw error
                }
                setProfile(data)
                setLoading(false)
                return
            } catch (err) {
                logger.error(`[Auth] Exception fetching profile (attempt ${attempt}):`, err)
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, 500 * attempt))
                    continue
                }
            }
        }
        // All retries failed
        logger.error('[Auth] All profile fetch attempts failed')
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
            // Create profile for new user using raw fetch to bypass type issues
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

            await fetch(`${supabaseUrl}/rest/v1/profiles`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                    id: data.user.id,
                    display_name: displayName,
                }),
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
