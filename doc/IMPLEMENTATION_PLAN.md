# The Reef - Roadmap

## Current Status: MVP Complete ✅ + Testing Infrastructure ✅

Core features implemented:
- Authentication (Supabase Auth)
- The Bridge (Seal NVC transformation with Claude AI)
- The Retro (Octi retrospective with blind submission)
- Deployed on Netlify
- **NEW**: Unit testing with Vitest (29 tests passing)
- **NEW**: Autologin feature for testing
- **NEW**: E2E testing with Playwright (4 tests passing)

---

## Next Steps (Priority Order)

### P0 - Critical
- [ ] Add partner invitation flow (email/link)
- [ ] Implement real AI in retro-clerk edge function
- [ ] Add error monitoring (Sentry)

### P1 - High
- [x] E2E tests with Playwright ✅
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

- [x] Add unit tests (Vitest) ✅ 29 tests
- [x] Add E2E tests (Playwright) ✅ 4 tests
- [ ] Regenerate Supabase types after schema changes
- [x] Clean up console.log debug statements (partial)

---

## Architecture Notes

**Raw Fetch API**: Using `supabaseApi.ts` instead of Supabase client due to AbortError issues with network proxies.

**Edge Functions**: Deployed with `--no-verify-jwt` for simplicity. Add request validation if scaling.

**MCP Supabase**: Use `mcp_supabase-mcp-server_execute_sql` for direct database operations.
