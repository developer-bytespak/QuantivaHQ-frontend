/**
 * Hook for managing automatic token refresh with activity tracking
 * Only refreshes tokens if user has been active recently
 * Logs out inactive users for security
 */

import { useEffect, useRef, useCallback } from 'react';
import { authService } from '@/lib/auth/auth.service';

// Inactivity timeout: 30 minutes (1800000 ms)
// If user is inactive for 30 minutes, they will be logged out
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Refresh threshold: Refresh token when 5 minutes remaining
const REFRESH_THRESHOLD = 5 * 60 * 1000;

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
    console.error('[TokenRefresh] Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return false;
  }
  const expirationTime = payload.exp * 1000;
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
  const expirationTime = payload.exp * 1000;
  return expirationTime - Date.now();
}

/**
 * Hook to automatically refresh token before it expires
 * ONLY refreshes if user has been active within the inactivity timeout
 * Logs out inactive users for security
 */
export function useTokenRefresh() {
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (process.env.NODE_ENV === 'development') {
      console.debug('[TokenRefresh] User activity detected');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Activity event listeners
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity updates to once per 10 seconds
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledUpdateActivity = () => {
      if (!throttleTimer) {
        updateActivity();
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
        }, 10000);
      }
    };

    // Add activity listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, throttledUpdateActivity, { passive: true });
    });

    const scheduleTokenRefresh = () => {
      // Clear existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      const accessToken = localStorage.getItem('quantivahq_access_token');

      if (!accessToken) {
        return;
      }

      // Check if token is already expired
      if (isTokenExpired(accessToken)) {
        console.warn('[TokenRefresh] Token already expired, attempting refresh');
        authService
          .refresh()
          .then((response) => {
            console.info('[TokenRefresh] Token refreshed successfully');
            if (response.accessToken) {
              localStorage.setItem('quantivahq_access_token', response.accessToken);
            }
            if (response.refreshToken) {
              localStorage.setItem('quantivahq_refresh_token', response.refreshToken);
            }
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

      if (timeUntilExpiry <= REFRESH_THRESHOLD) {
        // Token expires soon, check activity before refreshing
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;

        if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
          // User has been inactive too long, log them out
          console.warn(
            `[TokenRefresh] User inactive for ${Math.round(timeSinceLastActivity / 1000 / 60)} minutes, logging out`
          );
          authService.logout();
          return;
        }

        // User is active, refresh token
        console.info('[TokenRefresh] Token expiring soon, refreshing now');
        authService
          .refresh()
          .then((response) => {
            console.info('[TokenRefresh] Token refreshed successfully');
            if (response.accessToken) {
              localStorage.setItem('quantivahq_access_token', response.accessToken);
            }
            if (response.refreshToken) {
              localStorage.setItem('quantivahq_refresh_token', response.refreshToken);
            }
            scheduleTokenRefresh();
          })
          .catch((error) => {
            console.error('[TokenRefresh] Failed to refresh token:', error);
          });
      } else {
        // Schedule refresh for when threshold is reached
        const timeUntilRefresh = timeUntilExpiry - REFRESH_THRESHOLD;
        const minutesUntilRefresh = Math.round(timeUntilRefresh / 1000 / 60);
        console.info(`[TokenRefresh] Scheduled refresh in ${minutesUntilRefresh} minutes`);

        refreshTimeoutRef.current = setTimeout(() => {
          // Check activity before refreshing
          const timeSinceLastActivity = Date.now() - lastActivityRef.current;

          if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
            // User has been inactive too long, log them out
            console.warn(
              `[TokenRefresh] User inactive for ${Math.round(timeSinceLastActivity / 1000 / 60)} minutes, logging out`
            );
            authService.logout();
            return;
          }

          // User is active, refresh token
          console.info('[TokenRefresh] Time to refresh token');
          authService
            .refresh()
            .then((response) => {
              console.info('[TokenRefresh] Token refreshed successfully');
              if (response.accessToken) {
                localStorage.setItem('quantivahq_access_token', response.accessToken);
              }
              if (response.refreshToken) {
                localStorage.setItem('quantivahq_refresh_token', response.refreshToken);
              }
              scheduleTokenRefresh();
            })
            .catch((error) => {
              console.error('[TokenRefresh] Failed to refresh token:', error);
              // Try again in 1 minute if refresh fails
              refreshTimeoutRef.current = setTimeout(scheduleTokenRefresh, 60000);
            });
        }, timeUntilRefresh);
      }
    };

    // Check for inactivity every minute
    activityCheckIntervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      const accessToken = localStorage.getItem('quantivahq_access_token');

      if (accessToken && timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        console.warn(
          `[TokenRefresh] User inactive for ${Math.round(timeSinceLastActivity / 1000 / 60)} minutes, logging out`
        );
        authService.logout();
      }
    }, 60000); // Check every minute

    scheduleTokenRefresh();

    return () => {
      // Cleanup
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, throttledUpdateActivity);
      });
    };
  }, [updateActivity]);
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
      console.info(`[TokenMonitor] Token expires in: ${minutes}m ${seconds}s`);
    }

    const isExpired = isTokenExpired(accessToken);
    if (isExpired) {
      console.warn('[TokenMonitor] Token is EXPIRED');
    }
  }, []);
}
