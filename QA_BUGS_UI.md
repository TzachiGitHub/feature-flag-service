# QA Report — Dashboard UI/UX & Code Quality

**Date:** 2026-02-15  
**Reviewer:** QA Agent  
**Scope:** All dashboard pages, components, stores, and API client

---

## 🔴 Critical Bugs

### 1. FlagDetail Settings Tab — "Save Changes" Button Does Nothing
**File:** `pages/FlagDetail.tsx` (Settings tab, ~line 195)  
**Issue:** The "Save Changes" button has **no `onClick` handler**. The form inputs use `defaultValue` (uncontrolled), so even if a handler existed, there's no state to read.  
**Impact:** Users cannot edit flag name, description, or tags from the Settings tab.  
**Fix:** Add controlled state for name/description/tags and wire the button to call `flagsApi.update()`.

### 2. AuditLog Page — Hardcoded `projectKey = 'default'`
**File:** `pages/AuditLog.tsx` (line 31)  
**Issue:** `const projectKey = 'default';` — does not use the project store. If the user's project is not `default`, the audit log will either 404 or show wrong data.  
**Impact:** Audit log broken for any non-default project.  
**Fix:** Use `useProjectStore()` to get `currentProject?.key`.

### 3. Playground Page — Hardcoded `projectKey = 'default'`
**File:** `pages/Playground.tsx` (line 36)  
**Issue:** Same as AuditLog — `const projectKey = 'default';` ignores the current project selection.  
**Impact:** Playground evaluations go to wrong project.  
**Fix:** Use `useProjectStore()`.

### 4. Analytics Page — Missing `projectKey` Dependency in useEffect
**File:** `pages/Analytics.tsx`  
**Issue:** The main evaluations `useEffect` depends on `[period, flagFilter]` but NOT on `projectKey`. If the user switches projects, the analytics won't re-fetch. The stale flags `useEffect` has `[]` dependency — only fetches once on mount and uses whatever `projectKey` was at that time.  
**Impact:** Stale/wrong analytics data after project switch.

### 5. Analytics Page — Empty `projectKey` Causes Bad API Calls
**File:** `pages/Analytics.tsx`  
**Issue:** `projectKey` defaults to `''` if no project selected. API calls like `/projects//analytics/evaluations` will fire immediately and 404.  
**Fix:** Guard with `if (!projectKey) return;` in effects.

### 6. Settings Page — Hardcoded Fallback Environments
**File:** `pages/Settings.tsx` (line 26-30)  
**Issue:** On API error, falls back to hardcoded fake environments with fake SDK keys (`sdk-prod-abc123xyz` etc.). Users could mistakenly copy these non-functional keys.  
**Fix:** Show an error state instead of fake data.

### 7. PrerequisiteSelector — Uses Wrong Response Field
**File:** `components/targeting/PrerequisiteSelector.tsx` (line 23)  
**Issue:** Reads `res.data?.items` but the flags API returns `res.data.flags` or `res.data.data` (see flagStore). `items` is never set by the server → prerequisites list will always be empty.  
**Fix:** Use `res.data?.flags || res.data?.data || res.data || []`.

---

## 🟡 Medium Issues

### 8. AuditLog — Field Name Mismatch: `timestamp` vs `createdAt`
**File:** `pages/AuditLog.tsx`  
**Issue:** The `AuditEntry` interface uses `timestamp` but FlagDetail's `AuditEntry` uses `createdAt`. If the server returns `createdAt`, the AuditLog page will show "just now" for all entries (since `timestamp` would be undefined → `Date.now() - NaN`).

### 9. FlagList — N+1 API Calls for Environment States
**File:** `pages/FlagList.tsx` (line 36-48)  
**Issue:** Fetches targeting state **individually** for every flag via `Promise.allSettled`. With 100 flags, this makes 100 API calls.  
**Impact:** Slow page load, potential rate limiting.  
**Suggestion:** Add a bulk endpoint or include env state in the flags list response.

### 10. CreateFlagModal — Sends `type: type.toUpperCase()`
**File:** `components/CreateFlagModal.tsx` (line 47)  
**Issue:** Sends `type: "BOOLEAN"` but the FlagList page checks `typeBadgeVariant[flag.type]` with lowercase keys (`boolean`, `string`). If the server stores and returns uppercase, the type badge will show with default styling.

### 11. Settings Page — `useEffect` Missing `projectKey` Dependency
**File:** `pages/Settings.tsx` (line 23)  
**Issue:** `useEffect(() => { ... }, []);` — empty dependency array means environments only load once. Switching projects won't refresh the environments/SDK keys.

### 12. Segments Page — No Error Feedback on Create Failure
**File:** `pages/Segments.tsx` (line 36)  
**Issue:** `catch {}` — empty catch block on segment creation. User gets no feedback if creation fails.

