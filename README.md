# QuantivaHQ Frontend Blueprint

## Overview
QuantivaHQ is a Next.js 14 (App Router) application that delivers a 40-screen trading intelligence experience spanning onboarding/KYC, AI trading automation, sentiment intelligence, charts, portfolio, community, and settings. This repository contains the full route scaffold, shared UI shell, and state/data foundations to begin implementing the production UI.

## Quick Start
1. Install dependencies (includes `zustand` + `zod` for state/validation):
   ```bash
   npm install
   ```
2. Launch the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` to explore the interactive blueprint.

## Project Structure
```
src/
  app/
    (auth)/               # Onboarding + KYC flow (11 screens)
      onboarding/
        splash/ ...        # Splash, welcome, region, risk, etc.
      layout.tsx
      loading.tsx
      error.tsx
    (dashboard)/          # Authenticated shell (31 screens)
      dashboard/ ...       # Core trading screens
      ai/ ...              # AI trading flows
      sentiment/ ...       # News & sentiment intelligence
      charts/ ...          # Charts & analytics suite
      portfolio/ ...       # Portfolio & performance
      community/ ...       # Social & copy trading
      settings/ ...        # Profile + AI preferences
      layout.tsx
      loading.tsx
      error.tsx
    layout.tsx             # Root layout w/ global theming
    page.tsx               # Marketing hero to start onboarding
  components/
    common/                # `ScreenScaffold` placeholder component
    layout/                # Logo, sidebar, top bar
  config/                  # Navigation maps for sidebar/onboarding
  lib/
    api/                   # API placeholders
    forms/                 # Helpers that bridge validation + state
    mock-data/             # Dashboard mock positions/signals
    validation/            # Zod schemas for onboarding forms
    visualization/         # Chart overlay helpers
    news-feed.ts           # Sentiment summarization utilities
  state/                   # Zustand stores for onboarding, session, trading
```

## Shared Systems
- **Design tokens** defined in `app/globals.css` provide brand-ready dark/light palettes, typography, and radii.
- **Layout shell** (`components/layout`) delivers the navigation sidebar, top bar, and responsive scaffolding reused across dashboard routes.
- **State management** uses `zustand`:
  - `state/onboarding-store.ts` keeps track of step progress and selections.
  - `state/session-store.ts` stores preferences and subscription tier.
  - `state/trading-store.ts` hydrates dashboard widgets with placeholder data.
- **Validation** via `zod` in `lib/validation/onboarding.ts` plus helpers in `lib/forms/onboarding.ts`.
- **Mock data** lives under `lib/mock-data` to demonstrate future API wiring.

## Implementation Notes
- Route placeholders consume the `ScreenScaffold` component so teams can swap in real UI incrementally.
- Add real data fetching by replacing `lib/api/client.ts` with production HTTP logic and wiring stores to React Query/SWR as needed.
- Update the navigation map (`config/navigation.ts`) if routes evolve; the sidebar picks up changes automatically.

## Next Steps
- Connect forms to API layer and wire actual submissions.
- Replace placeholder sections with high-fidelity components from the design system.
- Integrate charting/sentiment services (TradingView, custom WebSockets, etc.).
- Implement authentication and session management, plugging into `useSessionStore` for global availability.

For deployment, follow QuantivaHQ’s manual release process (no automated deploys in this repo).
