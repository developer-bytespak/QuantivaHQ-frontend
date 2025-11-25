# Navigation Fixes

## Changes Implemented

### Back Button Logic Update
Updated `src/components/common/back-button.tsx` to correctly handle the branched onboarding flow between Crypto and Stock exchanges.

- **Stock Exchange Page**: Explicitly set the previous page to `/onboarding/account-type` when on `/onboarding/stock-exchange`.
- **Crypto Exchange Page**: Explicitly set the previous page to `/onboarding/account-type` when on `/onboarding/crypto-exchange`.
- **API Key Tutorial Page**: Added logic to check `localStorage` for `quantivahq_account_type`.
    - If "stocks", back button navigates to `/onboarding/stock-exchange`.
    - Otherwise (default/crypto), back button navigates to `/onboarding/crypto-exchange`.

This ensures that users are not redirected to the welcome page when navigating back from the exchange selection or tutorial pages, preserving the correct onboarding context.