### 13. SegmentDetail — Uses `confirm()` for Delete
**File:** `pages/SegmentDetail.tsx` (line 59)  
**Issue:** Uses native `confirm()` dialog which is inconsistent with the rest of the UI (FlagDetail uses a custom `ConfirmDialog`).

---

## 🟢 Minor Issues / Code Quality

### 14. Multiple `any` Types Throughout
- `client.ts`: `flagsApi.create(data: any)`, `flagsApi.update(data: any)`, `flagsApi.list(params?: any)`, `flagsApi.updateTargeting(data: any)`
- `pages/Analytics.tsx`: `const params: any = { period };`
- `pages/AuditLog.tsx`: `const params: any = { ... }`
- Various `catch (err: any)` and `(res: any)` throughout

### 15. No `console.log` Statements Found ✅
No stray console.log calls detected in any reviewed file.

### 16. No TODO/FIXME/HACK Comments Found ✅
No TODO or FIXME comments in reviewed code.

### 17. AuditDiff — Unused Variable `regex`
**File:** `components/AuditDiff.tsx` (line 14)  
**Issue:** `const regex = /("(?:\\.|[^"\\])*")\s*:/g;` and `let match` are declared but never used.

### 18. AuditDiff — `diffKeys` Not Used for Visual Highlighting
**File:** `components/AuditDiff.tsx`  
**Issue:** `diffKeys()` computes changed keys and displays them as tags below the diff, but doesn't actually highlight the changed lines/values in the before/after panels.

### 19. Learn Page — Imports `Term` from Tooltip but Never Uses It
**File:** `pages/Learn.tsx` (line 3)  
**Issue:** `import { Term } from '../components/Tooltip'` — unused import.

### 20. FlagDetail — Delete Button Has No Error Handling
**File:** `pages/FlagDetail.tsx` (`handleDelete`)  
**Issue:** No try/catch around the delete call. If it fails, no error message shown.

### 21. FlagDetail — Archive Button Has No Error Handling
**File:** `pages/FlagDetail.tsx` (`handleArchive`)  
**Issue:** No try/catch. Silent failure on error.

### 22. Accessibility — datalist ID Collision
**File:** `components/targeting/ClauseEditor.tsx`  
**Issue:** `<datalist id="attr-suggestions">` uses a static ID. If multiple ClauseEditors render on the same page (which they do, for multiple clauses), all share the same datalist. While functionally harmless, it's invalid HTML.

---

## ✅ Passed Tests

| Area | Status | Notes |
|------|--------|-------|
| Login/Register | ✅ Pass | Proper error handling, loading states, form validation |
| FlagList loading state | ✅ Pass | Shows Spinner while loading |
| FlagList empty state | ✅ Pass | Shows helpful empty state with CTA |
| FlagList ON/OFF badges | ✅ Pass | Correctly shows ON/OFF based on env state |
| FlagList toggle | ✅ Pass | Optimistic update with rollback on error |
| FlagDetail toggle | ✅ Pass | Works with optimistic update |
| FlagDetail Targeting tab | ✅ Pass | Full targeting editor with save/discard |
| FlagDetail Variations tab | ✅ Pass | Read-only display works |
| FlagDetail Activity tab | ✅ Pass | Loads audit entries with pagination |
| FlagDetail delete | ✅ Pass | Uses ConfirmDialog, navigates after delete |
| CreateFlagModal | ✅ Pass | Proper form with auto-key generation |
| Layout | ✅ Pass | Responsive sidebar, project/env selectors work |
| Auth store | ✅ Pass | Proper localStorage persistence |
| Flag store | ✅ Pass | Handles multiple response shapes |
| Project store | ✅ Pass | Auto-selects first project/env |
| API client 401 handling | ✅ Pass | Redirects to login on 401 |
| TargetingEditor | ✅ Pass | Load, save, discard all wired correctly |
| RuleBuilder | ✅ Pass | Add/remove/reorder rules, clauses work |
| IndividualTargets | ✅ Pass | Add/remove targets with chip input |
| ChipInput | ✅ Pass | Enter to add, backspace to remove, dedup |
| RolloutSlider | ✅ Pass | Auto-adjusts last variation weight |
| VariationPicker | ✅ Pass | Toggle between specific and rollout |
| SegmentDetail | ✅ Pass | CRUD works with change detection |
| Toggle component | ✅ Pass | Clean, accessible |

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 7 |
| 🟡 Medium | 6 |
| 🟢 Minor | 9 |
| ✅ Passed | 25 |

**Top 3 Priorities:**
1. Fix FlagDetail Settings "Save Changes" button (dead button)
2. Fix hardcoded `projectKey = 'default'` in AuditLog and Playground
3. Fix PrerequisiteSelector using wrong response field (`items` vs `flags`/`data`)
