# 🚩 Feature Flag Service — LaunchDarkly Clone
## Comprehensive Project Plan

---

## 1. Vision & Goals

Build a **production-grade, self-hosted feature flag platform** — a full LaunchDarkly clone that supports:
- Real-time feature flag management with a polished dashboard
- SDK-based flag evaluation with streaming updates
- Targeting rules, segments, percentage rollouts, and prerequisites
- Multi-environment support (dev/staging/production)
- Audit logging, analytics, and experimentation (A/B testing)
- A test application that proves all features work end-to-end

**Educational angle:** Every concept (feature flags, canary releases, blue-green deployments, sticky bucketing, etc.) gets tooltips and a Learn page — teaching beginners WHY feature flags matter, not just how to use them.

---

## 2. Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Language** | TypeScript (strict mode) everywhere | Type safety, shared types between frontend/backend/SDK |
| **Frontend** | React 18 + Vite + Tailwind CSS | Fast dev, great DX, consistent with our other projects |
| **Backend API** | Node.js + Express | Simple, well-known, great for real-time (SSE) |
| **Database** | PostgreSQL (via Prisma ORM) | Production-grade, supports JSONB for flag configs, transactions for audit log |
| **Real-time** | Server-Sent Events (SSE) | Simpler than WebSockets, one-directional (server→client) which is all we need for flag updates. This is how LaunchDarkly does it. |
| **Caching** | In-memory LRU cache (server-side) | Fast flag evaluation, no Redis dependency |
| **Auth** | JWT tokens (dashboard) + SDK keys (API) | Dashboard users get JWT; applications get SDK keys per environment |
| **Testing** | Vitest (unit) + Supertest (API) + Playwright (E2E) | Full coverage pyramid |
| **Containerization** | Docker + Docker Compose | One command to run everything (API + DB + test app) |
| **Monorepo** | Turborepo or npm workspaces | Shared types between packages |

### Package Structure
```
feature-flag-service/
├── packages/
│   ├── shared/              # Shared TypeScript types & utilities
│   │   └── src/
│   │       ├── types/       # Flag, Rule, Segment, Context types
│   │       ├── evaluation/  # Flag evaluation engine (shared between server & SDK)
│   │       └── hashing/     # Consistent hashing for percentage rollouts
│   ├── server/              # Backend API
│   │   └── src/
│   │       ├── routes/      # REST API routes
│   │       ├── services/    # Business logic
│   │       ├── middleware/  # Auth, validation, rate limiting
│   │       ├── sse/         # SSE streaming manager
│   │       ├── prisma/      # Database schema & migrations
│   │       └── workers/     # Background jobs (analytics aggregation, scheduled flags)
│   ├── dashboard/           # React frontend
│   │   └── src/
│   │       ├── components/  # UI components
│   │       ├── pages/       # Route pages
│   │       ├── hooks/       # Custom hooks
│   │       ├── stores/      # State management (Zustand)
│   │       └── api/         # API client
│   ├── sdk-js/              # JavaScript/TypeScript client SDK
│   │   └── src/
│   │       ├── client.ts    # Main SDK client
│   │       ├── stream.ts    # SSE connection manager
│   │       ├── store.ts     # Local flag store
│   │       └── evaluator.ts # Client-side evaluation
│   └── sdk-react/           # React SDK (hooks wrapper)
│       └── src/
│           ├── provider.tsx  # FlagProvider context
│           ├── hooks.ts     # useFlag, useFlags, useFlagWithReason
│           └── components.tsx # FeatureFlag component
├── test-app/                # Demo app that uses the SDK
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## 3. Core Concepts & Architecture

### 3.1 How It Works (The Full Flow)

```
Developer toggles flag in Dashboard
        │
        ▼
  Dashboard ──POST──▶ API Server ──writes──▶ PostgreSQL
                          │
                          │ broadcasts change via SSE
                          ▼
              ┌─────────────────────────┐
              │   SSE Stream Manager    │
              │  (per-environment fans) │
              └────────┬────────────────┘
                       │
           ┌───────────┼───────────────┐
           ▼           ▼               ▼
       SDK Client  SDK Client     SDK Client
       (App 1)    (App 2)        (App 3)
           │           │               │
           ▼           ▼               ▼
     Local flag    Local flag     Local flag
     store updated store updated  store updated
           │           │               │
           ▼           ▼               ▼
     App evaluates App evaluates  App evaluates
     flags locally flags locally  flags locally
