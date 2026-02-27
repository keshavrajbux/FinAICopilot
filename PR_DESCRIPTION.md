# PR: Layered Architecture + Cash Flow Forecasting Agent with Dashboard UI

## Summary

Replaces dual-branch maintenance (main vs enterprise) with a **single-branch layered architecture** using feature flags, and introduces a **cash flow forecasting agent** with scenario modeling and a polished **ForecastDashboard** UI.

- Layered architecture: `core/` → `product/` → `enterprise/` with strict import rules
- Cash flow forecasting agent with 5 scenario types and hybrid AI+deterministic engine
- Full-featured ForecastDashboard UI matching the cosmic space theme
- Feature flag system replacing branch-based product variants
- 52 passing tests (25 new for cashflow engine)

## What Changed

### 1. Layered Architecture (Core → Product → Enterprise)

**Core Layer** (`src/lib/core/`)
- Generic `BaseAgent<T>` with fallback orchestration — any domain, not just fintech
- Provider abstraction for Claude and OpenAI with automatic failover
- Type-safe message handling and result structures

**Product Layer** (`src/lib/product/`)
- `FinancialAnalysisAgent` (migrated from monolithic file)
- **NEW:** `CashFlowAgent` with scenario-based forecasting
- **NEW:** Deterministic projection engine with month-by-month simulation

**Enterprise Layer** (`src/lib/enterprise/`)
- Multi-tenant auth, audit logging, usage tracking
- Per-tenant feature flag scoping
- Foundation for white-label and compliance features

**Why this approach:** One branch with feature flags eliminates cherry-pick hell. Consumer and enterprise share the same codebase — flags control what's enabled.

### 2. Cash Flow Forecasting Agent

**Scenarios supported:**
| Scenario | What it models |
|----------|---------------|
| Baseline | Current trajectory, no changes |
| Aggressive Saving | 70% surplus → savings, 30% → investments |
| Debt Avalanche | All surplus → highest-interest debt first |
| Income Disruption | N-month job loss simulation (draws down assets) |
| Income Boost | Side income modeling (+$X/month) |

**Hybrid architecture:**
- **Deterministic engine** computes all numbers (ground truth) — no hallucinated math
- **AI narrative layer** generates insights and action items via LLM
- **Graceful fallback:** Rule-based insights if AI is unavailable

**Key metrics:**
- Stress score (0–100) based on runway, DTI ratio, cash flow trajectory, net worth direction
- Runway in months (how long assets last without income)
- Debt-free timeline
- Net worth delta over horizon
- Total interest paid vs. investment/savings returns

**Default rates:** 22.8% APR (credit card debt), 7% APR (S&P 500), 4.5% APR (HYSA)

### 3. ForecastDashboard UI

Full dashboard component integrated below the existing analysis results:

- **Scenario selector** — checkboxes for 1–4 scenarios with visual descriptions
- **Horizon picker** — 6mo / 12mo / 24mo / 5yr
- **Key metrics cards** — stress score (color-coded progress bar), runway, debt-free timeline, net worth delta
- **Interest vs. returns summary** — debt cost vs. investment/savings gains
- **Scenario comparison table** — side-by-side with "BEST" badge
- **Net worth trajectory chart** — bar visualization with tooltips per month
- **AI insights** — prioritized by urgency with headlines, explanations, and action items

Matches the existing cosmic space theme: glassmorphism, framer-motion animations, Magic UI BorderBeam.

### 4. Feature Flags

Replaces branch-based separation with environment-driven flags:

```bash
# Run as consumer (default)
npm run dev

# Run as enterprise
PRODUCT_VARIANT=enterprise npm run dev

# Override individual flags
FEATURE_FLAG_PRODUCT_CASH_FLOW_FORECAST=true npm run dev
```

### 5. API Endpoints

| Endpoint | Auth | Features |
|----------|------|----------|
| `POST /api/forecast` | Optional | Rate limiting, Zod validation, fallback |
| `POST /api/v1/enterprise/forecast` | Tenant auth | Audit logging, usage tracking, per-tenant CORS |

## Files Changed

**New — Architecture:**
- `src/lib/core/` — BaseAgent, providers, types (6 files)
- `src/lib/enterprise/index.ts` — Enterprise barrel exports
- `src/lib/shared/feature-flags.ts` — Feature flag system
- `ARCHITECTURE.md` — Design patterns and migration guide

**New — Cash Flow Feature:**
- `src/lib/product/cashflow/` — types, engine, agent (4 files)
- `src/components/ForecastDashboard.tsx` — Dashboard UI (656 lines)
- `src/pages/api/forecast.ts` — Consumer endpoint
- `src/pages/api/v1/enterprise/forecast.ts` — Enterprise endpoint
- `src/__tests__/cashflow-engine.test.ts` — 25 unit tests

**Modified — Migration:**
- `src/lib/calculations.ts` → backward-compat re-export
- `src/lib/claude.ts` → backward-compat re-export
- `src/lib/openai.ts` → backward-compat re-export
- `src/lib/financial-analysis-agent.ts` → backward-compat re-export
- `src/components/FinancialDataEntry.tsx` → imports ForecastDashboard
- `src/pages/api/analyze-finances.ts` → uses new import paths

**32 files changed, +3,252 / -545 lines**

## Test Plan

- [x] 52 tests pass (`npx jest`) — 25 new for cashflow engine
- [x] TypeScript type-check passes (`npx tsc --noEmit`) — only pre-existing `next/types.js` error
- [x] All 5 scenario types validated (baseline, aggressive_saving, debt_avalanche, income_disruption, income_boost)
- [x] Edge cases: zero income, no assets, zero debt, single-month horizon
- [x] Stress score ranges verified (healthy=low, stressed=high)
- [x] Backward compatibility: old import paths still work via re-export shims
- [ ] Manual: Run app → enter financial data → click "Launch Analysis" → scroll to forecast section → run forecast

## Migration Notes

- **No breaking changes.** Old import paths (`@/lib/calculations`, `@/lib/claude`, etc.) still work via re-export shims
- New code should use layered paths: `@/lib/core`, `@/lib/product`, `@/lib/enterprise`
- Feature flags replace environment-based branching — see `ARCHITECTURE.md` for details

## Recommended Merge Strategy

**Squash and merge** — collapses the 4 development commits into one clean commit on main.
