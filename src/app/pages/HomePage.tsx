import { Link } from 'react-router-dom'
import { Card, Button } from '../../shared/components'

export function HomePage() {
    return (
        <div className="py-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
                    Welcome to Your Reef
                </h1>
                <p className="text-[var(--color-text-muted)]">
                    Choose where you'd like to go today
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
                {/* The Bridge */}
                <Link to="/bridge">
                    <Card className="h-full hover:border-[var(--color-coral)] transition-colors cursor-pointer group">
                        <div className="text-center">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                                🦭
                            </div>
                            <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
                                The Bridge
                            </h2>
                            <p className="text-[var(--color-text-muted)] text-sm mb-4">
                                Real-time conflict resolution with Seal, your gentle guide through stormy emotions.
                            </p>
                            <Button variant="primary" className="w-full">
                                Start Conversation
                            </Button>
                        </div>
                    </Card>
                </Link>

                {/* The Retro */}
                <Link to="/retro">
                    <Card className="h-full hover:border-[var(--color-seafoam)] transition-colors cursor-pointer group">
                        <div className="text-center">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                                🐙
                            </div>
                            <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
                                The Retro
                            </h2>
                            <p className="text-[var(--color-text-muted)] text-sm mb-4">
                                Untangle past events with Octi, your wise companion for understanding perspectives.
                            </p>
                            <Button variant="secondary" className="w-full">
                                Start Retrospective
                            </Button>
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
