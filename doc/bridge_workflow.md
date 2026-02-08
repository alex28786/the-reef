# The Bridge Workflow

## Overview
The Bridge is a tool for couples to communicate difficult feelings ("grievances") without triggering defensive reactions. It uses AI to filter out destructive communication patterns ("The Four Horsemen") and rewrite messages using Non-Violent Communication (NVC) principles.

## 1. Message Creation (Sender)

### Step 1.1: Emotion Selection
- **UI:** User selects a primary emotion (e.g., Anxious, Hurt, Frustrated) from a predefined list (`EMOTIONS`).
- **Data:** `emotion` enum value is stored.

### Step 1.2: Grievance Input (`InputGuard.tsx`)
- **UI:** User types their raw thought/feeling ("Grievance").
- **User Action:** Clicks "Let Seal Help".
- **System Action:** Applications calls `analyzeAndTransform(text)` in `aiService.ts`.

### Step 1.3: AI Analysis & Transformation
- **Client Side (`aiService.ts`):**
  - Fetches system prompts from Supabase `system_prompts` table (keys: `bridge_horsemen`, `bridge_nvc`).
  - Fallbacks to hardcoded defaults if DB fetch fails.
  - Calls Supabase Edge Function: `bridge-ai`.

- **Server Side (`supabase/functions/bridge-ai`):**
  - **Input:** `text`, `fourHorsemenPrompt`, `nvcPrompt`.
  - **Process 1 (Analysis):** Calls Anthropic (Claude 3 Haiku) to check for "Four Horsemen" (Criticism, Contempt, Defensiveness, Stonewalling).
    - *Prompt Logic:* "Analyze this text for destructive communication patterns... Respond with JSON { horsemenFlags, detectedHorsemen, sentiment, suggestions }."
  - **Process 2 (Transformation):** Calls Anthropic (Claude 3 Haiku) to rewrite the text.
    - *Prompt Logic:* "Rewrite using NVC framework: Observation, Feeling, Need, Request. Keep it authentic, no therapy-speak."
  - **Output:** Returns JSON with `analysis` and `transformedText`.

### Step 1.4: Review & Send (`MessageDelivery.tsx` - inferred)
- **UI:** User reviews the **Transformed Text** (not the raw text).
- **Data Saved:**
  - `original_text`: The raw input (encrypted/private).
  - `transformed_text`: The AI-rewritten version (visible to partner).
  - `emotion`: Selected emotion.
  - `ai_analysis`: The JSON analysis result.
- **Notification:** Partner receives a notification (handled by app logic).

## 2. Message Reception (Recipient)

### Step 2.1: View Message (`BridgeMessageDetail.tsx`)
- **UI:** Recipient sees the **Transformed Text** and the **Emotion**.
- **Note:** They do *not* see the raw original text initially (design choice to prevent hurt).

## 3. Response Flow

### Step 3.1: Draft Response
- **UI:** Recipient clicks "Reply with Seal's Help".
- **Input:** Recipient types a draft response.

### Step 3.2: AI Assistance (`handleAnalyzeResponse`)
- **System Action:** Calls same `analyzeAndTransform` function as Step 1.3.
- **UI:** Displays:
  - **Seal's Suggestion:** The NVC-rewritten response.
  - **Tips:** Specific advice based on detected "Horsemen" in the draft (e.g., "Try avoiding 'You always...").

### Step 3.3: Send Response
- **UI:** Recipient chooses to send either **Original** or **Suggested** text.
- **Data Saved:**
  - `response_text`: The chosen text.
  - `response_ai_analysis`: The analysis of the draft.
- **State:** Message is marked as "Replied".
