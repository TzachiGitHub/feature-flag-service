# 🚩 Feature Flag Service — LaunchDarkly Clone

A full-stack, production-grade feature flag platform with real-time updates, targeting rules, percentage rollouts, and a complete SDK.

## Quick Start

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)

### 1. Start Database
```bash
docker-compose up -d
```

### 2. Install & Setup
```bash
npm install
cd packages/server
npx prisma migrate dev
npx prisma db seed
cd ../..
```

### 3. Start Backend
```bash
cd packages/server && npm run dev
```

### 4. Start Dashboard
```bash
cd packages/dashboard && npm run dev
```

### 5. Start Test App (optional)
```bash
cd test-app && npm run dev
```

### Access
- Dashboard: http://localhost:5185
- Test App: http://localhost:5186
- API: http://localhost:3020

### Default Login
- Email: admin@example.com
- Password: admin123

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Dashboard   │────▶│  Express API │────▶│   PostgreSQL     │
│  (React)     │◀────│  + SSE       │◀────│   (Prisma ORM)   │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │ SSE
                    ┌──────▼───────┐
                    │  JS/React    │
                    │  SDK Client  │
                    └──────────────┘
```

The server evaluates feature flags using a rule engine with support for:
- Boolean, string, number, and JSON flag types
- User targeting and segment-based rules
- Percentage rollouts with consistent hashing (MurmurHash3)
- Prerequisites between flags
- Scheduled flag changes
- Real-time updates via Server-Sent Events
- Analytics tracking and aggregation

## Packages

| Package | Description |
|---------|-------------|
| `@feature-flag/shared` | TypeScript types + evaluation engine (52 tests) |
| `@feature-flag/server` | Express API + PostgreSQL + SSE + analytics |
| `@feature-flag/dashboard` | React admin dashboard with targeting UI |
| `@feature-flag/sdk-js` | JavaScript/TypeScript client SDK (17 tests) |
| `@feature-flag/sdk-react` | React SDK with hooks & components (15 tests) |
| `flagshop-test-app` | Demo e-commerce app (FlagShop) |

## Tests

```bash
npm run test -w packages/shared       # 52 evaluation engine tests
npm run test -w packages/sdk-js       # 17 SDK tests
npm run test -w packages/sdk-react    # 15 React SDK tests
```

## License

MIT