```

### 3.2 Key Architectural Decisions

1. **Local evaluation (not server-side):** Like LaunchDarkly, the SDK downloads all flag definitions and evaluates locally. This means:
   - Zero latency for flag checks (no network round-trip)
   - Works offline (falls back to last known values)
   - SDK must understand targeting rules and evaluate them

2. **SSE for streaming (not WebSockets):** LaunchDarkly uses SSE because:
   - Flag updates are one-directional (server → client)
   - SSE auto-reconnects (built into browsers/EventSource)
   - Simpler infrastructure (no WS upgrade handshake)
   - Falls back to polling if SSE isn't supported

3. **Consistent hashing for percentage rollouts:** When you say "enable for 30% of users," the same user must ALWAYS get the same result (sticky bucketing). We use a hash of `(flagKey + contextKey)` to deterministically bucket users. No randomness.

4. **Contexts, not just Users:** LaunchDarkly moved from "users" to "contexts" — a context can be a user, a device, an organization, a server, etc. Each has attributes. Our system supports multi-context evaluation.

5. **SDK keys per environment:** Each environment gets a unique SDK key. The SDK connects with this key and only receives flags for that environment.

6. **Prerequisites:** Flag A can depend on Flag B. If B is off, A is automatically off regardless of its own targeting. Creates a DAG (directed acyclic graph) of flags.

---

## 4. Feature Breakdown (Detailed)

### 4.1 Flag Management (Dashboard)

| Feature | Description | Priority |
|---------|-------------|----------|
| Create flag | Name, key (auto-generated from name), description, type selection, tags | P0 |
| Flag types | Boolean, String, Number, JSON — each with multiple variations | P0 |
| Variations | Each flag has 2+ variations (not just on/off). Boolean: true/false. String: "control"/"variant-a"/"variant-b" | P0 |
| Toggle on/off | Master kill switch per environment. Off = serve default variation | P0 |
| Environments | dev, staging, production (configurable). Each flag has independent config per env | P0 |
| Flag list | Searchable, filterable (by tag, env, status, type), sortable, paginated | P0 |
| Tags | Organize flags with tags ("checkout", "mobile", "experiment") | P1 |
| Archive/delete | Soft-delete (archive) with option to permanently delete | P1 |
| Clone flag | Copy a flag's config from one environment to another | P2 |
| Flag lifecycle | Status: new → active → launched → deprecated → archived | P2 |

### 4.2 Targeting Rules

| Feature | Description | Priority |
|---------|-------------|----------|
| Individual targeting | Add specific context keys to receive a specific variation | P0 |
| Custom rules | If attribute [operator] value(s), serve variation. Multiple rules with priority ordering | P0 |
| Operators | equals, not equals, contains, starts with, ends with, in (list), matches (regex), greater than, less than, semver operators | P0 |
| Percentage rollout | Serve variation A to X%, variation B to Y% (per rule or as default) | P0 |
| Default rule | What to serve if no rules match and targeting is ON | P0 |
| Off variation | What to serve when targeting is OFF | P0 |
| Segments | Reusable groups of contexts (e.g., "beta-testers"). Reference segments in rules | P1 |
| Prerequisites | Flag A requires Flag B to serve variation X before A's targeting runs | P1 |
| Scheduling | Turn flag on/off at a scheduled time (cron-like) | P2 |
| Temporary flags | Auto-expire after a date | P2 |

### 4.3 Contexts

| Feature | Description | Priority |
|---------|-------------|----------|
| Context kinds | Define custom kinds: "user", "device", "organization", "server" | P0 |
| Context attributes | Built-in (key, name) + custom (any JSON). Used in targeting rules | P0 |
| Context browser | View contexts that have been evaluated, see which flags they received | P1 |
| Multi-context | A single evaluation can include multiple contexts (user + org + device) | P1 |

### 4.4 SDK (JavaScript/TypeScript + React)

| Feature | Description | Priority |
|---------|-------------|----------|
| `initialize(sdkKey, context)` | Connect to server, download flag data, start SSE stream | P0 |
| `variation(flagKey, defaultValue)` | Evaluate a flag for the current context. Returns the value | P0 |
| `variationDetail(flagKey, defaultValue)` | Returns value + reason (matched rule, target, fallthrough, off, error) | P0 |
| `allFlags()` | Get all flag values for the current context | P0 |
| `on('change', callback)` | Listen for any flag change | P0 |
| `on('change:flagKey', callback)` | Listen for specific flag change | P0 |
| `identify(newContext)` | Switch context (e.g., user logs in). Re-evaluates all flags | P0 |
| `flush()` | Send pending analytics events immediately | P1 |
| `close()` | Disconnect SSE, clean up | P0 |
| `waitForInitialization()` | Promise that resolves when SDK is ready | P0 |
| React: `<FlagProvider>` | Context provider wrapping the JS SDK | P0 |
| React: `useFlag(key, default)` | Hook returning current flag value. Re-renders on change | P0 |
| React: `useFlagWithDetail(key)` | Hook returning value + evaluation reason | P1 |
| React: `useFlags()` | Hook returning all flags | P1 |
| React: `<Feature flag="key">` | Render children only if flag is truthy | P1 |
| Offline mode | Use localStorage to persist last known flag values | P1 |
| Bootstrap | Pass initial flag values to avoid flicker (SSR) | P2 |

### 4.5 Audit Log

| Feature | Description | Priority |
|---------|-------------|----------|
| Every change logged | Who changed what, when, old value → new value | P0 |
| Change types | Created, updated targeting, toggled, archived, changed variations | P0 |
| Diff view | Show exact targeting rule changes (before/after) | P1 |
| Filter by flag, user, date range | Searchable audit trail | P1 |
| Export | CSV/JSON export of audit log | P2 |

### 4.6 Analytics & Experimentation

| Feature | Description | Priority |
|---------|-------------|----------|
| Evaluation count | Track how many times each flag is evaluated per time window | P1 |
| Unique contexts | Track unique contexts evaluating each flag | P1 |
| Variation breakdown | Pie chart: what % of evaluations returned each variation | P1 |
| Stale flag detection | Flags that haven't been evaluated in X days | P1 |
| A/B experiment | Define a metric event, track conversion by variation | P2 |
| Metric events | SDK sends custom events (`track('purchase', { amount: 50 })`) | P2 |
| Statistical significance | Chi-squared or Bayesian analysis on experiment results | P2 |

### 4.7 Projects & Access Control

| Feature | Description | Priority |
|---------|-------------|----------|
| Projects | Group flags by project (e.g., "Web App", "Mobile App") | P1 |
| Dashboard auth | Email/password + JWT. Simple but real | P0 |
| Roles | Owner, Admin, Writer, Reader | P2 |
| API keys | Per-project, per-environment SDK keys | P0 |
| Key rotation | Generate new SDK key, old one works for grace period | P2 |

### 4.8 API & Integrations

| Feature | Description | Priority |
|---------|-------------|----------|
| REST API | Full CRUD for flags, segments, environments, projects | P0 |
| SSE endpoint | `GET /stream?sdkKey=xxx` for real-time updates | P0 |
| Webhooks | POST to URL on flag change (configurable per flag/project) | P2 |
| Import/export | JSON export/import of all flags (for backup or migration) | P2 |
| OpenAPI spec | Auto-generated Swagger docs | P1 |

### 4.9 Dashboard UI Pages

1. **Login/Register** — simple auth
2. **Project Selector** — switch between projects
3. **Flag List** — main dashboard, search/filter/toggle
4. **Flag Detail** — variations, targeting rules builder, scheduling, prerequisites, audit log tab
5. **Targeting Rule Builder** — visual drag-and-drop rule creation with AND/OR logic
6. **Segments** — create/manage reusable audience segments
7. **Contexts** — browse evaluated contexts, see what they received
8. **Environments** — manage environments and their SDK keys
9. **Analytics** — charts: evaluations over time, variation breakdown, stale flags
10. **Experiments** — A/B test results, metric tracking
11. **Audit Log** — searchable history of all changes
12. **Settings** — project settings, API keys, webhooks
13. **Playground** — live flag evaluation tester (enter context JSON, see result)
14. **Learn** — educational content about feature flags

---

## 5. Data Model (Prisma Schema)

```prisma
model Project {
  id            String        @id @default(uuid())
  name          String
  key           String        @unique  // "web-app"
  description   String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  environments  Environment[]
  flags         Flag[]
  segments      Segment[]
}

