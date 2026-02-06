"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/lib/auth/auth.service";

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = "/onboarding/sign-up?tab=login" }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // First check if access token exists in localStorage
        const token = typeof window !== "undefined" ? localStorage.getItem("quantivahq_access_token") : null;
        
        if (!token) {
          // No token = not authenticated
          if (isMounted) {
            setIsAuthenticated(false);
            setIsChecking(false);
            router.push(redirectTo);
          }
          return;
        }
        
        // Check if user has active session by calling /auth/me
        await authService.getCurrentUser();
        
        // If successful, user has active session
        if (isMounted) {
          setIsAuthenticated(true);
          setIsChecking(false);
        }
      } catch (error: any) {
        // Check if this is a network/CORS error vs actual auth failure
        const isNetworkError = 
          error?.message?.includes('fetch') ||
          error?.message?.includes('network') ||
          error?.message?.includes('CORS') ||
          error?.code === 'ECONNREFUSED' ||
          error?.code === 'ERR_NETWORK';
        
        // If it's a network error, don't redirect - might be temporary
        // Only redirect on actual 401/403 auth errors
        const isAuthError = 
          error?.status === 401 ||
          error?.status === 403 ||
          error?.statusCode === 401 ||
          error?.statusCode === 403 ||
          error?.response?.status === 401 ||
          error?.response?.status === 403;
        
        if (isMounted) {
          if (isNetworkError && !isAuthError) {
            // Network error - log but don't redirect, allow page to render
            console.warn('[AuthGuard] Network error checking auth, allowing page to render:', error);
            setIsAuthenticated(true); // Assume authenticated to prevent redirect loop
            setIsChecking(false);
          } else if (isAuthError) {
            // Actual auth error - redirect to login
            setIsAuthenticated(false);
            setIsChecking(false);
            
            // Store the current path so we can redirect back after login
            // Only store if it's a dashboard route (not auth routes)
            if (pathname && pathname.startsWith('/dashboard')) {
              const returnTo = encodeURIComponent(pathname);
              // Store in sessionStorage (cleared on tab close) to preserve during redirect
              sessionStorage.setItem('quantivahq_return_to', returnTo);
            }
            
            // Redirect to login page
            router.push(redirectTo);
          } else {
            // Unknown error - be conservative and allow page to render
            console.warn('[AuthGuard] Unknown error checking auth, allowing page to render:', error);
            setIsAuthenticated(true);
            setIsChecking(false);
          }
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router, redirectTo, pathname]);

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

