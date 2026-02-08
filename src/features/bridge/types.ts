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

export interface HorsemanDetection {
    type: Horseman
    reason: string
    quote: string
}

export interface AIAnalysis {
    horsemenFlags?: Horseman[]
    detectedHorsemen?: HorsemanDetection[]
    sentiment?: string
    suggestions?: string[]
    nvcRewrite?: string
}

export interface BridgeMessage {
    id: string
    reef_id: string
    sender_id: string
    recipient_id: string
    emotion: Emotion
    original_text: string
    transformed_text?: string
    ai_analysis: AIAnalysis
    response_text?: string
    response_ai_analysis?: AIAnalysis
    acknowledged_at?: Date | string
    created_at: Date | string
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
