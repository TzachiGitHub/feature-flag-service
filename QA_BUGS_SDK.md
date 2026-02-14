# QA Report: SDK & FlagShop Test App

**Date:** 2026-02-15  
**Tester:** QA Agent  
**Environment:** Production (https://ff-server-production.up.railway.app)  
**SDK Key:** 227046c7-d7dc-43e9-9b1c-de0f6d868abe

---

## 🔴 Critical Bugs

### BUG-SDK-001: FlagProvider Parses API Response Incorrectly — All Flags Broken
**Location:** `test-app/src/flags/FlagProvider.tsx` → `fetchFlags()`  
**Severity:** Critical  
**Description:** The `fetchFlags` function iterates over `data` directly, but the SDK API returns `{ flags: { ... }, env: "production" }`. The code should iterate `data.flags`, not `data`.

**Current code:**
```ts
for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
```

**What happens:** Instead of getting individual flags like `dark-mode`, `checkout-flow`, etc., the FlagProvider creates two entries:
- `flags["flags"]` = entire nested flags object (unusable)
- `flags["env"]` = `"production"` (garbage)

**Result:** `useFlag('dark-mode', false)` always returns the default value `false` because `dark-mode` is never stored as a top-level key. **Every flag in FlagShop falls back to its default.**

**Fix:**
```ts
const flagsData = data.flags || data;
for (const [key, val] of Object.entries(flagsData as Record<string, unknown>)) {
```

---

### BUG-SDK-002: FlagProvider SSE Has No Authentication — Connection Fails Silently
**Location:** `test-app/src/flags/FlagProvider.tsx` → `connectSSE()`  
**Severity:** Critical  
**Description:** The SSE connection is created with `new EventSource(url)`, which cannot set HTTP headers. The `Authorization` header is NOT included, and the SDK key is NOT passed as a query parameter either.

**Current code:**
```ts
const url = `/api/sdk/stream?context=${encodeContext(context)}`;
const es = new EventSource(url);
```

The server's `/api/sdk/stream` endpoint requires authentication via either `Authorization` header or `authorization` query parameter. Without it, the SSE connection is rejected (401), triggering `onerror` immediately.

**Result:** SSE never connects. The ConnectionStatus component will always show "Disconnected (polling)" or similar, but there's no polling fallback implemented either — so flags are never updated in real-time.

**Fix:** Pass SDK key as query parameter:
```ts
const url = `/api/sdk/stream?context=${encodeContext(context)}&authorization=${encodeURIComponent(sdkKey)}`;
```

Note: The `connectSSE` callback doesn't have `sdkKey` in its closure either — it needs to be added to the dependency or captured.

---

### BUG-SDK-003: SSE Stream Sends Raw Flag Definitions, Not Evaluated Values
**Location:** Server SSE `put` event + `test-app/src/flags/FlagProvider.tsx` SSE handler  
**Severity:** Critical  
**Description:** The SSE `put` event sends full flag definitions (with `variations`, `rules`, `targets`, `offVariationId`, etc.) rather than evaluated flag values. But the FlagProvider's SSE `put` handler expects the same format as the REST API's evaluated response (`{value, variationId, reason}`).

**SSE put data contains:**
```json
{ "dark-mode": { "key": "dark-mode", "type": "BOOLEAN", "on": true, "variations": [...], "rules": [...], ... } }
```

**FlagProvider expects:**
```json
{ "dark-mode": { "value": false, "variationId": "var-false", "reason": "FALLTHROUGH" } }
```

**Result:** When flags update via SSE, the raw definition objects are stored as flag values. `useFlag('dark-mode', false)` would get the entire flag config object instead of `true`/`false`. This could cause type errors and broken UI throughout.

**Note:** This may be a server-side issue — the SSE stream should send evaluated values for the client's context, not raw definitions.

---

### BUG-SDK-004: sdk-react LightweightClient Uses POST Instead of GET for Flag Fetching
**Location:** `packages/sdk-react/src/lightweight-client.ts` → `fetchFlags()`  
**Severity:** Critical  
**Description:** The LightweightClient sends a `POST` request with JSON body to `/api/sdk/flags`, but the SDK API endpoint expects a `GET` request with `context` as a base64-encoded query parameter.

**Current code:**
```ts
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': this.sdkKey },
  body: JSON.stringify({ context: this.context }),
});
```

**Expected:** The server route likely only handles GET (the sdk-js client uses GET with `?context=base64`). If the server doesn't handle POST, this returns 404/405 and flags are never loaded.

**Fix:** Use GET with base64-encoded context query param, matching sdk-js behavior.

---

### BUG-SDK-005: sdk-react LightweightClient SSE Uses Wrong Auth Parameter
**Location:** `packages/sdk-react/src/lightweight-client.ts` → `startSSE()`  
**Severity:** Critical  
**Description:** The SSE URL uses `?sdkKey=...` as the query parameter name, but the server expects `?authorization=...` (as used by sdk-js's SSEStream).

**Current code:**
```ts
const url = `${base}/api/sdk/stream?sdkKey=${encodeURIComponent(this.sdkKey)}`;
```

**sdk-js uses:**
```ts
const fullUrl = `${this.url}${separator}authorization=${encodeURIComponent(this.sdkKey)}`;
```

**Result:** SSE connection returns 401 Unauthorized. Falls back to polling (which also fails per BUG-SDK-004).

---

## 🟡 Medium Bugs

### BUG-SDK-006: FlagProvider SSE `connectSSE` Doesn't Capture `sdkKey` in Closure
**Location:** `test-app/src/flags/FlagProvider.tsx` → `connectSSE` useCallback  
**Severity:** Medium  
**Description:** The `connectSSE` callback has an empty dependency array `[]`, meaning it captures `sdkKey` from the initial render only. If `sdkKey` were to change (unlikely but possible), the SSE connection would use the stale key. More importantly, this is needed for BUG-SDK-002 fix.

---

### BUG-SDK-007: pricing-config Rule Uses "IL" but Test Context Uses "Israel"
**Location:** `test-app/src/contexts.ts` vs server targeting rules  
**Severity:** Medium  
**Description:** The pricing-config flag rule checks `country eq "IL"`, but the `israeliUser` context in `contexts.ts` initially had `country: "Israel"`. However, looking at the actual context file, it correctly uses `country: "IL"`. The earlier test with `{"country":"Israel"}` showed pricing-config falling through to USD — confirming the rule only matches the 2-letter code `"IL"`.

**Note:** The test app contexts are correctly configured with `"IL"`. This is just a documentation note — anyone manually testing with "Israel" instead of "IL" will not see the ILS pricing.

---

### BUG-SDK-008: sdk-react LightweightClient SSE Listens for Wrong Event Name
**Location:** `packages/sdk-react/src/lightweight-client.ts` → `startSSE()`  
**Severity:** Medium  
**Description:** The LightweightClient listens for SSE event named `flags`, but the server sends events named `put` and `patch`.

**Current code:**
```ts
this.eventSource.addEventListener('flags', (e: MessageEvent) => {
```

**Server sends:** `event: put` and `event: patch`

**Result:** Even if SSE connected successfully, no flag updates would ever be received. Combined with BUG-SDK-005, this is doubly broken.

---

### BUG-SDK-009: sdk-js EventManager flushBeacon Doesn't Include Auth Header
**Location:** `packages/sdk-js/src/events.ts` → `flushBeacon()`  
**Severity:** Medium  
**Description:** The `sendBeacon` call doesn't include the SDK key in the body or URL. The server won't be able to authenticate the request.

```ts
navigator.sendBeacon(
  `${this.baseUrl}/api/sdk/events`,
  JSON.stringify({ events })  // no auth!
);
```

`sendBeacon` doesn't support custom headers. The SDK key should be included in the request body or as a query param.

---

### BUG-SDK-010: FlagProvider SSE Error Handler Doesn't Reconnect
**Location:** `test-app/src/flags/FlagProvider.tsx` → `es.onerror`  
**Severity:** Medium  
**Description:** When SSE encounters an error, the handler sets `connected=false` and `connectionType='polling'`, but **never starts actual polling** and **never attempts to reconnect** SSE. The flag values become stale forever after first disconnect.

The sdk-js `SSEStream` correctly implements exponential backoff reconnection. The test app's custom FlagProvider does not.

---

## 🟢 Minor Issues

### BUG-SDK-011: FlagDebugPanel Doesn't Truncate Long JSON Values
**Location:** `test-app/src/components/FlagDebugPanel.tsx`  
**Severity:** Minor (UX)  
**Description:** The user reported not being able to see full JSON in the debug panel. Looking at the code, JSON values are displayed with `JSON.stringify(detail.value)` — which actually shows the **full** JSON without any truncation. However, for complex JSON configs (like `pricing-config`), the value is shown inline in a table cell without word-wrapping, so it may overflow or be cut off by the table layout.

**Suggestion:** Add `max-w-xs break-all` or a tooltip/expand feature for long JSON values.

---

### BUG-SDK-012: FlagProvider Has No Retry Logic on Initial Fetch Failure
**Location:** `test-app/src/flags/FlagProvider.tsx` → `fetchFlags()`  
**Severity:** Minor  
**Description:** If the initial fetch fails, the error is silently caught and `ready` is set to `true` with empty flags. There's no retry mechanism. The user sees an empty store with all defaults and must manually click "Refresh" in the debug panel.

---

### BUG-SDK-013: sdk-js `initialize()` Returns Fire-and-Forget Promise
**Location:** `packages/sdk-js/src/index.ts` → `initialize()`  
**Severity:** Minor  
**Description:** The `initialize()` convenience function calls `client.initialize()` without awaiting it, so the returned client isn't guaranteed to be ready.

```ts
export function initialize(sdkKey, context, options) {
  const client = new FeatureFlagClient(sdkKey, context, options);
  client.initialize(); // not awaited!
  return client;
}
```

Callers should use `client.waitForInitialization()` or use `createClient()` + manual `await client.initialize()`.

---

### BUG-SDK-014: Test App Doesn't Use sdk-js or sdk-react Packages
**Location:** `test-app/src/flags/FlagProvider.tsx`  
**Severity:** Minor (Architecture)  
**Description:** The FlagShop test app implements its own FlagProvider from scratch instead of using the `@feature-flag/sdk-react` or `@feature-flag/sdk-js` packages. This means:
1. Bugs in the test app don't test the actual SDK packages
2. The SDK packages go untested in a real app scenario
3. There's duplicated logic that can drift

**Recommendation:** Refactor FlagShop to use `@feature-flag/sdk-react`'s `FlagProvider` or inject `@feature-flag/sdk-js` client.

---

## ✅ Passed Tests

### API: SDK Flag Evaluation Endpoint
- ✅ Returns all 8 flags (dark-mode, checkout-flow, discount-banner, pricing-config, search-algorithm, new-feature-badge, test-flag, firstflag)
- ✅ Authentication via `Authorization` header works correctly (raw key, no Bearer prefix)
- ✅ Returns correct response format: `{ flags: { key: { value, variationId, reason } }, env }`

### API: Context-Based Evaluation
- ✅ Premium user (`plan: "premium"`) correctly gets `checkout-flow: "v2"` (RULE_MATCH)
- ✅ Premium user correctly gets `discount-banner: true` (RULE_MATCH)
- ✅ Israeli user (`country: "IL"`) correctly gets `pricing-config: { currency: "ILS", discount: 0 }` (RULE_MATCH)
- ✅ Default/fallthrough returns `dark-mode: false` for non-targeted users
- ✅ `firstflag` (OFF) correctly returns `false` with reason "OFF"
- ✅ Rollout flag `search-algorithm` returns a valid variation

### API: SSE Stream
- ✅ SSE connects successfully with `Authorization` header
- ✅ Sends initial `put` event with all flag data
- ✅ Server sends heartbeat/keepalive

### SDK-JS: Client Implementation
- ✅ Correct base URL defaulting to `window.location.origin`
- ✅ Context encoded as base64 JSON in query parameter
- ✅ Auth sent as raw key in `Authorization` header (not Bearer)
- ✅ SSE reconnection with exponential backoff (max 30s)
- ✅ localStorage caching via FlagStore
- ✅ Event batching with configurable flush interval
- ✅ Bootstrap flags support for instant rendering
- ✅ `variation()` and `variationDetail()` APIs work correctly
- ✅ `identify()` re-fetches flags and reconnects SSE
- ✅ `close()` properly cleans up resources

### SDK-React: Provider & Hooks
- ✅ `useFlag` returns default value when flag not found or not ready
- ✅ `useFlagWithDetail` returns full evaluation details
- ✅ `Feature` component conditionally renders based on flag value
- ✅ `AsyncFlagProvider` shows loading state until ready
- ✅ Context changes trigger re-identification
- ✅ Supports injecting external client (sdk-js)

### Test App: Feature Components
- ✅ All 6 flags are used in UI components (dark-mode, checkout-flow, discount-banner, pricing-config, search-algorithm, new-feature-badge)
- ✅ CheckoutButton renders 3 different variants (v1/v2/v3)
- ✅ DarkMode correctly toggles Tailwind dark class
- ✅ DiscountBanner conditionally shows/hides
- ✅ PricingTier handles multiple currencies
- ✅ SearchAlgorithm switches between basic and fuzzy
- ✅ NewBadge conditionally renders
- ✅ ContextSwitcher has 8 diverse test contexts
- ✅ FlagDebugPanel shows all flag details with reasons

### Test App: SDK Key
- ✅ SDK key in App.tsx matches production key `227046c7-d7dc-43e9-9b1c-de0f6d868abe`

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 5 |
| 🟡 Medium | 5 |
| 🟢 Minor | 4 |
| ✅ Passed | 23+ |

**Top Priority Fixes:**
1. **BUG-SDK-001** — FlagProvider response parsing (`data` vs `data.flags`) — breaks ALL flag evaluation in the test app
2. **BUG-SDK-002** — FlagProvider SSE missing auth — no real-time updates
3. **BUG-SDK-003** — SSE sends raw definitions instead of evaluated values — server-side fix needed
4. **BUG-SDK-004/005** — sdk-react LightweightClient uses wrong HTTP method and wrong SSE auth param — anyone using sdk-react standalone is completely broken
