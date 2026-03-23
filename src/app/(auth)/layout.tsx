"use client";

import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/common/auth-guard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Only sign-up page should be accessible without authentication
  // All other onboarding pages require authentication
  const isSignUpPage = pathname?.includes("/onboarding/sign-up");
  const isVerify2FAPage = pathname?.includes("/onboarding/verify-2fa");
  
  // Pages that don't require authentication
  const publicPages = isSignUpPage || isVerify2FAPage;

  return (
    <div className="relative flex h-screen overflow-hidden bg-[--color-background] text-[--color-foreground]">
      <main className="flex flex-1 flex-col overflow-hidden w-full">
        {publicPages ? (
          // Sign-up and verify-2fa pages are public (no auth required)
          children
        ) : (
          // All other onboarding pages require authentication
          <AuthGuard redirectTo="/onboarding/sign-up?tab=login">
            {children}
          </AuthGuard>
        )}
      </main>
    </div>
  );
}
