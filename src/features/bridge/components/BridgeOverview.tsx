import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MessageCircle } from 'lucide-react'
import { Button, Card, Input } from '../../../shared/components'
import { fetchRows } from '../../../shared/lib/supabaseApi'
import { useAuth } from '../../auth'
import type { BridgeMessage, Emotion } from '../types'
import { EMOTIONS } from '../types'

export function BridgeOverview() {
    const { profile, accessToken } = useAuth()
    const navigate = useNavigate()
    const [messages, setMessages] = useState<BridgeMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState('')

    useEffect(() => {
        async function fetchMessages() {
            if (!profile?.reef_id || !accessToken) return

            const { data, error: fetchError } = await fetchRows<BridgeMessage>(
                'bridge_messages',
                accessToken,
                `&reef_id=eq.${profile.reef_id}&order=created_at.desc`
            )

            if (fetchError) {
                console.error('Error fetching messages:', fetchError)
                setError('Failed to load messages.')
            } else {
                setMessages(data || [])
            }
            setLoading(false)
        }

        if (profile?.reef_id && accessToken) {
            fetchMessages()
        }
    }, [profile?.reef_id, accessToken])

    const filteredMessages = messages.filter(msg => {
        if (!filter) return true
        const search = filter.toLowerCase()
        return (
            msg.original_text.toLowerCase().includes(search) ||
            (msg.transformed_text && msg.transformed_text.toLowerCase().includes(search)) ||
            msg.emotion.toLowerCase().includes(search)
        )
    })

    function getEmotionEmoji(emotion: Emotion) {
        return EMOTIONS.find(e => e.value === emotion)?.emoji || '😐'
    }

    return (
        <div className="max-w-lg mx-auto">
            <Button
                onClick={() => navigate('/bridge/new')}
                className="w-full mb-6"
            >
                <Plus size={20} />
                New Bridge Message
            </Button>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                <Input
                    placeholder="Search messages..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-10"
                />
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <Loader />
                    <p className="text-[var(--color-text-muted)] mt-2">Loading messages...</p>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-6">
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {filteredMessages.length === 0 ? (
                        <Card className="text-center py-8">
                            <MessageCircle className="mx-auto mb-3 text-[var(--color-text-muted)]" size={32} />
                            <p className="text-[var(--color-text-muted)]">
                                {filter ? 'No messages match your search.' : 'No messages yet. Start a conversation!'}
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredMessages.map((msg) => {
                                const isMe = msg.sender_id === profile?.id
                                const isUnread = !isMe && !msg.acknowledged_at

                                return (
                                    <Card
                                        key={msg.id}
                                        className={`transition-colors cursor-pointer hover:border-[var(--color-seafoam)] ${isUnread ? 'border-l-4 border-l-[var(--color-coral)]' : ''}`}
                                        onClick={() => navigate(`/bridge/${msg.id}`)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl" title={msg.emotion}>
                                                    {getEmotionEmoji(msg.emotion)}
                                                </span>
                                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isMe ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                                    {isMe ? 'You Sent' : 'Received'}
                                                </span>
                                                {isUnread && (
                                                    <span className="bg-[var(--color-coral)] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-[var(--color-text-muted)]">
                                                {new Date(msg.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-[var(--color-text)] line-clamp-2 text-sm">
                                            {msg.transformed_text || msg.original_text}
                                        </p>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

function Loader() {
    return (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-text)] mx-auto"></div>
    )
}
