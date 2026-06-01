import { NextResponse, type NextRequest } from "next/server";

/**
 * Affiliate referral cookie capture.
 *
 * When a visitor lands on any public/marketing route with `?ref=<code>`, set
 * a 30-day `quantivahq_affiliate_ref` cookie. The signup page reads this cookie
 * and includes the value as `referralCode` in its `/auth/register` POST so the
 * backend can attribute the new user to an approved affiliate.
 *
 * Last-touch attribution: a fresh `?ref=` overwrites any existing cookie.
 *
 * This middleware never contacts the backend — there is no click logging.
 */

const REF_COOKIE = "quantivahq_affiliate_ref";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Accept alphanumeric, dash, underscore. Anything else is treated as malformed
// and silently ignored — better than persisting a junk cookie.
const CODE_PATTERN = /^[A-Za-z0-9_\-]+$/;
const CODE_MAX_LENGTH = 60;

export function middleware(request: NextRequest) {
  const rawRef = request.nextUrl.searchParams.get("ref");
  if (!rawRef) {
    return NextResponse.next();
  }

  const code = rawRef.trim().slice(0, CODE_MAX_LENGTH);
  if (!CODE_PATTERN.test(code)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(REF_COOKIE, code, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    // Non-httpOnly so the client-side signup form can read it and include it
    // in the register POST body. The value is just a public referral code, not
    // sensitive data — it's printed in YouTube descriptions etc.
    httpOnly: false,
  });
  return response;
}

export const config = {
  matcher: [
    // Run on every route except API, Next internals, and static assets.
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
