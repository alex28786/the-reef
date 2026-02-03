import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { Layout } from '../Layout'

export function ProtectedRoute() {
    const { user, loading, profile } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-bounce">🐚</div>
                    <p className="text-[var(--color-text-muted)]">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // User is logged in but not linked to a reef yet
    if (!profile?.reef_id) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">🏝️</div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">
                        Welcome to The Reef!
                    </h1>
                    <p className="text-[var(--color-text-muted)] mb-2">
                        Your account has been created, but you're not linked to a reef yet.
                    </p>
                    <p className="text-[var(--color-text-muted)] text-sm">
                        Please wait for the admin to add you to a reef environment.
                    </p>
                    <p className="text-[var(--color-seafoam)] text-xs mt-6">
                        User ID: {user.id}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <Layout>
            <Outlet />
        </Layout>
    )
}
