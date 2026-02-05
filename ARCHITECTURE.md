# FinAI Copilot — Layered Architecture

## Why One Branch, Not Two

This project serves two purposes:

1. **An AI agent orchestration framework** (reusable across domains)
2. **A fintech product** (financial analysis, powered by that framework)

These are maintained in **one branch** with a layered architecture, not in separate
`main` and `enterprise` branches. Branches are for development workflows (feature
branches, PRs), not for product variants. Separate long-lived branches for different
products lead to cherry-pick hell, merge conflicts, and inevitable drift.

Instead, **feature flags** control what ships to whom, and **clean layer boundaries**
keep the orchestrator reusable while the product stays focused.

## The Three Layers

```
┌─────────────────────────────────────────────────────────────┐
│  ENTERPRISE LAYER              src/lib/enterprise/          │
│  Multi-tenancy, compliance, white-label, audit logging      │
│  Imports from: core/, product/                              │
├─────────────────────────────────────────────────────────────┤
│  PRODUCT LAYER                 src/lib/product/             │
│  Financial analysis, calculations, domain-specific agents   │
│  Imports from: core/                                        │
├─────────────────────────────────────────────────────────────┤
│  CORE LAYER                    src/lib/core/                │
│  Generic agents, AI providers, orchestration primitives     │
│  Imports from: nothing (leaf dependency)                    │
└─────────────────────────────────────────────────────────────┘
```

### Import Rules

These are hard rules, not suggestions. Violations break the architecture:

| Layer        | Can Import From         | NEVER Imports From    |
|--------------|-------------------------|-----------------------|
| `core/`      | External packages only  | `product/`, `enterprise/` |
| `product/`   | `core/`                 | `enterprise/`         |
| `enterprise/`| `core/`, `product/`     | —                     |

### Core Layer (`src/lib/core/`)

The domain-agnostic orchestration framework. If you ripped out the `product/` and
`enterprise/` directories, `core/` should still compile and be usable for a completely
different domain (healthcare, education, etc.).

**What lives here:**
- `types.ts` — `Message`, `ProviderConfig`, `FallbackConfig<T>`, `AgentResult<T>`
- `providers/claude-provider.ts` — Claude API client (text in, text out)
- `providers/openai-provider.ts` — OpenAI API client (text in, text out)
- `agents/base-agent.ts` — Generic `BaseAgent<T>` with fallback orchestration

**Key design: `BaseAgent<T>` is generic**

```typescript
abstract class BaseAgent<T> {
  protected abstract parseResponse(text: string): T;
  async run(messages: Message[]): Promise<AgentResult<T>>;
  async runWithFallback(config: FallbackConfig<T>): Promise<AgentResult<T>>;
}
```

To build a new agent for any domain, you extend `BaseAgent<YourOutputType>` and
implement `parseResponse`. The framework handles provider calls, timeouts, and
fallback orchestration.

### Product Layer (`src/lib/product/`)

Fintech-specific features built on the core framework.

**What lives here:**
- `analysis/calculations.ts` — Financial metrics, thresholds, Zod schemas
- `analysis/financial-analysis-agent.ts` — `FinancialAnalysisAgent extends BaseAgent<AnalysisResults>`

**How the agent uses core:**

```typescript
class FinancialAnalysisAgent extends BaseAgent<AnalysisResults> {
  protected parseResponse(text: string): AnalysisResults {
    return JSON.parse(text);  // Domain-specific parsing
  }

  async analyze(data: FinancialData): Promise<AnalysisResults> {
    return this.runWithFallback({
      strategies: [
        { name: 'openai', execute: () => this.analyzeWithOpenAI(data) },
        { name: 'claude', execute: () => this.run(messages).then(r => r.data) },
      ],
      finalFallback: () => calculateAnalysis(data),  // Deterministic
    });
  }
}
```

### Enterprise Layer (`src/lib/enterprise/`)

B2B platform infrastructure. Wraps the product with multi-tenancy, compliance, and
white-label capabilities.

**What lives here:**
- Tenant management (CRUD, API keys, authentication)
- Tenant middleware (auth, CORS, audit logging, usage tracking)
- Rate limiting (per-tenant)
- Compliance engine
- Type definitions for multi-tenant concepts

