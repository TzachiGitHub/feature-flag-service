# QA Report — Dashboard & API

**Date**: 2026-02-15  
**Tester**: QA Agent  
**Server**: https://ff-server-production.up.railway.app

---

## Critical Bugs

### BUG-001: Rules lose `serve` field when saved — targeting rules become useless
- **Flow**: Targeting Save (Flow 2)
- **Steps**:
  1. PATCH `/api/projects/flagshop/flags/dark-mode/environments/production` with:
     ```json
     {"rules":[{"id":"rule-1","clauses":[{"contextKind":"user","attribute":"email","op":"endsWith","values":["@test.com"]}],"serve":{"variationId":"var-true"}}]}
     ```
  2. GET the same endpoint
- **Expected**: Rule saved with `serve.variationId: "var-true"` — the rule knows which variation to serve
- **Actual**: Rule saved WITHOUT `serve` field: `{"id":"rule-1","clauses":[...]}`  — no variation assigned
- **Root Cause**: Server strips the `serve` field from rules on save. The server schema likely expects `variationId` at rule level (not nested under `serve`), OR the server simply doesn't persist the `serve` sub-object.
- **Impact**: **All targeting rules are broken** — rules match users but have no variation to serve. SDK evaluation for rule-matched users will be undefined/fallback.
- **Note**: Existing seed data (pricing-config, discount-banner, checkout-flow) stores `variationId` directly on the rule object (not under `serve`). The dashboard sends `serve.variationId` but the server expects `rule.variationId`.
- **Fix Suggestion**: Either:
  - (a) Server: Accept `serve.variationId` and persist it, OR
  - (b) Dashboard `TargetingEditor.save()`: Flatten `rule.serve.variationId` → `rule.variationId` before sending to API
  - (c) Dashboard `RuleBuilder`: Use `rule.variationId` internally instead of `rule.serve.variationId`

### BUG-002: Archive/Unarchive doesn't work — PUT ignores `archived` field
- **Flow**: Archive Flow (Flow 5)
- **Steps**:
  1. PUT `/api/projects/flagshop/flags/qa-test-flag` with `{"archived": true}`
  2. GET the flag
- **Expected**: `archived: true`
- **Actual**: `archived: false` — the field is silently ignored
- **Root Cause**: The PUT endpoint likely validates/strips the `archived` field, or requires a dedicated archive endpoint
- **Impact**: Archive button in dashboard does nothing (no error shown, but flag stays unarchived)
- **Fix Suggestion**: Server should accept `archived` in PUT body, or expose a dedicated POST `.../archive` endpoint

