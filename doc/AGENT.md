# THE REEF - LLM Agent Context File

> **PURPOSE**: High-density context for LLM agents. NOT for human consumption.
> **LAST_UPDATED**: 2026-02-04
> **VERSION**: 1.0.0

---

## PROJECT_VISION

```yaml
name: "The Reef"
type: Relationship Wellness PWA
tagline: "Communicate. Reflect. Grow Together."
target_users: Couples seeking improved communication
core_concept: AI-powered communication tools with mascot personalities
mascots:
  seal: "Seal" - Bridge feature - real-time NVC transformation
  octopus: "Octi" - Retro feature - retrospective analysis
deployment: Netlify (frontend) + Supabase (backend/edge)
```

---

## TECH_STACK

```yaml
runtime:
  node: ">=20.0.0"
  package_manager: npm

frontend:
  framework: React 19.2.0
  bundler: Vite 7.3.1
  router: react-router-dom 7.13.0
  icons: lucide-react 0.563.0
  styling: Vanilla CSS (CSS Variables)
  language: TypeScript 5.x (strict mode)

backend:
  provider: Supabase
  client: "@supabase/supabase-js" 2.94.0
  auth: Supabase Auth (Email/Password, Google OAuth)
  database: PostgreSQL (via Supabase)
  edge_functions: Deno runtime
  ai_provider: Anthropic Claude 3 Haiku

deployment:
  frontend: Netlify
  backend: Supabase Cloud
  edge_functions: Supabase Edge Functions
```

---

## FILE_TREE

```
the-reef/
├── src/
│   ├── App.tsx                          # Root router setup
│   ├── main.tsx                         # React entry point
│   ├── index.css                        # Global CSS variables + base styles
│   │
│   ├── app/                             # Application shell
│   │   ├── Layout.tsx                   # Main layout with nav, header
│   │   ├── pages/
│   │   │   └── HomePage.tsx             # Landing/dashboard page
│   │   └── routes/
│   │       └── ProtectedRoute.tsx       # Auth guard, reef_id check
│   │
│   ├── features/                        # Feature modules (domain-driven)
│   │   ├── auth/                        # Authentication feature
│   │   │   ├── index.ts                 # Public exports
│   │   │   ├── AuthContext.tsx          # Auth state provider
│   │   │   └── LoginPage.tsx            # Login/signup UI
│   │   │
│   │   ├── bridge/                      # "The Bridge" - Seal NVC feature
│   │   │   ├── index.ts                 # Public exports
│   │   │   ├── types.ts                 # Emotion, AIAnalysis types
│   │   │   ├── pages/
│   │   │   │   └── BridgePage.tsx       # Multi-step wizard container
│   │   │   ├── components/
│   │   │   │   ├── EmotionSelector.tsx  # Step 1: emotion picker
│   │   │   │   ├── InputGuard.tsx       # Step 2: text input
│   │   │   │   ├── NvcTransform.tsx     # Step 3: AI transformation
│   │   │   │   └── MessageDelivery.tsx  # Step 4: send to partner
│   │   │   └── utils/
│   │   │       └── aiService.ts         # Edge function calls, mock fallback
│   │   │
│   │   └── retro/                       # "The Retro" - Octi retrospective
│   │       ├── index.ts                 # Public exports
│   │       ├── types.ts                 # Retro, RetroSubmission types
│   │       ├── pages/
│   │       │   └── RetroPage.tsx        # Route handler, list view
│   │       ├── components/
│   │       │   ├── CreateRetro.tsx      # Create new retrospective
│   │       │   ├── BlindSubmission.tsx  # Individual perspective entry
│   │       │   └── RevealView.tsx       # AI analysis display
│   │       └── utils/
│   │           └── aiService.ts         # Edge function calls, mock fallback
│   │
│   └── shared/                          # Shared utilities
│       ├── components/
│       │   ├── index.ts                 # Barrel export
│       │   ├── Button.tsx               # Primary button component
│       │   ├── Card.tsx                 # Glass-morphism card
│       │   └── Input.tsx                # Input + Textarea components
│       ├── lib/
│       │   ├── supabase.ts              # Supabase client singleton
│       │   └── supabaseApi.ts           # Raw fetch API helpers
│       └── types/
│           └── database.ts              # Generated Supabase types
│
├── supabase/
│   ├── config.toml                      # Local Supabase config
│   ├── migrations/
│   │   └── 001_initial_schema.sql       # Database schema
│   └── functions/
│       ├── bridge-ai/
│       │   └── index.ts                 # NVC transformation edge fn
│       └── retro-clerk/
│           └── index.ts                 # Retrospective analysis edge fn
│
├── doc/                                 # Documentation (this folder)
├── netlify.toml                         # Netlify deployment config
├── tsconfig.app.json                    # TypeScript config
├── vite.config.ts                       # Vite bundler config
└── package.json                         # Dependencies
```

---

## DATABASE_SCHEMA

```sql
-- Core tables
profiles (id UUID PK, display_name, avatar_url, reef_id FK, role)
reefs (id UUID PK, name, created_at)
system_prompts (id UUID PK, key UNIQUE, prompt_text, version)

-- Bridge feature
bridge_messages (id UUID PK, reef_id FK, sender_id FK, recipient_id FK,
                 emotion, original_text, transformed_text, ai_analysis JSONB)

-- Retro feature
retros (id UUID PK, reef_id FK, title, event_date, status, ai_summary JSONB)
retro_submissions (id UUID PK, retro_id FK, author_id FK, raw_narrative,
                   ai_analysis JSONB, future_script, submitted_at)
```

