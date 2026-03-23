# Google Login vs Signup – Frontend Split (Keep / Undo)

## Summary

- **Login (existing account):** "Login" tab → Google button → `POST /auth/google`. Backend returns 401 "Your account does not exist. Please sign up first." if user not found.
- **Signup (new account):** "Sign Up" tab → Google button → `POST /auth/signup/google`. Backend returns 409 "Account already exists. Please login." if user already exists.

## Files changed

| File | Change |
|------|--------|
| `src/components/common/google-signin-button.tsx` | Added `mode?: "login" \| "signup"`; uses `/auth/google` when `mode === "login"`, `/auth/signup/google` when `mode === "signup"`. Uses ref so current tab is used when user clicks. |
| `src/app/(auth)/onboarding/sign-up/page.tsx` | Passes `mode={activeTab === "signup" ? "signup" : "login"}` to `<GoogleSignInButton />`. |

## Keep (current behavior)

No action. Frontend is already using the split.

## Undo (revert to single endpoint)

1. **google-signin-button.tsx**
   - Remove `mode` and `modeRef` from props/component.
   - In the API call, set `path: "/auth/google"` (always) and remove the `isSignup` / `path` variable.

2. **sign-up/page.tsx**
   - Change back to: `<GoogleSignInButton />` (remove the `mode={...}` prop).

After undo, both tabs will call `POST /auth/google` again (backend must support that if you keep this).
