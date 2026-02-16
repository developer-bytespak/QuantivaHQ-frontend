"use client";

import React from 'react';
import { useTokenRefresh, useTokenExpiryMonitor } from '@/hooks/useTokenRefresh';

/**
 * TokenRefreshProvider component
 * Manages automatic token refresh and activity tracking for the entire app
 * Should wrap the entire application in the root layout
 */
function TokenRefreshManager() {
  // Start token refresh monitoring
  useTokenRefresh();
  
  // Monitor token expiry in development
  useTokenExpiryMonitor();

  // This component doesn't render anything, it just manages token refresh
  return null;
}

export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TokenRefreshManager />
      {children}
    </>
  );
}
