"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth/auth.service";

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = "/onboarding/sign-up?tab=login" }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // Check if user has active session by calling /auth/me
        await authService.getCurrentUser();
        
        // If successful, user has active session
        if (isMounted) {
          setIsAuthenticated(true);
          setIsChecking(false);
        }
      } catch (error: any) {
        // If 401 or any auth error, user has no active session
        if (isMounted) {
          setIsAuthenticated(false);
          setIsChecking(false);
          
          // Redirect to login page
          router.push(redirectTo);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router, redirectTo]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[--color-background]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[--color-primary] border-t-transparent mx-auto"></div>
          <p className="text-sm text-[--color-foreground]/60">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated, don't render anything (redirect is happening)
  return null;
}