model Environment {
  id          String   @id @default(uuid())
  name        String   // "Production"
  key         String   // "production"
  color       String   // "#4CAF50"
  sdkKey      String   @unique @default(uuid())  // client-side SDK key
  sdkKeyServer String  @unique @default(uuid())  // server-side SDK key
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  flagConfigs FlagEnvironmentConfig[]
  createdAt   DateTime @default(now())

  @@unique([projectId, key])
}

model Flag {
  id            String    @id @default(uuid())
  key           String    // "dark-mode"
  name          String    // "Dark Mode"
  description   String?
  type          FlagType  // BOOLEAN, STRING, NUMBER, JSON
  tags          String[]  // ["ui", "theme"]
  temporary     Boolean   @default(false)
  archived      Boolean   @default(false)
  projectId     String
  project       Project   @relation(fields: [projectId], references: [id])
  variations    Json      // Array of { id, value, name, description }
  environments  FlagEnvironmentConfig[]
  prerequisites FlagPrerequisite[]  @relation("dependent")
  dependents    FlagPrerequisite[]  @relation("prerequisite")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([projectId, key])
}

enum FlagType {
  BOOLEAN
  STRING
  NUMBER
  JSON
}

model FlagEnvironmentConfig {
  id              String      @id @default(uuid())
  flagId          String
  flag            Flag        @relation(fields: [flagId], references: [id])
  environmentId   String
  environment     Environment @relation(fields: [environmentId], references: [id])
  on              Boolean     @default(false)  // targeting on/off
  offVariationId  String?     // which variation to serve when OFF
  fallthrough     Json?       // default rule: { variationId } or { rollout: { variations: [{ id, weight }] } }
  targets         Json?       // individual targeting: [{ contextKind, variationId, values: ["user-123"] }]
  rules           Json?       // targeting rules: [{ id, clauses, variationId, rollout, ref }]
  version         Int         @default(1)
  updatedAt       DateTime    @updatedAt

  @@unique([flagId, environmentId])
}

model FlagPrerequisite {
  id              String @id @default(uuid())
  flagId          String
  flag            Flag   @relation("dependent", fields: [flagId], references: [id])
  prerequisiteId  String
  prerequisite    Flag   @relation("prerequisite", fields: [prerequisiteId], references: [id])
  variationId     String // prerequisite must serve this variation
}

model Segment {
  id          String   @id @default(uuid())
  key         String
  name        String
  description String?
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  rules       Json     // targeting rules that define segment membership
  included    String[] // explicitly included context keys
  excluded    String[] // explicitly excluded context keys
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([projectId, key])
}

model AuditLogEntry {
  id          String   @id @default(uuid())
  projectId   String
  flagKey     String?
  action      String   // "flag.created", "flag.targeting.updated", "flag.toggled"
  userId      String
  userName    String
  before      Json?    // state before change
  after       Json?    // state after change
  comment     String?
  createdAt   DateTime @default(now())

  @@index([projectId, createdAt])
  @@index([flagKey])
}

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String   // bcrypt hashed
  name        String
  role        Role     @default(WRITER)
  createdAt   DateTime @default(now())
}

enum Role {
  OWNER
  ADMIN
  WRITER
  READER
}

model AnalyticsEvent {
  id            String   @id @default(uuid())
  sdkKey        String
  flagKey       String
  variationId   String
  contextKey    String
  contextKind   String   @default("user")
  timestamp     DateTime @default(now())

  @@index([flagKey, timestamp])
  @@index([sdkKey, timestamp])
}
```

---

## 6. API Design (REST)

### Authentication
- Dashboard: `Authorization: Bearer <jwt>` (login returns JWT)
- SDK: `Authorization: <sdk-key>` (SDK key in header)

### Dashboard API

```
# Auth
POST   /api/auth/register         { email, password, name }
POST   /api/auth/login            { email, password } → { token, user }

# Projects
GET    /api/projects
POST   /api/projects              { name, key, description }
GET    /api/projects/:key
PUT    /api/projects/:key
DELETE /api/projects/:key

# Environments
GET    /api/projects/:key/environments
POST   /api/projects/:key/environments
PUT    /api/projects/:key/environments/:envKey
DELETE /api/projects/:key/environments/:envKey
POST   /api/projects/:key/environments/:envKey/rotate-key   # rotate SDK key

# Flags
GET    /api/projects/:key/flags                    # list (filterable, paginated)
POST   /api/projects/:key/flags                    # create
GET    /api/projects/:key/flags/:flagKey
PUT    /api/projects/:key/flags/:flagKey            # update metadata
DELETE /api/projects/:key/flags/:flagKey
PATCH  /api/projects/:key/flags/:flagKey/archive    # soft delete

# Flag Targeting (per environment)
GET    /api/projects/:key/flags/:flagKey/environments/:envKey
PATCH  /api/projects/:key/flags/:flagKey/environments/:envKey   # update targeting
POST   /api/projects/:key/flags/:flagKey/environments/:envKey/toggle  # quick on/off

# Segments
GET    /api/projects/:key/segments
POST   /api/projects/:key/segments
GET    /api/projects/:key/segments/:segmentKey
PUT    /api/projects/:key/segments/:segmentKey
DELETE /api/projects/:key/segments/:segmentKey

# Audit Log
GET    /api/projects/:key/audit-log    # ?flagKey=&userId=&from=&to=

# Analytics
GET    /api/projects/:key/analytics/evaluations    # ?flagKey=&period=7d
GET    /api/projects/:key/analytics/stale-flags
```

### SDK API

```
# Get all flag data for client (bulk download)
GET    /api/sdk/flags              # Header: Authorization: <sdk-key>
                                   # Query: ?context=<base64-json>

# SSE stream for real-time updates
GET    /api/sdk/stream             # Header: Authorization: <sdk-key>

# Send evaluation events (analytics)
POST   /api/sdk/events             # Array of evaluation events

