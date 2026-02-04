# The Reef - AI Features Documentation

## Overview

The Reef uses AI to help couples communicate more effectively. Two distinct AI personas provide guidance through different features.

---

## Mascots

### 🦭 Seal - "The Bridge"
- **Role**: Real-time communication transformer
- **Personality**: Gentle, supportive, encouraging
- **Emoji**: 🦭
- **Color**: Seafoam (#4FD1C5)
- **Philosophy**: "Let's find a kinder way to say this"

### 🐙 Octi - "The Retro"
- **Role**: Retrospective analyst and mediator
- **Personality**: Wise, neutral, pattern-seeking
- **Emoji**: 🐙
- **Color**: Coral/Orange gradient
- **Philosophy**: "There's always more to the story"

---

## The Bridge - AI Features

### Four Horsemen Detection

Based on Dr. John Gottman's research, Seal identifies destructive communication patterns:

| Horseman | Description | Example |
|----------|-------------|---------|
| **Criticism** | Attacking character, not behavior | "You always...", "You never..." |
| **Contempt** | Disrespect, mockery, superiority | Eye-rolling, sarcasm, name-calling |
| **Defensiveness** | Refusing responsibility | "It's not my fault", "Yes, but..." |
| **Stonewalling** | Withdrawing, shutting down | Silent treatment, leaving mid-conversation |

### NVC Transformation

Seal rewrites messages using Non-Violent Communication (NVC) framework:

1. **Observation**: What happened (facts only)
2. **Feeling**: Emotions triggered
3. **Need**: Underlying need not being met
4. **Request**: Specific, actionable request

### Example Transformation

**Original**: "You always forget important dates. You obviously don't care about us."

**Seal's Rewrite**: "I noticed our anniversary wasn't on the calendar this year. I'm feeling sad and a bit worried because connection and feeling valued are really important to me. Would you be open to us setting up a shared calendar for special dates?"

---

## The Retro - AI Features

### The Rashomon Protocol

Named after Akira Kurosawa's film about subjective truth, Octi analyzes conflicting narratives to find common ground.

#### Analysis Categories

1. **Video Camera Facts** 📹
   - Events a neutral observer would record
   - Times, places, words spoken, actions taken
   - No interpretation or emotion

2. **Interpretations** 💭
   - Subjective meanings assigned to facts
   - "I felt like you were..." 
   - "It seemed to me that..."

3. **Mind-Reads** 🧠⚠️
   - Assumptions about partner's thoughts/intentions
   - "You were trying to..."
   - "You must have thought..."
   - **Flagged as unreliable**

### Future Scripts

After analysis, Octi helps couples create "Future Scripts" - proactive plans for similar situations:

**Template**: "In the future, when [TRIGGER] happens, I will [ACTION] because I know I need [NEED]."

**Example**: "In the future, when I feel overwhelmed by chores, I will ask for a 10-minute break to reset because I know I need time to process before discussing household tasks."

---

## Edge Functions

### bridge-ai

**Endpoint**: `POST /functions/v1/bridge-ai`

**Request**:
```json
{
  "text": "Original message from user",
  "fourHorsemenPrompt": "System prompt for analysis",
  "nvcPrompt": "System prompt for transformation"
}
```

**Response**:
```json
{
  "analysis": {
    "horsemenFlags": ["criticism", "defensiveness"],
    "sentiment": "frustrated",
    "suggestions": ["Focus on specific behavior, not character"]
  },
  "transformedText": "NVC-style rewritten message"
}
```

### retro-clerk

**Endpoint**: `POST /functions/v1/retro-clerk`

**Request**:
```json
{
  "narrative": "User's perspective of the event",
  "prompt": "System prompt for analysis"
}
```

**Response**:
```json
{
  "videoFacts": ["He said X at 5pm", "We were in the kitchen"],
  "interpretations": ["I felt dismissed", "It seemed rushed"],
  "mindReads": ["He was trying to avoid the topic"],
  "emotionalUndertones": ["frustration", "hurt"],
  "patterns": ["Recurring theme: feeling unheard"]
}
```

---

## System Prompts

System prompts are stored in the `system_prompts` table for easy iteration:

| Key | Purpose |
|-----|---------|
| `bridge_four_horsemen_v1` | Four Horsemen detection |
| `bridge_nvc_transform_v1` | NVC rewriting |
| `retro_clerk_analysis_v1` | Narrative analysis |
| `retro_future_script_v1` | Future script generation |
| `retro_summary_v1` | Combined analysis summary |

---

## AI Provider

- **Provider**: Anthropic
- **Model**: Claude 3 Haiku (claude-3-haiku-20240307)
- **Max Tokens**: 500 per request
- **Temperature**: Default (balanced creativity/accuracy)

### Cost Considerations
- Haiku is optimized for speed and cost
- ~$0.25 per million input tokens
- ~$1.25 per million output tokens
- Estimated cost per Bridge transform: ~$0.001
- Estimated cost per Retro analysis: ~$0.002

---

## Mock Responses

When edge functions are unavailable, the app falls back to realistic mock responses:

### Bridge Mock
- Detects basic patterns via keyword matching
- Generates template NVC response
- Clearly logged as mock in console

### Retro Mock
- Returns placeholder analysis structure
- Uses generic patterns
- Allows UI testing without API

---

## Future AI Enhancements

1. **Emotion Detection**: Analyze sentiment from text input
2. **Pattern Tracking**: Identify recurring issues across sessions
3. **Personalization**: Learn couple's communication style
4. **Voice Input**: Transcription with emotion analysis
5. **Proactive Suggestions**: Weekly relationship tips based on usage