## Feature Flags (`src/lib/shared/feature-flags.ts`)

Feature flags control what's available to whom. Set `PRODUCT_VARIANT=consumer` or
`PRODUCT_VARIANT=enterprise` in your environment, or override individual flags:

```bash
# Enable enterprise features for local dev
PRODUCT_VARIANT=enterprise npm run dev

# Override a single flag
FEATURE_FLAG_PRODUCT_RISK_ASSESSMENT=true npm run dev
```

In code:

```typescript
import { features } from '@/lib/shared/feature-flags';

if (features.isEnabled('product.riskAssessment')) {
  // Show risk assessment UI
}
```

For enterprise tenants, flags can be scoped per-tenant:

```typescript
const tenantFlags = features.withTenantFlags(tenant.features);
if (tenantFlags.isEnabled('enterprise.whiteLabel')) {
  // Apply tenant branding
}
```

## Adding a New Agent (For Any Domain)

To add a completely new agent (say, a support agent):

1. **Define your output type** in `product/` (or a new domain directory):
   ```typescript
   interface SupportResponse { answer: string; confidence: number; }
   ```

2. **Extend BaseAgent** from `core/`:
   ```typescript
   import { BaseAgent } from '@/lib/core';

   class SupportAgent extends BaseAgent<SupportResponse> {
     protected parseResponse(text: string): SupportResponse {
       return JSON.parse(text);
     }
   }
   ```

3. **Use fallback orchestration** if needed:
   ```typescript
   const result = await agent.runWithFallback({
     strategies: [
       { name: 'openai', execute: () => ... },
       { name: 'claude', execute: () => ... },
     ],
     finalFallback: () => ({ answer: 'Please contact support', confidence: 0 }),
   });
   ```

## Directory Structure

```
src/lib/
├── core/                          # Layer 1: Domain-agnostic orchestrator
│   ├── types.ts                   #   Core type definitions
│   ├── providers/
│   │   ├── claude-provider.ts     #   Claude API client
│   │   ├── openai-provider.ts     #   OpenAI API client
│   │   └── index.ts
│   ├── agents/
│   │   ├── base-agent.ts          #   Generic BaseAgent<T>
│   │   └── index.ts
│   └── index.ts                   #   Barrel exports
│
├── product/                       # Layer 2: Fintech product
│   ├── analysis/
│   │   ├── calculations.ts        #   Financial calculations & Zod schemas
│   │   ├── financial-analysis-agent.ts  #   FinancialAnalysisAgent
│   │   └── index.ts
│   └── index.ts                   #   Barrel exports
│
├── enterprise/                    # Layer 3: B2B platform
│   └── index.ts                   #   Re-exports from platform/
│
├── platform/                      # Enterprise implementation
│   ├── tenant-manager.ts
│   ├── tenant-middleware.ts
│   ├── rate-limiter.ts
│   └── types.ts
│
├── shared/                        # Cross-cutting concerns
│   └── feature-flags.ts
│
└── (backward-compat re-exports)   # Old file locations still work
    ├── calculations.ts            #   → product/analysis/calculations
    ├── claude.ts                  #   → core/providers/claude-provider
    ├── openai.ts                  #   → core/providers/openai-provider
    └── financial-analysis-agent.ts #  → product/analysis/financial-analysis-agent
```

## Migration Guide

Old imports continue to work via re-exports. New code should use the layered paths:

```typescript
// OLD (still works, but deprecated)
import { FinancialAnalysisAgent } from '@/lib/financial-analysis-agent';
import { calculateAnalysis } from '@/lib/calculations';

// NEW (preferred)
import { FinancialAnalysisAgent, calculateAnalysis } from '@/lib/product';

// For core framework (building new agents)
import { BaseAgent, callClaude, callOpenAI } from '@/lib/core';
import type { Message, FallbackConfig } from '@/lib/core';

// For enterprise features
import { withTenantAuth, tenantManager } from '@/lib/enterprise';
import type { TenantConfig } from '@/lib/enterprise';
```
