# 🏪 FlagShop — Feature Flag Test App

FlagShop is a mini e-commerce demo app that exercises all features of the feature-flag-service. Every UI element is controlled by feature flags, making it the perfect playground for testing flag evaluation, targeting rules, percentage rollouts, and real-time updates.

## Quick Start

```bash
# Prerequisites: backend must be running on port 3020
cd test-app
pnpm install   # or npm install from repo root
pnpm dev       # starts on http://localhost:5186
```

## Prerequisites

- **Backend API** running on `http://localhost:3020`
- An SDK key configured in the backend (default: `test-sdk-key-1`)
- Flags created in the dashboard (see below)

## Expected Flags

| Flag Key | Type | Values | Description |
|---|---|---|---|
| `dark-mode` | Boolean | `true` / `false` | Toggles dark theme |
| `checkout-flow` | String | `"v1"`, `"v2"`, `"v3"` | Checkout button variant |
| `discount-banner` | Boolean | `true` / `false` | Shows promotional banner |
| `pricing-config` | JSON | `{ currency, discount, showOriginal }` | Pricing display config |
| `search-algorithm` | String | `"basic"`, `"fuzzy"`, `"ai"` | Search behavior variant |
| `new-feature-badge` | Boolean | `true` / `false` | Shows NEW badge on products |

## Architecture

The app is **self-contained** — it includes an inline flag provider that communicates directly with the backend API via:
- `GET /api/sdk/flags?context=<base64>` — initial flag fetch
- `GET /api/sdk/stream?context=<base64>` — SSE for real-time updates

No dependency on `@feature-flag/sdk-react` or `@feature-flag/sdk-js`.

## Test Contexts

Switch between 8 pre-configured user contexts via the dropdown in the header:

| Context | Key | Notable Attributes |
|---|---|---|
| Alex Free | `user-free-001` | plan: free, country: US |
| Jane Premium | `user-premium-001` | plan: premium, country: US |
| Admin Bob | `user-admin-001` | plan: enterprise, role: admin |
| Yael Cohen | `user-il-001` | country: IL, plan: premium |
| Hans Mueller | `user-eu-001` | country: DE, plan: free |
| iPhone 15 | `device-ios-001` | kind: device, platform: ios |
| Beta Tina | `user-beta-001` | beta: true, plan: free |
| New Noah | `user-new-001` | signupDate: 2024-01-15 |

---

## 12 Test Scenarios

### 1. Toggle Dark Mode → Theme Changes
1. Create flag `dark-mode` (boolean, default: `false`)
2. Open FlagShop — app is in light mode (☀️ indicator)
3. Toggle `dark-mode` to `true` in the dashboard
4. **Expected:** App switches to dark theme in real-time (🌙 indicator), dark backgrounds, light text

### 2. Set Checkout to "v2" → UI Changes
1. Create flag `checkout-flow` (string, default: `"v1"`)
2. Products show "Buy Now" button (v1)
3. Change flag to `"v2"`
4. **Expected:** Buttons change to "Add to Cart" + "Checkout →" two-step flow
5. Change to `"v3"` → Apple Pay style " Pay" button

### 3. Target Premium Segment → Discount Banner
1. Create flag `discount-banner` (boolean, default: `false`)
2. Create a segment: `premium-users` where `plan = "premium"`
3. Add targeting rule: if segment `premium-users` → `true`
4. Select "Jane Premium" context
5. **Expected:** "🎉 20% OFF" banner appears
6. Switch to "Alex Free" → banner disappears

### 4. 50% Rollout → Sticky Bucketing
1. Create flag `search-algorithm` (string, default: `"basic"`)
2. Add percentage rollout: 50% → `"fuzzy"`, 50% → `"basic"`
3. Switch between different user contexts
4. **Expected:** Each user consistently gets the same variant (sticky by user key)
5. Search bar shows "Fuzzy" or no badge depending on variant

### 5. Prerequisite: Discount Requires Dark Mode
1. Ensure `dark-mode` flag exists
2. On `discount-banner`, add prerequisite: `dark-mode` must be `true`
3. Set `discount-banner` targeting to serve `true`
4. With `dark-mode` = `false` → no banner even though `discount-banner` is targeted
5. Toggle `dark-mode` to `true` → banner appears
6. **Expected:** Prerequisite gates the dependent flag

### 6. Individual Target user-123
1. On `new-feature-badge`, add individual target: key `user-premium-001` → `true`
2. Select "Jane Premium" (key: `user-premium-001`)
3. **Expected:** "NEW" badges appear on product cards
4. Switch to any other user → badges disappear

### 7. Country = "IL" → Localized Pricing
1. Create flag `pricing-config` (JSON)
2. Add rule: if `country = "IL"` → `{ "currency": "ILS", "discount": 10, "showOriginal": true }`
3. Default: `{ "currency": "USD", "discount": 0, "showOriginal": false }`
4. Select "Yael Cohen" (country: IL)
5. **Expected:** Prices show in ₪ (ILS) with 10% discount and original price crossed out
6. Switch to US user → prices in $ with no discount

### 8. Kill SSE → Offline Resilience
1. Configure some flags with values
2. Observe 🟢 Connected (SSE) indicator
3. Stop the backend server
4. **Expected:** Status changes to 🔴 Disconnected
5. App continues working with last-known flag values
6. Restart backend → reconnects and updates

### 9. Switch Context → Flags Re-evaluate
1. Set up targeting rules (e.g., premium gets discount, IL gets ILS pricing)
2. Start as "Jane Premium" — see discount banner, USD pricing
3. Switch to "Yael Cohen" — discount banner (still premium), ILS pricing
4. Switch to "Alex Free" — no banner, USD pricing
5. **Expected:** All flags re-evaluate on context switch, UI updates accordingly

### 10. Toggle Flag → Check Audit Log
1. Toggle `dark-mode` on and off several times
2. Open the dashboard audit log
3. **Expected:** Each toggle is recorded with timestamp, user, old value, new value

### 11. Analytics Match Usage
1. Enable analytics/events on the backend
2. Use the app with different contexts, triggering flag evaluations
3. Check analytics in the dashboard
4. **Expected:** Flag evaluation counts match actual usage per context/variation

### 12. Schedule Flag +5min → Auto-enable
1. On `discount-banner`, set a scheduled activation 5 minutes from now
2. App currently shows no banner
3. Wait for the scheduled time
4. **Expected:** Banner appears automatically via SSE update when schedule triggers

---

## Debug Panel

The bottom of the page shows a **Flag Debug Panel** with:
- All received flag keys
- Current values (color-coded by type)
- Variation IDs
- Evaluation reasons (color-coded: TARGET_MATCH=blue, RULE_MATCH=purple, FALLTHROUGH=green, OFF=gray, ERROR=red)
- Refresh button for manual re-fetch

## Development

```bash
pnpm dev       # Dev server with HMR on port 5186
pnpm build     # TypeScript check + Vite production build
```

Vite proxies `/api/*` requests to `http://localhost:3020` in dev mode.
