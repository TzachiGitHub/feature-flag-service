# 🔍 Feature Flag Service — Placeholder & Incomplete Feature Audit

## Summary
Audit of ALL files for placeholders, TODOs, and incomplete implementations.

---

## 🔴 Issues Found & Fix Plan

### 1. `packages/dashboard/src/App.tsx` (lines 23-25)
**Issue:** Dead `Placeholder` component defined but unused
**Fix:** Remove the Placeholder component entirely
**Status:** [ ]

### 2. `packages/server/src/lib/broadcast.ts` (line 1)
**Issue:** SSE broadcast is a no-op stub — flag changes aren't pushed in real-time
**Fix:** Implement real SSE broadcasting (EventEmitter or direct connection tracking)
**Status:** [ ]

### 3. `packages/dashboard/src/pages/Analytics.tsx` (line 146)
**Issue:** `projectKey = 'default'` hardcoded TODO — analytics won't work for real projects
**Fix:** Read projectKey from `useProjectStore().currentProject.key`
**Status:** [ ]

### 4. `packages/dashboard/src/pages/SegmentDetail.tsx` (line 11)
**Issue:** `projectKey = 'default'` hardcoded TODO
**Fix:** Read projectKey from `useProjectStore().currentProject.key`
**Status:** [ ]

### 5. `packages/dashboard/src/pages/Segments.tsx` (line 15)
**Issue:** `projectKey` TODO — not reading from store
**Fix:** Read projectKey from `useProjectStore().currentProject.key`
**Status:** [ ]

### 6. `packages/dashboard/src/pages/Settings.tsx` (lines 77, 83)
**Issue:** "Rotate SDK Key" and "Delete Project" buttons are TODO stubs
**Fix:** Implement API calls for key rotation and project deletion with confirmation
**Status:** [ ]

### 7. `packages/dashboard/src/pages/Settings.tsx` — Save Changes
**Issue:** The "Save Changes" button in Flag Settings tab uses `defaultValue` (uncontrolled) — changes don't actually save
**Fix:** Convert to controlled inputs with state, wire save to `flagsApi.update()`
**Status:** [ ]

### 8. `packages/dashboard/src/pages/FlagList.tsx` — No on/off status shown
**Issue:** Flag cards don't show whether each flag is ON or OFF per environment
**Fix:** Fetch environment targeting state, show ON/OFF badge per flag
**Status:** [ ]

---

## TODO List — File-by-File Verification

### Dashboard Pages (packages/dashboard/src/pages/)
- [ ] `FlagList.tsx` — Add ON/OFF badge per flag, verify search/filter works
- [ ] `FlagDetail.tsx` — Verify targeting loads rules, activity shows log, archive toggles, on/off works
- [ ] `Analytics.tsx` — Fix hardcoded projectKey, verify charts render
- [ ] `AuditLog.tsx` — Verify entries load, filters work
- [ ] `Learn.tsx` — Verify all topics render with content
- [ ] `Login.tsx` — Verify login flow
- [ ] `Register.tsx` — Verify register flow
- [ ] `Playground.tsx` — Verify flag evaluation playground works
- [ ] `Segments.tsx` — Fix hardcoded projectKey, verify CRUD
- [ ] `SegmentDetail.tsx` — Fix hardcoded projectKey, verify rules edit
- [ ] `Settings.tsx` — Implement rotate key, delete project, wire save buttons

### Dashboard Components (packages/dashboard/src/components/)
- [ ] `targeting/TargetingEditor.tsx` — Verify loads & saves targeting rules
- [ ] `targeting/RuleBuilder.tsx` — Verify add/edit/delete rules
- [ ] `targeting/IndividualTargets.tsx` — Verify add/remove user targets
- [ ] `targeting/ClauseEditor.tsx` — Verify all operators work
- [ ] `targeting/RolloutSlider.tsx` — Verify percentage rollout
- [ ] `targeting/SegmentPicker.tsx` — Verify segment selection
- [ ] `targeting/VariationPicker.tsx` — Verify variation dropdown
- [ ] `CreateFlagModal.tsx` — Verify create flow works end-to-end
- [ ] `AuditDiff.tsx` — Verify diffs render
- [ ] `Layout.tsx` — Verify nav, env switcher
- [ ] `Toggle.tsx` — Verify toggle component
- [ ] `Toast.tsx` — Verify toasts show
- [ ] `Tooltip.tsx` — Verify tooltips render

### Dashboard Core
- [ ] `App.tsx` — Remove dead Placeholder component
- [ ] `stores/authStore.ts` — Verify persist across refresh (already fixed)
- [ ] `stores/flagStore.ts` — Verify flags load correctly (already fixed)
- [ ] `stores/projectStore.ts` — Verify project/env switching
- [ ] `api/client.ts` — Verify all API methods, error interceptor

### Server (packages/server/src/)
- [ ] `lib/broadcast.ts` — Implement real SSE broadcasting
- [ ] `routes/targeting.ts` — Verify toggle, get/update targeting
- [ ] `routes/flags.ts` — Verify CRUD
- [ ] `routes/auditLog.ts` — Verify list with filters
- [ ] `services/audit.ts` — Verify log entries created on all flag changes
- [ ] `middleware/validation.ts` — Verify all schemas cover edge cases

### SDK & Test App
- [ ] `packages/sdk-js/` — Verify flag evaluation, SSE streaming
- [ ] `packages/sdk-react/` — Verify hooks, provider
- [ ] `packages/test-app/` — Verify FlagShop renders with real flags

---

## Execution Plan

### Wave 1: Quick Fixes (5 min)
1. Remove Placeholder component from App.tsx
2. Fix hardcoded projectKey in Analytics.tsx, SegmentDetail.tsx, Segments.tsx
3. Implement broadcast.ts with real SSE

### Wave 2: Settings & Flag List (10 min)
4. Wire Settings.tsx save/rotate/delete buttons
5. Add ON/OFF badges to FlagList.tsx
6. Convert FlagDetail Settings tab to controlled inputs

### Wave 3: Verification (10 min)
7. Test every page manually against the live API
8. Fix any remaining issues found during testing

### Wave 4: Build & Deploy
9. `npm run build` — dashboard
10. `git push` + `railway up`
