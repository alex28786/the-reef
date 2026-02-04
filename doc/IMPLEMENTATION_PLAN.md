# The Reef - Roadmap

## Current Status: MVP Complete ✅

Core features implemented:
- Authentication (Supabase Auth)
- The Bridge (Seal NVC transformation with Claude AI)
- The Retro (Octi retrospective with blind submission)
- Deployed on Netlify

---

## Next Steps (Priority Order)

### P0 - Critical
- [ ] Add partner invitation flow (email/link)
- [ ] Implement real AI in retro-clerk edge function
- [ ] Add error monitoring (Sentry)

### P1 - High
- [ ] Message history view (sent/received)
- [ ] Push notifications (partner submitted, retro ready)
- [ ] Reef creation wizard for new couples

### P2 - Medium
- [ ] Offline support (PWA service worker)
- [ ] Pattern tracking across sessions
- [ ] Weekly summary emails

### P3 - Nice to Have
- [ ] Voice input with transcription
- [ ] Emotion trends visualization
- [ ] Multiple language support

---

## Technical Debt

- [ ] Add unit tests (Vitest)
- [ ] Add E2E tests (Playwright)
- [ ] Regenerate Supabase types after schema changes
- [ ] Clean up console.log debug statements

---

## Architecture Notes

**Raw Fetch API**: Using `supabaseApi.ts` instead of Supabase client due to AbortError issues with network proxies.

**Edge Functions**: Deployed with `--no-verify-jwt` for simplicity. Add request validation if scaling.
