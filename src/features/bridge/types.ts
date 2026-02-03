// Bridge Module Types - "The Seal" AI Assistant

export type Emotion =
    | 'angry'
    | 'frustrated'
    | 'hurt'
    | 'sad'
    | 'anxious'
    | 'confused'
    | 'disappointed'
    | 'overwhelmed'

export const EMOTIONS: { value: Emotion; label: string; emoji: string }[] = [
    { value: 'angry', label: 'Angry', emoji: '😠' },
    { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
    { value: 'hurt', label: 'Hurt', emoji: '💔' },
    { value: 'sad', label: 'Sad', emoji: '😢' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
    { value: 'confused', label: 'Confused', emoji: '😕' },
    { value: 'disappointed', label: 'Disappointed', emoji: '😞' },
    { value: 'overwhelmed', label: 'Overwhelmed', emoji: '😵' },
]

export type Horseman =
    | 'criticism'
    | 'contempt'
    | 'defensiveness'
    | 'stonewalling'

export interface AIAnalysis {
    horsemenFlags?: Horseman[]
    sentiment?: string
    suggestions?: string[]
    nvcRewrite?: string
}

export interface BridgeMessage {
    id: string
    reefId: string
    senderId: string
    recipientId: string
    emotion: Emotion
    originalText: string
    transformedText?: string
    aiAnalysis: AIAnalysis
    acknowledgedAt?: Date
    createdAt: Date
}

export interface BridgeFormData {
    emotion: Emotion | null
    grievance: string
}

// System prompt keys for Bridge feature
export const BRIDGE_PROMPTS = {
    NVC_TRANSFORM: 'bridge_nvc_transform_v1',
    FOUR_HORSEMEN: 'bridge_four_horsemen_v1',
} as const