---

## CODING_STANDARDS

### TypeScript Patterns

```typescript
// RULE: Use snake_case for DB types (raw fetch returns snake_case)
interface Retro {
    id: string
    reef_id: string      // NOT reefId
    created_at: Date     // NOT createdAt
}

// RULE: Use accessToken from useAuth() for all API calls
const { profile, accessToken } = useAuth()

// RULE: Guard all async functions with token check
async function fetchData() {
    if (!accessToken || !profile?.id) return
    // ...
}

// RULE: Use supabaseApi.ts helpers, NOT supabase client directly
import { fetchRows, insertRow, updateRow } from '../../../shared/lib/supabaseApi'
// DO NOT: import { supabase } from '../../../shared/lib/supabase'
```

### Component Patterns

```typescript
// RULE: Feature components receive accessToken via useAuth()
export function MyComponent() {
    const { profile, accessToken } = useAuth()
    
    useEffect(() => {
        if (accessToken && profile?.id) {
            fetchData()
        }
    }, [accessToken, profile?.id])
}

// RULE: Use CSS variables for theming
className="bg-[var(--color-surface)] text-[var(--color-text)]"
```

### Error Handling

```typescript
// RULE: Wrap API calls in try/catch with user-friendly errors
try {
    const { data, error } = await insertRow('table', accessToken, payload)
    if (error) throw error
} catch (err) {
    console.error(err)
    setError('Failed to save. Please try again.')
}

// RULE: Edge functions use mock fallback when unavailable
try {
    const response = await fetch(edgeFunctionUrl, {...})
    if (!response.ok) throw new Error('Edge function failed')
    return await response.json()
} catch {
    console.warn('Using mock fallback')
    return generateMockResponse()
}
```

---

## API_HELPERS

### supabaseApi.ts Functions

```typescript
fetchRows<T>(table, accessToken, filters?)     // GET multiple rows
fetchSingleRow<T>(table, accessToken, filters) // GET single row (406 if none)
insertRow<T>(table, accessToken, data)         // POST new row
updateRow<T>(table, accessToken, filters, data) // PATCH existing row
deleteRow(table, accessToken, filters)         // DELETE row

// Filter syntax: PostgREST format
// Example: `&reef_id=eq.${id}&status=eq.pending&order=created_at.desc`
```

---

## EDGE_FUNCTIONS

### Deployment Commands

```bash
npx supabase functions deploy bridge-ai --no-verify-jwt
npx supabase functions deploy retro-clerk --no-verify-jwt
npx supabase secrets set ANTHROPIC_API_KEY=<key>
```

### Required Headers (calling from frontend)

```typescript
headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`,
    'apikey': anonKey,
}
```

---

## ENVIRONMENT_VARIABLES

```env
# Frontend (.env)
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_AI_USE_MOCK=true            # Optional: force AI mock responses (defaults to DEV)
VITE_ENABLE_AUTOLOGIN=true       # Optional: allow ?autologin=... in dev
VITE_LOG_LEVEL=debug             # Optional: debug|info|warn|error|silent

# Edge Functions (Supabase Secrets)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## KNOWN_ISSUES

1. **AbortError with Supabase Client**: Network interference (Zscaler/corporate proxies) causes AbortError. SOLUTION: Use raw fetch via `supabaseApi.ts`.

2. **TypeScript `never` type inference**: Auto-generated Supabase types sometimes infer `never`. SOLUTION: Use type assertions or raw fetch.

3. **Edge Function 401**: JWT verification enabled by default. SOLUTION: Deploy with `--no-verify-jwt`.

---

## FEATURE_FLAGS

```yaml
bridge_ai_enabled: true   # Use real Claude API for Bridge
retro_ai_enabled: false   # Currently using mock for Retro analysis
```

---

## COMMANDS

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build to dist/
npm run lint         # ESLint check
npm run test         # Run unit tests (Vitest)
npx playwright test  # Run E2E tests (Playwright)
npx supabase start   # Local Supabase (requires Docker)
npx supabase db push # Push migrations to cloud
```

---

## MCP_SUPABASE

LLM agents can use Supabase MCP server for direct database operations:

```yaml
# Available MCP tools:
mcp_supabase-mcp-server_list_projects    # List all projects
mcp_supabase-mcp-server_list_tables      # Get schema info
mcp_supabase-mcp-server_execute_sql      # Run any SQL query

# Example: Query profiles
project_id: sisrlbxaijnfrrvfjhli
query: "SELECT * FROM profiles"

# Example: Insert data
query: "INSERT INTO profiles (id, display_name, reef_id) VALUES (...)"
```

**Project Reference**: `sisrlbxaijnfrrvfjhli`

---

## TESTING

### Autologin Feature

Use URL parameter for quick login during testing:

```
http://localhost:5173?autologin=email/password
http://localhost:5173/retro?autologin=alex28786@gmail.com/Doffel&6128
http://localhost:5173/retro?autologin=tiff@tiff.de/tifftiff
```

**Test Users**:
| Email | Password | Role |
|-------|----------|------|
| alex28786@gmail.com | Doffel&6128 | husband |
| tiff@tiff.de | tifftiff | wife |