# Send custom metric events (experiments)
POST   /api/sdk/track              # { key: "purchase", context, value, data }
```

---

## 7. Flag Evaluation Engine (Critical — Shared Code)

This is the **heart** of the system. Lives in `packages/shared/` and is used by both the server (for API evaluation) and the SDK (for local evaluation).

### Evaluation Algorithm
```typescript
function evaluate(flag: Flag, config: FlagEnvConfig, context: Context): EvaluationResult {
  // 1. Check if targeting is ON
  if (!config.on) {
    return { value: flag.variations[config.offVariationId], reason: 'OFF' };
  }

  // 2. Check prerequisites
  for (const prereq of flag.prerequisites) {
    const prereqResult = evaluate(prereq.flag, prereq.config, context);
    if (prereqResult.variationId !== prereq.variationId) {
      return { value: flag.variations[config.offVariationId], reason: 'PREREQUISITE_FAILED' };
    }
  }

  // 3. Check individual targets
  for (const target of config.targets) {
    if (target.contextKind === context.kind && target.values.includes(context.key)) {
      return { value: flag.variations[target.variationId], reason: 'TARGET_MATCH' };
    }
  }

  // 4. Evaluate rules in order
  for (const rule of config.rules) {
    if (matchesRule(rule, context)) {
      if (rule.rollout) {
        const variation = bucketContext(flag.key, rule.rollout, context);
        return { value: flag.variations[variation], reason: 'RULE_MATCH', ruleIndex };
      }
      return { value: flag.variations[rule.variationId], reason: 'RULE_MATCH', ruleIndex };
    }
  }

  // 5. Fallthrough (default rule)
  if (config.fallthrough.rollout) {
    const variation = bucketContext(flag.key, config.fallthrough.rollout, context);
    return { value: flag.variations[variation], reason: 'FALLTHROUGH' };
  }
  return { value: flag.variations[config.fallthrough.variationId], reason: 'FALLTHROUGH' };
}
```

### Consistent Hashing for Rollouts
```typescript
function bucketContext(flagKey: string, rollout: Rollout, context: Context): string {
  // Hash(flagKey + "." + context.key) → 0-100000
  const hash = sha256(`${flagKey}.${context.key}`);
  const bucket = parseInt(hash.substring(0, 8), 16) % 100000;

  // Walk through weighted variations
  let cumulative = 0;
  for (const wv of rollout.variations) {
    cumulative += wv.weight; // weight is 0-100000
    if (bucket < cumulative) return wv.variationId;
  }
  return rollout.variations[rollout.variations.length - 1].variationId;
}
```

**Why this matters:** The same user ALWAYS gets the same bucket. No randomness. If you change a 30% rollout to 35%, the original 30% keep their variation and 5% more get added. This is "sticky bucketing."

---

## 8. Important Things NOT to Forget

### Security
- [ ] SDK keys are NOT secrets (client-side readable) — but server-side SDK keys ARE secrets
- [ ] Rate limit SDK evaluation endpoints (prevent abuse)
- [ ] Rate limit dashboard API (prevent brute force on auth)
- [ ] Sanitize all user input (flag keys, targeting values)
- [ ] SDK key validation middleware (fast rejection of invalid keys)
- [ ] CORS configuration (dashboard and SDK domains)
- [ ] Don't expose server-side SDK key in client bundle

### Performance
- [ ] Flag data should be cached in-memory on the server (not DB query per evaluation)
- [ ] SSE connections need heartbeat pings to keep alive (every 15-30s)
- [ ] Batch analytics events on SDK side (send every 30s or 100 events, whichever first)
- [ ] Index database queries on flagKey, projectId, environmentId
- [ ] Flag evaluation must be O(rules * clauses), not O(n²)
- [ ] Gzip SSE payloads for large flag sets

### Reliability
- [ ] SDK must work offline (serve last known values from localStorage/memory)
- [ ] SDK must handle SSE disconnection gracefully (auto-reconnect with exponential backoff)
- [ ] `waitForInitialization()` with timeout — don't block app startup forever
- [ ] Default values in application code as ultimate fallback
- [ ] Circular prerequisite detection (DAG validation on save)
- [ ] Database migrations must be backward-compatible

### UX
- [ ] Flag key auto-generation from name (kebab-case)
- [ ] Confirmation dialog before toggling production flags
- [ ] Diff view in audit log (what exactly changed in targeting rules)
- [ ] Copy SDK code snippets from dashboard (install + usage)
- [ ] Visual percentage rollout slider
- [ ] Color-coded environments (green=prod, yellow=staging, blue=dev)
- [ ] Real-time SSE connection status indicator in dashboard
- [ ] Toast notifications when another user changes a flag you're viewing

### Testing
- [ ] The evaluation engine needs 100% test coverage (it's the most critical piece)
- [ ] Test percentage rollouts with statistical validation (1M iterations → should be within 0.5% of target)
- [ ] Test SSE reconnection under network failure
- [ ] Test prerequisite cycles are rejected
- [ ] Test all targeting rule operators with edge cases
- [ ] Load test: 10k concurrent SSE connections
- [ ] E2E test: toggle flag → SDK receives update within 1 second

---

## 9. Educational Content (Learn Page & Tooltips)

### Learn Page Topics
1. **What are Feature Flags?** — The problem they solve, history, why every company uses them
2. **Types of Feature Flags** — Release flags, Ops flags, Experiment flags, Permission flags
3. **Feature Flag Lifecycle** — Create → Roll out → Launch → Clean up (tech debt warning)
4. **Targeting & Segmentation** — Why not just on/off? Real-world targeting scenarios
5. **Percentage Rollouts & Canary Releases** — Gradual exposure, consistent hashing explained
6. **A/B Testing with Flags** — How experiments work, statistical significance
7. **Trunk-Based Development** — How flags enable deploying unfinished code
8. **Dark Launches** — Release to production without user exposure
9. **Kill Switches** — Emergency feature disabling without deployments
10. **Flag Debt** — The hidden cost of flags, when and how to clean up
11. **Architecture Patterns** — Client-side vs server-side evaluation, streaming vs polling

### Tooltip Terms (70+)
Feature Flag, Feature Toggle, Kill Switch, Canary Release, Blue-Green Deployment, Dark Launch, Trunk-Based Development, Percentage Rollout, Sticky Bucketing, Consistent Hashing, Targeting Rule, Context, Context Kind, Context Attribute, Segment, Audience, Variation, Boolean Flag, Multivariate Flag, Prerequisite Flag, Off Variation, Fallthrough, Default Rule, Individual Target, Rule Clause, Operator, Regex Match, Semantic Versioning, SDK, SDK Key, Client-Side SDK, Server-Side SDK, SSE (Server-Sent Events), Streaming, Polling, Long Polling, EventSource, Reconnection, Heartbeat Ping, Flag Evaluation, Evaluation Reason, Local Evaluation, Remote Evaluation, In-Memory Store, Flag Cache, Analytics Event, Custom Event, Metric, A/B Test, Experiment, Control Group, Treatment, Statistical Significance, Confidence Interval, Chi-Squared Test, Bayesian Analysis, Conversion Rate, Sample Size, Environment, Production, Staging, Development, JWT (JSON Web Token), Audit Log, Diff View, Webhook, API Key, CORS, Rate Limiting, Exponential Backoff, Graceful Degradation, Circuit Breaker, Tech Debt, Flag Lifecycle, Flag Archival, Flag Stale Detection, OpenAPI, Prisma ORM, Database Migration, Monorepo, DAG (Directed Acyclic Graph)

---

## 10. Test Application (Proof It Works)

A small but real **e-commerce demo app** that uses the SDK to demonstrate every feature:

### Test App: "FlagShop" 🏪
```
test-app/
├── src/
│   ├── App.tsx           # Main app with FlagProvider
│   ├── features/
│   │   ├── DarkMode.tsx         # Boolean flag: dark theme
│   │   ├── CheckoutFlow.tsx     # String flag: "v1" | "v2" | "v3"
│   │   ├── DiscountBanner.tsx   # Boolean flag: show promo banner
│   │   ├── PricingTier.tsx      # JSON flag: { currency, discount }
│   │   ├── SearchAlgorithm.tsx  # String flag: "basic" | "fuzzy" | "ai"
│   │   └── NewFeature.tsx       # Boolean flag with percentage rollout
│   ├── components/
│   │   ├── FlagDebugPanel.tsx   # Shows all flag values + reasons
│   │   ├── ContextSwitcher.tsx  # Switch between demo users
│   │   └── ConnectionStatus.tsx # SDK connection indicator
│   └── contexts.ts              # Pre-defined test contexts
├── package.json
└── README.md
```

### Test Scenarios (each validates a feature)
| # | Scenario | What It Tests |
|---|----------|---------------|
| 1 | Toggle dark mode on/off in dashboard → FlagShop theme changes in <1s | Basic boolean flag + SSE streaming |
| 2 | Set checkout flow to "v2" → FlagShop shows new checkout | String multivariate flag |
| 3 | Target "premium" segment → only premium users see discount banner | Segment targeting |
| 4 | 50% rollout of new search → same user always gets same result | Percentage rollout + sticky bucketing |
| 5 | Set prerequisite: discount requires dark-mode ON → toggle dark-mode off → discount disappears | Prerequisites |
| 6 | Add individual target user-123 → only that user sees feature | Individual targeting |
| 7 | Create rule: country = "IL" → Israeli users see localized pricing | Custom attribute targeting |
| 8 | Kill SDK connection → app continues working with cached values | Offline resilience |
| 9 | Switch context (user logs in) → flags re-evaluate | Context switching (identify) |
| 10 | Toggle flag → check audit log shows correct diff | Audit logging |
| 11 | View analytics → evaluation counts match actual usage | Analytics pipeline |
| 12 | Schedule flag for +5min → flag auto-enables at scheduled time | Scheduled changes |

---

## 11. Agent Plan (Parallel Build Strategy)

### Agent Architecture

```
                    ┌──────────────────────┐
                    │   🎯 ORCHESTRATOR    │
                    │   (Agent 0)          │
                    │   Verifies everything│
                    │   Final integration  │
                    │   Deploy decision    │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
    ┌─────▼─────┐       ┌─────▼─────┐        ┌─────▼─────┐
    │  LAYER 1  │       │  LAYER 2  │        │  LAYER 3  │
    │  Backend  │       │ Dashboard │        │  SDK +    │
    │  + DB     │       │  Frontend │        │  Test App │
    └─────┬─────┘       └─────┬─────┘        └─────┬─────┘
          │                   │                     │
     ┌────┼────┐         ┌────┼────┐          ┌────┼────┐
     ▼    ▼    ▼         ▼    ▼    ▼          ▼    ▼    ▼
    A1   A2   A3        A4   A5   A6         A7   A8   A9
