# The Retro Workflow

## Overview
The Retro allows couples to process specific events separately ("Blind Submission") and then reveals the objective truth vs. subjective interpretation ("The Reveal"), facilitated by AI mediation.

## 1. Retrospective Creation (`CreateRetro.tsx`)
- **Input:**
  - `Title`: What event to discuss.
  - `Event Date`: When it happened.
  - `Context`: Optional shared context.
- **Data:** Creates a row in `retros` table with status `pending`.

## 2. Blind Submission (`BlindSubmission.tsx`)
- **Context:** Both partners see the Title and Shared Context.
- **Input:** Each partner writes their **Narrative** ("What happened from your perspective?").
- **Constraints:**
  - Users cannot see each other's submissions yet.
  - Doing so forces independent processing and prevents "pre-biasing".
- **Data:** Saves row in `retro_submissions` with `raw_narrative`.
- **Check Status:** App polls `checkRetroStatus`.

## 3. AI Analysis & Reveal (`supabase/functions/retro-clerk`)

### Step 3.1: Status Check
- **Trigger:** When `checkRetroStatus` is called (after submission or manual refresh).
- **Logic:** Checks if *both* partners associated with the Reef have submitted.
- **Condition:**
  - If count < 2: Status stays `waiting`.
  - If count == 2: Proceeds to analysis.

### Step 3.2: AI Analysis
- **Process:** Iterates through each submission.
- **Idempotency:** Checks if `ai_analysis` column is already populated to avoid re-running.
- **AI Call:** Calls Anthropic (Claude 3 Haiku).
- **System Prompt:**
  > "You are Octi, a wise and neutral mediator... Help them separate 'Video Camera Facts' from 'Interpretations' and 'Mind Reads'."
- **Output Structure:**
  - `videoFacts`: Objective actions (stripped of emotion).
  - `interpretations`: Subjective meanings/feelings.
  - `mindReads`: Assumptions about partner's intent.
  - `emotionalUndertones`: 1-2 word emotion labels.
- **Data Update:** Updates `retro_submissions.ai_analysis` and sets `retros.status` to `revealed`.

## 4. The Reveal (`RevealView.tsx`)

### Step 4.1: Comparison View
- **UI:** Displays two columns side-by-side: "Your Perspective" vs "Partner's Perspective".
- **Content:** Shows the AI-extracted `videoFacts`, `interpretations`, etc., helping users see where their stories diverge vs. agree.

### Step 4.2: Shared Agreement
- **Goal:** Commit to a behavioral change.
- **UI:** "Shared Agreement" section at the bottom.
- **Input:** Users discuss and type a joint commitment (e.g., "In the future, when X happens, we will Y").
- **Feature:** "Suggestion" button (uses a simple client-side template, currently hardcoded logic in `RevealView.tsx`: _"In the future, when we notice we're interrupting..."_).
- **Data:** Saves text to `retros.final_agreement`.

## 5. Overview (`RetroPage.tsx`)
- **Display:** Shows list of past retrospectives.
- **Agreements:** Displays a summary list of all "Shared Agreements" from completed retrospectives for easy reference.
