# QA Round 2 — Bugs Found & Fixed

## CRITICAL

### 1. Playground "Evaluate All Flags" → 404 (FIXED)
- **Root cause**: Playground called `POST /api/projects/:projectKey/evaluate` but no such route existed on the server
- **Fix**: 
  - Added `POST /evaluate` route to `packages/server/src/routes/flags.ts` (mounted at `/api/projects/:projectKey/flags/evaluate`)
  - Changed Playground to call `/projects/${projectKey}/flags/evaluate` instead of `/projects/${projectKey}/evaluate`
- **Files**: `packages/server/src/routes/flags.ts`, `packages/dashboard/src/pages/Playground.tsx`

### 2. Playground layout — non-responsive grid (FIXED)
- **Root cause**: `grid-cols-2` hardcoded without responsive breakpoint — on mobile the context textarea was squished into a tiny narrow box
- **Fix**: Changed to `grid-cols-1 lg:grid-cols-2`
- **File**: `packages/dashboard/src/pages/Playground.tsx`

## MODERATE

### 3. Analytics stale-flags response key mismatch (FIXED)
- **Root cause**: Server returns `{ staleFlags: string[] }` but dashboard read `r.data?.flags` — always got `undefined`
- **Fix**: Changed to `r.data?.staleFlags` and handle both string[] and object[] formats
- **File**: `packages/dashboard/src/pages/Analytics.tsx`

### 4. Analytics stale-flags data shape mismatch (FIXED)
- **Root cause**: Server returns `string[]` (just flag keys) but dashboard expected objects with `name`, `key`, `lastEvaluated`, `daysStale` — caused runtime errors
- **Fix**: Simplified `StaleFlag` interface to `{ key: string }`, map raw strings to objects, replaced table with simpler card layout
- **File**: `packages/dashboard/src/pages/Analytics.tsx`

### 5. Analytics stats grid not responsive (FIXED)
- **Root cause**: `grid-cols-3` hardcoded — cards would be too narrow on mobile
- **Fix**: Changed to `grid-cols-1 sm:grid-cols-3`
- **File**: `packages/dashboard/src/pages/Analytics.tsx`

## VERIFIED WORKING (no bugs found)
- All dashboard API calls use correct paths (no double `/api/api/` issues — axios baseURL is `/api` and all paths correctly omit `/api/` prefix)
- FlagList, FlagDetail, Settings, Segments, SegmentDetail, AuditLog, Login, Register, Learn pages — all API calls match server routes
- Toggle functionality correctly calls `POST /projects/:projectKey/flags/toggle` which maps to targeting router
- SDK routes (`/api/sdk/flags`, `/api/sdk/stream`, `/api/sdk/events`, `/api/sdk/track`) all exist and are correct
- Test app FlagDebugPanel uses responsive card layout (previously fixed)
- No hardcoded 'default' projectKey — all pages use `currentProject?.key ?? ''`
- TypeScript compiles clean for server and dashboard (`npx tsc --noEmit` passes)
- Dashboard and server build successfully

## Pre-existing (not fixed, out of scope)
- SDK packages (`sdk-js`, `sdk-react`) have broken local `node_modules/.bin/tsc` symlinks — pre-existing dependency issue, not a code bug