```

### Agent 0: 🎯 Orchestrator (runs LAST)
**Role:** Final integration, verification, deployment
- Merge all packages into working monorepo
- Run full test suite (unit + integration + E2E)
- Verify test app works end-to-end with all 12 scenarios
- Fix any cross-package type mismatches
- Build production Docker images
- Deploy to GitHub Pages (dashboard) or provide docker-compose up
- **Only this agent decides if it's ready to ship**

---

### Layer 1: Backend + Database (3 agents)

#### Agent 1: 🗄️ Database + Core API
**Builds:** `packages/server/` core, Prisma schema, migrations, auth
**Files:**
- `packages/shared/src/types/` — all TypeScript types
- `packages/server/src/prisma/schema.prisma` + migrations
- `packages/server/src/routes/auth.ts` — register, login, JWT
- `packages/server/src/routes/projects.ts` — CRUD
- `packages/server/src/routes/environments.ts` — CRUD + key rotation
- `packages/server/src/routes/flags.ts` — CRUD, archive, toggle
- `packages/server/src/middleware/auth.ts` — JWT verification
- `packages/server/src/middleware/validation.ts` — Zod schemas
- `packages/server/src/services/audit.ts` — audit log service
- `packages/server/src/index.ts` — Express app setup
- `packages/server/package.json`, `tsconfig.json`
- `docker-compose.yml` (PostgreSQL)

**Verifier for Agent 1:** ✅
- All API endpoints return correct status codes
- Auth middleware blocks unauthorized requests
- Prisma migrations run clean
- Audit log entries are created on every mutation
- Run: `npm test` (Vitest + Supertest)

#### Agent 2: 🎯 Targeting + Evaluation Engine
**Builds:** `packages/shared/` evaluation engine, targeting rules, segments
**Files:**
- `packages/shared/src/evaluation/evaluator.ts` — main evaluation function
- `packages/shared/src/evaluation/rules.ts` — rule matching (all operators)
- `packages/shared/src/evaluation/rollout.ts` — consistent hashing + bucketing
- `packages/shared/src/evaluation/prerequisites.ts` — DAG resolution
- `packages/shared/src/evaluation/segments.ts` — segment membership check
- `packages/shared/src/hashing/murmurHash.ts` — MurmurHash3 for bucketing
- `packages/shared/src/types/evaluation.ts` — EvaluationResult, Reason types
- `packages/server/src/routes/targeting.ts` — targeting CRUD endpoints
- `packages/server/src/routes/segments.ts` — segment CRUD endpoints
- `packages/server/src/services/flagStore.ts` — in-memory flag cache
- Tests: `packages/shared/src/evaluation/__tests__/` (comprehensive)

**Verifier for Agent 2:** ✅
- Evaluation engine handles all operator types correctly
- Percentage rollouts are statistically accurate (±0.5% over 100k iterations)
- Prerequisites detect circular dependencies
- Segment rules evaluate correctly
- Edge cases: empty rules, null attributes, missing contexts
- Run: `npm test` with 100% coverage on evaluation/

#### Agent 3: 📡 SSE Streaming + Analytics
**Builds:** Real-time streaming, SDK API endpoints, analytics pipeline
**Files:**
- `packages/server/src/sse/manager.ts` — SSE connection manager (per-env channels)
- `packages/server/src/sse/heartbeat.ts` — keep-alive ping every 15s
- `packages/server/src/routes/sdk.ts` — SDK endpoints (flags, stream, events, track)
- `packages/server/src/middleware/sdkAuth.ts` — SDK key validation
- `packages/server/src/services/analytics.ts` — event ingestion + aggregation
- `packages/server/src/services/scheduler.ts` — scheduled flag changes (cron)
- `packages/server/src/workers/analyticsAggregator.ts` — background aggregation
- Tests: SSE connection, reconnection, event delivery

**Verifier for Agent 3:** ✅
- SSE delivers flag changes within 500ms
- Heartbeat pings every 15s keep connections alive
- Analytics events are correctly stored and aggregated
- Multiple concurrent SSE connections handled
- Graceful cleanup on client disconnect
- Run: `npm test` + manual SSE connection test

---

### Layer 2: Dashboard Frontend (3 agents)

#### Agent 4: 🎨 Dashboard Shell + Flag Management Pages
**Builds:** Dashboard app shell, routing, flag list, flag detail
**Files:**
- `packages/dashboard/` — Vite + React + Tailwind setup
- `packages/dashboard/src/App.tsx` — routing (React Router)
- `packages/dashboard/src/components/Layout.tsx` — sidebar, topbar, env selector
- `packages/dashboard/src/pages/Login.tsx` + `Register.tsx`
- `packages/dashboard/src/pages/FlagList.tsx` — search, filter, toggle switches
- `packages/dashboard/src/pages/FlagDetail.tsx` — tabs: Targeting, Variations, Activity, Settings
- `packages/dashboard/src/components/FlagCard.tsx` — flag list item
- `packages/dashboard/src/components/EnvironmentBadge.tsx`
- `packages/dashboard/src/components/ConfirmDialog.tsx` — production toggle confirmation
- `packages/dashboard/src/stores/authStore.ts` — Zustand auth state
- `packages/dashboard/src/stores/flagStore.ts` — Zustand flag state
- `packages/dashboard/src/api/client.ts` — axios API client with JWT interceptor

**Verifier for Agent 4:** ✅
- All pages render without errors
- Navigation works (login → project → flags → detail)
- Flag toggle sends correct API call
- Environment selector filters correctly
- Responsive layout (mobile + desktop)
- Run: `npm run build` (no errors) + visual check

#### Agent 5: 🧩 Targeting Rule Builder + Segments UI
**Builds:** Visual rule builder, segment management, rollout slider
**Files:**
- `packages/dashboard/src/components/targeting/RuleBuilder.tsx` — drag-and-drop rules
- `packages/dashboard/src/components/targeting/ClauseEditor.tsx` — attribute/operator/value row
- `packages/dashboard/src/components/targeting/RolloutSlider.tsx` — percentage slider (multi-variation)
- `packages/dashboard/src/components/targeting/IndividualTargets.tsx` — add/remove target keys
- `packages/dashboard/src/components/targeting/PrerequisiteSelector.tsx`
- `packages/dashboard/src/components/targeting/SegmentPicker.tsx`
- `packages/dashboard/src/pages/Segments.tsx` — segment list + detail
- `packages/dashboard/src/pages/SegmentDetail.tsx`
- `packages/dashboard/src/components/targeting/VariationPicker.tsx` — dropdown for variation selection

**Verifier for Agent 5:** ✅
- Rules can be added, reordered, deleted
- All operators available in clause editor
- Rollout slider sums to 100%
- Segment picker shows available segments
- Prerequisite selector prevents self-reference
- Run: `npm run build` + visual check

#### Agent 6: 📊 Analytics, Audit Log, Settings, & Learn Page
**Builds:** Analytics charts, audit log viewer, settings, educational content
**Files:**
- `packages/dashboard/src/pages/Analytics.tsx` — evaluation charts (Recharts)
- `packages/dashboard/src/pages/AuditLog.tsx` — filterable activity feed
- `packages/dashboard/src/components/AuditDiff.tsx` — before/after diff view
- `packages/dashboard/src/pages/Settings.tsx` — SDK keys, environments, webhooks
- `packages/dashboard/src/pages/Playground.tsx` — live flag evaluation tester
- `packages/dashboard/src/pages/Learn.tsx` — educational content (11 topics)
- `packages/dashboard/src/components/Tooltip.tsx` — hover tooltips for all terms
- `packages/dashboard/src/data/tooltips.ts` — 70+ tooltip definitions
- `packages/dashboard/src/data/learnContent.ts` — learn page content

**Verifier for Agent 6:** ✅
- Charts render with mock data
- Audit log filters work (by flag, user, date)
- Diff view correctly highlights changes
- Playground evaluates flags in real-time
- All tooltips display correctly
- Learn page content is accurate and educational
- Run: `npm run build` + visual check

---

### Layer 3: SDK + Test App (3 agents)

#### Agent 7: 📦 JavaScript SDK (`sdk-js`)
**Builds:** Core JavaScript/TypeScript SDK
**Files:**
- `packages/sdk-js/src/client.ts` — main `FeatureFlagClient` class
- `packages/sdk-js/src/stream.ts` — SSE connection manager with reconnection
- `packages/sdk-js/src/store.ts` — in-memory flag store
- `packages/sdk-js/src/evaluator.ts` — imports evaluation engine from shared
- `packages/sdk-js/src/events.ts` — analytics event buffer + flush
- `packages/sdk-js/src/types.ts` — public SDK types
- `packages/sdk-js/src/utils/hash.ts` — browser-compatible hashing
- `packages/sdk-js/src/index.ts` — public API exports
- `packages/sdk-js/package.json` — bundled with tsup/rollup
- Tests: initialization, evaluation, streaming, offline, reconnection

**Verifier for Agent 7:** ✅
- SDK initializes and downloads flags
- `variation()` returns correct values for test contexts
- SSE updates trigger `on('change')` callbacks
- `identify()` re-evaluates all flags
- Offline mode: disconnected SDK returns cached values
- Event buffer flushes correctly
- Run: `npm test`

#### Agent 8: ⚛️ React SDK (`sdk-react`)
**Builds:** React wrapper around JS SDK
**Files:**
- `packages/sdk-react/src/provider.tsx` — `<FlagProvider sdkKey context>`
- `packages/sdk-react/src/hooks.ts` — `useFlag`, `useFlags`, `useFlagWithDetail`
- `packages/sdk-react/src/components.tsx` — `<Feature flag="key">`, `<AsyncFlagProvider>`
- `packages/sdk-react/src/context.ts` — React context for SDK client
- `packages/sdk-react/src/index.ts` — public exports
- `packages/sdk-react/package.json`
- Tests: hook rendering, re-renders on flag change, context switching

**Verifier for Agent 8:** ✅
- `<FlagProvider>` initializes SDK correctly
- `useFlag()` returns correct value and re-renders on change
- `<Feature>` conditionally renders children
- Context switching with `identify()` works
- Run: `npm test`

#### Agent 9: 🏪 Test App ("FlagShop")
**Builds:** E-commerce demo app using the React SDK
**Files:**
- `test-app/src/App.tsx` — FlagProvider + routing
- `test-app/src/features/` — 6 feature components (see Section 10)
- `test-app/src/components/FlagDebugPanel.tsx` — shows all flags + evaluation reasons
- `test-app/src/components/ContextSwitcher.tsx` — switch between test users
- `test-app/src/components/ConnectionStatus.tsx` — SSE status indicator
- `test-app/src/contexts.ts` — pre-defined test contexts (free user, premium, admin, IL user, etc.)
- `test-app/README.md` — setup instructions + test scenario walkthrough
- `test-app/package.json`

**Verifier for Agent 9:** ✅
- App renders with default flag values
- All 12 test scenarios pass (see Section 10)
- Debug panel shows correct flag values and reasons
- Context switching updates all flag-driven UI
- Connection status indicator works
- Run: manual verification of all 12 scenarios

---

## 12. Execution Order & Dependencies

```
Phase 1 (Parallel — no dependencies):
  ├── Agent 1: Database + Core API
  ├── Agent 2: Targeting + Evaluation Engine
  └── Agent 3: SSE + Analytics

