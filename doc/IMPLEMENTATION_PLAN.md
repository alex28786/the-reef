# The Reef - Implementation Plan

## Overview

"The Reef" is a relationship wellness Progressive Web App (PWA) designed to help couples communicate more effectively. The app uses AI-powered tools with friendly mascot personalities to guide users through difficult conversations and retrospective analysis.

---

## Phase 1: Foundation ✅ COMPLETE

### 1.1 Project Setup
- [x] Initialize Vite + React + TypeScript project
- [x] Configure ESLint and TypeScript strict mode
- [x] Set up CSS variables for theming (dark oceanic theme)
- [x] Create shared component library (Button, Card, Input, Textarea)

### 1.2 Authentication
- [x] Supabase Auth integration
- [x] Email/password login and signup
- [x] AuthContext provider with session management
- [x] Protected routes with reef_id validation

### 1.3 Database Schema
- [x] Design and implement PostgreSQL schema via Supabase
- [x] Tables: profiles, reefs, system_prompts, bridge_messages, retros, retro_submissions
- [x] Row Level Security (RLS) policies

---

## Phase 2: The Bridge Feature ✅ COMPLETE

### 2.1 UI Flow
- [x] Multi-step wizard: Emotion → Input → Transform → Send
- [x] EmotionSelector component with 12 emotion options
- [x] InputGuard component with horse character limit guide
- [x] NvcTransform component displaying AI analysis

### 2.2 AI Integration
- [x] Supabase Edge Function: bridge-ai
- [x] Anthropic Claude 3 Haiku integration
- [x] Four Horsemen detection (Criticism, Contempt, Defensiveness, Stonewalling)
- [x] NVC transformation (Observation, Feeling, Need, Request)
- [x] Mock fallback when edge function unavailable

### 2.3 Message Delivery
- [x] MessageDelivery component
- [x] Partner lookup via reef_id
- [x] Store original + transformed message in database

---

## Phase 3: The Retro Feature ✅ COMPLETE

### 3.1 Retrospective CRUD
- [x] RetroPage with list view
- [x] CreateRetro component
- [x] Retrospective status tracking (pending → submitted → revealed)

### 3.2 Blind Submission
- [x] BlindSubmission component for perspective entry
- [x] Track "Your story" vs "Partner's story" submission status
- [x] Prevent viewing partner's story until both submitted

### 3.3 AI Analysis
- [x] RevealView component for side-by-side comparison
- [x] Mock AI analysis: Video facts, Interpretations, Mind-reads
- [x] Future script generation placeholder

### 3.4 Edge Function
- [x] Supabase Edge Function: retro-clerk
- [x] Deployed with --no-verify-jwt

---

## Phase 4: Deployment ✅ COMPLETE

### 4.1 Netlify Setup
- [x] netlify.toml configuration
- [x] SPA routing redirects
- [x] Security headers
- [x] Environment variables configured

### 4.2 Supabase Cloud
- [x] Project linked to cloud instance
- [x] Migrations pushed
- [x] Edge functions deployed
- [x] ANTHROPIC_API_KEY secret set

### 4.3 Bug Fixes
- [x] AbortError workaround (raw fetch API)
- [x] TypeScript build errors resolved
- [x] Edge function authentication fixed

---

## Phase 5: Enhancements (PLANNED)

### 5.1 Real Retro AI
- [ ] Implement actual Claude analysis in retro-clerk
- [ ] Rashomon Protocol: identify facts vs interpretations
- [ ] Pattern detection across multiple retrospectives

### 5.2 Partner Invitation System
- [ ] Email invitation flow
- [ ] QR code pairing
- [ ] Reef creation wizard

### 5.3 Message History
- [ ] View sent/received messages
- [ ] Emotion trends over time
- [ ] Weekly summary emails

### 5.4 Push Notifications
- [ ] Partner submitted notification
- [ ] Retrospective ready to reveal
- [ ] Gentle reminders

### 5.5 Offline Support
- [ ] Service worker for PWA
- [ ] Offline message drafting
- [ ] Sync when reconnected

---

## Architecture Decisions

### ADR-001: Raw Fetch over Supabase Client
**Decision**: Use raw fetch API (`supabaseApi.ts`) instead of Supabase JS client for data operations.
**Rationale**: Corporate network interference (Zscaler) causes AbortError with Supabase client's internal AbortController.
**Consequence**: Must manage auth headers manually; lose automatic type inference.

### ADR-002: No-Verify-JWT for Edge Functions
**Decision**: Deploy edge functions with `--no-verify-jwt` flag.
**Rationale**: Simplifies authentication; anon key sufficient for current use case.
**Consequence**: Edge functions accessible with just anon key; add request validation if needed.

### ADR-003: Mock Fallbacks
**Decision**: All AI features include mock responses when edge functions fail.
**Rationale**: Ensures app remains functional during development and edge function issues.
**Consequence**: Clear console warnings when using mocks; production monitoring needed.

---

## Testing Checklist

### Manual Testing (Completed 2026-02-04)
- [x] Login/logout flow
- [x] Profile creation on signup
- [x] Bridge: Full flow with real AI
- [x] Retro: Create → Submit → (waiting for partner)
- [x] Production build succeeds
- [x] Netlify deployment

### Automated Testing (TODO)
- [ ] Unit tests for components
- [ ] Integration tests for API helpers
- [ ] E2E tests with Playwright

---

## Contacts

- **Supabase Project**: sisrlbxaijnfrrvfjhli
- **GitHub Repo**: https://github.com/alex28786/the-reef.git
- **Netlify Site**: (configured via dashboard)
