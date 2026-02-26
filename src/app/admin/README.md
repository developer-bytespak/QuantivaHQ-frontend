# VC Pool Admin (Phase 1A)

Admin panel for VC Pool — separate from user auth. Uses backend routes under `/admin`. UI matches main app: sidebar, top bar, orange gradient cards.

## Routes

- **`/admin`** — Redirects to `/admin/dashboard`
- **`/admin/login`** — Admin login (orange gradient card). Redirects to dashboard if already logged in.
- **`/admin/dashboard`** — Protected. Welcome card + quick link to Settings. Placeholder for Pools/Payments.
- **`/admin/settings`** — Protected. Profile card + list: Binance UID, Default Fees (links to sub-pages).
- **`/admin/settings/binance`** — Binance UID form. Back to Settings.
- **`/admin/settings/fees`** — Default fee % and payment window form. Back to Settings.

## Auth

- Tokens stored in `localStorage`: `quantivahq_admin_access_token`, `quantivahq_admin_refresh_token`
- No overlap with user tokens (`quantivahq_access_token`, etc.)
- `AdminGuard` protects non-login admin routes; login page uses `publicOnly` (redirects to settings if already logged in)

## API client

- **`@/lib/api/vcpool-admin`** — `adminLogin`, `adminRefresh`, `adminLogout`, `adminMe`, `adminGetSettings`, `adminUpdateBinance`, `adminUpdateFees`
- Base URL: `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3000`)
- All admin paths prefixed with `/admin`

## Theme

Uses app theme: `--color-background`, `--color-foreground`, `--color-surface`, `--color-border`, `var(--accent)`.

## How to test

1. Start backend: `cd q_nest && npm run start:dev`
2. Seed an admin (see `quantiva_backend/VC_pool_PHASE_1A_DONE.md`)
3. Start frontend: `npm run dev` (port 3001)
4. Open `http://localhost:3001/admin/login` — sign in with admin email/password
5. You should land on `/admin/settings`. Update Binance UID and fee defaults, then Save. Log out and log in again to confirm.