Phase 2 (Parallel — depends on Phase 1 types):
  ├── Agent 4: Dashboard Shell + Flag Management
  ├── Agent 5: Targeting Rule Builder UI
  ├── Agent 6: Analytics + Audit + Learn
  ├── Agent 7: JavaScript SDK
  └── Agent 8: React SDK

Phase 3 (Depends on Phase 2):
  └── Agent 9: Test App (needs React SDK + working backend)

Phase 4 (Final):
  └── Agent 0: Orchestrator (integration, testing, deployment)
```

**Optimization:** Phases 1 and 2 can partially overlap since shared types from Agent 2 can be stubbed. But to be safe, run them sequentially.

**Total: 10 agents** (9 builders + 1 orchestrator)
Each builder agent has a built-in verification step at the end.

---

## 13. Complete TODO List

### Infrastructure Setup
- [ ] Initialize monorepo with npm workspaces or Turborepo
- [ ] Configure TypeScript project references across packages
- [ ] Set up Docker Compose (PostgreSQL + API server)
- [ ] Configure ESLint + Prettier across monorepo
- [ ] Set up Vitest for testing across packages
- [ ] Create shared tsconfig base

### packages/shared (Agents 1 + 2)
- [ ] Define all TypeScript types (Flag, Variation, Rule, Clause, Segment, Context, EvaluationResult)
- [ ] Implement MurmurHash3 (browser + Node compatible)
- [ ] Implement consistent hashing / bucketing function
- [ ] Implement rule clause matchers (all 12+ operators)
- [ ] Implement segment membership evaluation
- [ ] Implement prerequisite resolution (with cycle detection)
- [ ] Implement main `evaluate()` function
- [ ] Write comprehensive tests (targeting: 50+ test cases, rollout: statistical validation)
- [ ] Export clean public API

### packages/server (Agents 1 + 3)
- [ ] Set up Express + TypeScript
- [ ] Configure Prisma with PostgreSQL
- [ ] Write database schema + initial migration
- [ ] Seed script (default project + environments + sample flags)
- [ ] Auth routes: register, login (JWT)
- [ ] Auth middleware (JWT verification)
- [ ] Project CRUD routes
- [ ] Environment CRUD routes + SDK key rotation
- [ ] Flag CRUD routes
- [ ] Flag targeting update routes (per environment)
- [ ] Flag toggle route (quick on/off)
- [ ] Segment CRUD routes
- [ ] Audit log service (auto-logs all mutations)
- [ ] Audit log query route (with filters)
- [ ] SDK auth middleware (SDK key → project + environment lookup)
- [ ] SDK flags endpoint (bulk download with context evaluation)
- [ ] SSE stream endpoint (per-environment channels)
- [ ] SSE heartbeat (15s ping)
- [ ] SSE broadcast on flag change
- [ ] Analytics event ingestion endpoint
- [ ] Analytics aggregation worker (background)
- [ ] Scheduled flag changes (cron check)
- [ ] In-memory flag cache (invalidated on change)
- [ ] Rate limiting middleware
- [ ] CORS configuration
- [ ] Error handling middleware
- [ ] Request validation (Zod)
- [ ] OpenAPI spec generation (optional P1)
- [ ] Write API tests (Supertest)

### packages/dashboard (Agents 4 + 5 + 6)
- [ ] Vite + React + Tailwind + React Router setup
- [ ] Zustand stores (auth, flags, environments, projects)
- [ ] API client (axios + JWT interceptor)
- [ ] Layout: sidebar, topbar, environment selector, project selector
- [ ] Login + Register pages
- [ ] Flag List page (search, filter by tag/status/type, sort, paginate)
- [ ] Flag Card component (toggle switch, type icon, tags, last updated)
- [ ] Flag Detail page with tabs
- [ ] Variations tab (add/remove/edit variations)
- [ ] Targeting tab
- [ ] Individual targets section
- [ ] Rule builder (add/remove/reorder rules)
- [ ] Clause editor (attribute dropdown, operator dropdown, value input)
- [ ] Rollout slider (multi-variation percentage with drag handles)
- [ ] Default rule editor
- [ ] Off variation selector
- [ ] Prerequisite selector
- [ ] Segment picker in rules
- [ ] Activity tab (audit log for this flag)
- [ ] Settings tab (archive, delete, metadata)
- [ ] Segment List page
- [ ] Segment Detail page (rules + included/excluded)
- [ ] Analytics page (Recharts: evaluations over time, variation pie chart, stale flags)
- [ ] Audit Log page (global, filterable)
- [ ] Diff view component (before/after JSON diff)
- [ ] Settings page (SDK keys display + copy, environment management)
- [ ] Playground page (context JSON input → evaluate → show result)
- [ ] Learn page (11 topics with interactive examples)
- [ ] Tooltip component + 70+ tooltip definitions
- [ ] Confirmation dialog for production toggles
- [ ] Toast notifications (flag changes by other users)
- [ ] Responsive design (mobile sidebar collapse)
- [ ] Dark mode support
- [ ] Copy-to-clipboard for SDK code snippets
- [ ] Environment color badges
- [ ] Loading states + error boundaries

### packages/sdk-js (Agent 7)
- [ ] `FeatureFlagClient` class
- [ ] `initialize(sdkKey, context, options)` method
- [ ] `variation(flagKey, defaultValue)` method
- [ ] `variationDetail(flagKey, defaultValue)` method
- [ ] `allFlags()` method
- [ ] `identify(newContext)` method
- [ ] `on(event, callback)` / `off(event, callback)`
- [ ] `flush()` — send buffered events
- [ ] `close()` — disconnect + cleanup
- [ ] `waitForInitialization()` — Promise
- [ ] SSE stream connection with auto-reconnect (exponential backoff)
- [ ] In-memory flag store
- [ ] Local evaluation using shared evaluation engine
- [ ] Event buffer (batch analytics events)
- [ ] Offline mode (localStorage persistence)
- [ ] Bootstrap support (initial flag values)
- [ ] TypeScript declarations
- [ ] Bundle with tsup (CJS + ESM)
- [ ] Write SDK tests

### packages/sdk-react (Agent 8)
- [ ] `FlagProvider` component
- [ ] `useFlag(key, defaultValue)` hook
- [ ] `useFlagWithDetail(key, defaultValue)` hook
- [ ] `useFlags()` hook
- [ ] `useFlagClient()` hook (raw client access)
- [ ] `<Feature flag="key" fallback={...}>` component
- [ ] `<AsyncFlagProvider>` (with loading state)
- [ ] Re-render optimization (only re-render on relevant flag changes)
- [ ] TypeScript declarations
- [ ] Write React testing library tests

### test-app (Agent 9)
- [ ] Vite + React setup with sdk-react
- [ ] FlagProvider initialization with test SDK key
- [ ] DarkMode feature (boolean flag)
- [ ] CheckoutFlow feature (string multivariate flag)
- [ ] DiscountBanner feature (segment-targeted boolean)
- [ ] PricingTier feature (JSON flag with country targeting)
- [ ] SearchAlgorithm feature (string flag with percentage rollout)
- [ ] NewFeature feature (boolean with rollout)
- [ ] FlagDebugPanel (shows all flags + reasons)
- [ ] ContextSwitcher (dropdown to switch test users)
- [ ] ConnectionStatus (SSE status indicator)
- [ ] Pre-defined test contexts (8+ users with different attributes)
- [ ] README with test scenario walkthrough

### Integration & Deployment (Agent 0)
- [ ] Wire all packages together (workspace dependencies)
- [ ] Ensure shared types compile across all packages
- [ ] Run full test suite (unit + integration)
- [ ] Run all 12 E2E test scenarios manually
- [ ] Fix any cross-package issues
- [ ] Production Docker build
- [ ] docker-compose.yml (API + DB + dashboard)
- [ ] GitHub repo creation + push
- [ ] README.md with full setup instructions
- [ ] Deploy dashboard to GitHub Pages (if static) or provide docker instructions

---

## 14. Ports

| Service | Port |
|---------|------|
| PostgreSQL | 5432 |
| API Server | 3020 |
| Dashboard (dev) | 5185 |
| Test App (dev) | 5186 |

---

## 15. Success Criteria

The project is **done** when:
1. ✅ Dashboard: can create a project, environment, and flag
2. ✅ Dashboard: can configure targeting rules with visual builder
3. ✅ Dashboard: can set percentage rollouts with slider
4. ✅ Dashboard: can manage segments
5. ✅ Dashboard: shows audit log with diffs
6. ✅ Dashboard: shows analytics charts
7. ✅ SDK: initializes and evaluates flags locally
8. ✅ SDK: receives real-time updates via SSE within 1 second
9. ✅ SDK: works offline with cached values
10. ✅ React SDK: `useFlag` hook works and re-renders on changes
11. ✅ Test App: all 12 test scenarios pass
12. ✅ Learn page: all 11 topics written with tooltips
13. ✅ All tests pass (unit + integration)
14. ✅ Docker Compose: `docker-compose up` starts everything
15. ✅ Educational: a beginner can understand what feature flags are from this project

---

*Plan created: 2026-02-14*
*Estimated build time: ~4-6 hours with parallel agents*