### BUG-003: `offVariation` sent by dashboard is silently ignored by server
- **Flow**: Targeting Save (Flow 2)
- **Steps**:
  1. PATCH targeting with `{"offVariation": "var-false"}` (the field name the dashboard's TargetingConfig type uses internally)
  2. Server returns 200 but offVariationId unchanged
- **Expected**: Server should either accept `offVariation` as alias OR return 400 validation error
- **Actual**: Server returns 200 and silently ignores the field
- **Root Cause**: Server only accepts `offVariationId`. The dashboard correctly maps `offVariation` → `offVariationId` in the save function, so this doesn't cause a bug in practice, but the silent acceptance is dangerous.
- **Impact**: Low (dashboard maps correctly), but any direct API consumer using `offVariation` will lose data silently
- **Fix Suggestion**: Server should return 400 for unknown fields, or accept `offVariation` as alias

---

## Medium Bugs

### BUG-004: Flag list doesn't include per-environment `on` state — causes N+1 API calls
- **Flow**: Flag List (Flow 4)
- **Steps**:
  1. GET `/api/projects/flagshop/flags`
  2. Observe response: flags have NO `environmentConfigs` or `on` field
- **Expected**: Flag list should include environment state (at least for current environment)
- **Actual**: Response only has flag metadata. Dashboard's `FlagList.tsx` must make N additional `getTargeting` calls (one per flag) to show ON/OFF state
- **Root Cause**: Server doesn't join environment config in list endpoint
- **Impact**: Performance — with 100 flags, the dashboard makes 101 API calls to render the list page
- **Fix Suggestion**: Include `environmentConfigs` in list response, or add `?include=environments` query param

### BUG-005: Dashboard rule type mismatch — `serve` vs flat `variationId`
- **Flow**: Dashboard Code Consistency (Flow 8)
- **Details**:
  - Dashboard `TargetingRule` type uses `serve: { variationId?, rollout? }`
  - Server returns rules with flat `variationId` at rule level (no `serve` wrapper)
  - `TargetingEditor.fetchConfig()` passes `data.rules` directly to state without transforming `rule.variationId` → `rule.serve.variationId`
  - Result: Rules loaded from server have no `serve` property → RuleBuilder shows no variation selected
  - When saving, rules have `serve.variationId` which server strips (see BUG-001)
- **Root Cause**: Mismatch between dashboard type definition and server schema
- **Fix Suggestion**: In `fetchConfig()`, transform loaded rules:
  ```ts
  rules: (data.rules || []).map(r => ({
    ...r,
    serve: r.serve || { variationId: r.variationId },
  }))
  ```
  In `save()`, flatten back:
  ```ts
  rules: config.rules.map(r => ({
    ...r,
    variationId: r.serve?.variationId,
    serve: undefined,
  }))
  ```

---

## Minor Issues

### ISSUE-001: Create flag requires uppercase type enum
- **Flow**: Flag CRUD (Flow 1)
- **Details**: POST `/flags` with `type: "boolean"` returns 400. Must use `type: "BOOLEAN"`.
- **Impact**: Dashboard's `CreateFlagModal` must send uppercase. If it sends lowercase, creation fails.

### ISSUE-002: SDK endpoint returns different response format with/without context
- **Flow**: SDK Evaluation (Flow 6)
- **Details**:
  - Without context param: Returns full flag configs (variations, rules, targets, etc.)
  - With context param: Returns evaluated results only (`value`, `variationId`, `reason`)
  - Both use same endpoint `/api/sdk/flags`
- **Impact**: None if SDK clients handle both, but potentially confusing

### ISSUE-003: Settings tab in FlagDetail doesn't actually save
- **Flow**: Dashboard Code (Flow 8)
- **Details**: The Settings tab has name/description/tags inputs with a "Save Changes" button, but no `onClick` handler — it's just `<button className="btn-primary">Save Changes</button>` with no action
- **Impact**: Users think they can edit flag settings but nothing happens on save

---

## Passed Tests

- [x] **Auth login** — returns JWT token correctly
- [x] **Flag CRUD** — create (with BOOLEAN), list, get detail, delete all work (update PUT works for name/description but not archived)
- [x] **Flag list pagination** — returns `{flags, total, page, limit}` format
- [x] **Targeting GET** — returns correct fields: `on`, `offVariationId`, `fallthrough`, `targets`, `rules`, `version`
- [x] **Targeting PATCH `offVariationId`** — saves and persists correctly
- [x] **Targeting PATCH `on`** — saves and persists correctly
- [x] **Targeting PATCH `targets`** — saves and persists correctly
- [x] **Toggle ON/OFF** — POST toggle endpoint works, persists correctly
- [x] **SDK evaluation without context** — returns full flag configs
- [x] **SDK evaluation with context** — returns evaluated values with reasons (OFF, FALLTHROUGH, ROLLOUT)
- [x] **Audit log** — returns entries with before/after diffs, supports `?flagKey=` filter
- [x] **Audit log completeness** — records flag.create, flag.update, flag.toggle, targeting.update actions
- [x] **Dashboard field mapping `offVariation` ↔ `offVariationId`** — TargetingEditor correctly maps on load and save
- [x] **No double `/api/` prefix bug** — apiClient uses baseURL `/api`, all endpoint paths start with `/` (e.g., `/projects/...`), producing correct `/api/projects/...` URLs
- [x] **Response parsing** — flagStore handles `raw.flags || raw.data || Array.isArray(raw)` correctly
