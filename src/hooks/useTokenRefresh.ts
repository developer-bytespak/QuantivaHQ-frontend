/**
 * Hook for managing automatic token refresh before expiration
 * This prevents the token from expiring during active user sessions
 */

import { useEffect, useRef } from 'react';
import { authService } from '@/lib/auth/auth.service';

/**
 * Decode JWT token to extract payload
 */
function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return false; // If we can't decode, assume it's valid
  }
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() > expirationTime;
}

/**
 * Get time until token expires (in milliseconds)
 */
function getTimeUntilExpiry(token: string): number | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  return expirationTime - Date.now();
}

/**
 * Hook to automatically refresh token before it expires
 * Refreshes token when it has ~5 minutes remaining
 */
export function useTokenRefresh() {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    const scheduleTokenRefresh = () => {
      // Clear any existing timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      const accessToken = localStorage.getItem('quantivahq_access_token');

      // If no token, stop scheduling
      if (!accessToken) {
        return;
      }

      // Check if token is already expired
      if (isTokenExpired(accessToken)) {
        console.warn('[TokenRefresh] Token already expired, attempting refresh');
        authService
          .refresh()
          .then(() => {
            console.info('[TokenRefresh] Token refreshed successfully');
            // Reschedule after refresh
            scheduleTokenRefresh();
          })
          .catch((error) => {
            console.error('[TokenRefresh] Failed to refresh token:', error);
          });
        return;
      }

      // Get time until expiry
      const timeUntilExpiry = getTimeUntilExpiry(accessToken);

      if (timeUntilExpiry === null) {
        console.warn('[TokenRefresh] Could not determine token expiry');
        return;
      }

      // Refresh when 5 minutes remaining (300000 ms)
      const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

      if (timeUntilExpiry <= REFRESH_THRESHOLD) {
        // Token expires soon, refresh immediately
        console.info('[TokenRefresh] Token expiring soon, refreshing now');
        authService
          .refresh()
          .then(() => {
            console.info('[TokenRefresh] Token refreshed successfully');
            // Reschedule after refresh
            scheduleTokenRefresh();
          })
          .catch((error) => {
            console.error('[TokenRefresh] Failed to refresh token:', error);
          });
      } else {
        // Schedule refresh for when threshold is reached
        const timeUntilRefresh = timeUntilExpiry - REFRESH_THRESHOLD;
        console.info(
          `[TokenRefresh] Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`
        );

        refreshTimeoutRef.current = setTimeout(() => {
          console.info('[TokenRefresh] Time to refresh token');
          authService
            .refresh()
            .then(() => {
              console.info('[TokenRefresh] Token refreshed successfully');
              // Reschedule after refresh
              scheduleTokenRefresh();
            })
            .catch((error) => {
              console.error('[TokenRefresh] Failed to refresh token:', error);
              // Try again in 1 minute if refresh fails
              refreshTimeoutRef.current = setTimeout(scheduleTokenRefresh, 60000);
            });
        }, timeUntilRefresh);
      }

      // Also check periodically (every minute) in case localStorage is updated externally
      refreshIntervalRef.current = setInterval(() => {
        const currentToken = localStorage.getItem('quantivahq_access_token');
        if (currentToken !== accessToken) {
          // Token was updated externally, reschedule
          console.info('[TokenRefresh] Token was updated externally, rescheduling');
          scheduleTokenRefresh();
        }
      }, 60000); // Check every minute
    };

    scheduleTokenRefresh();

    return () => {
      // Cleanup
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);
}

/**
 * Hook to log when token will expire (development only)
 */
export function useTokenExpiryMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return;
    }

    const accessToken = localStorage.getItem('quantivahq_access_token');
    if (!accessToken) {
      return;
    }

    const timeUntilExpiry = getTimeUntilExpiry(accessToken);
    if (timeUntilExpiry) {
      const minutes = Math.round(timeUntilExpiry / 1000 / 60);
      const seconds = Math.round((timeUntilExpiry / 1000) % 60);
      console.info(
        `[TokenMonitor] Token expires in: ${minutes}m ${seconds}s`
      );
    }

    const isExpired = isTokenExpired(accessToken);
    if (isExpired) {
      console.warn('[TokenMonitor] Token is EXPIRED');
    }
  }, []);
}
