"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/lib/auth/auth.service";
import { getUserProfile } from "@/lib/api/user";

const pageTitles: Record<string, string> = {
  "/dashboard": "Crypto Dashboard",
  "/dashboard/top-trades": "Top Trades",
  "/dashboard/ai-insights": "AI Insights",
  "/dashboard/vc-pool": "VC Pool",
  "/dashboard/profile": "Profile",
  "/dashboard/screener": "Market Screener",
  "/dashboard/settings": "Settings",
  "/dashboard/settings/tokenomics": "Tokenomics",
  "/dashboard/settings/bank-details": "Bank Details",
  "/dashboard/settings/notifications": "Notifications",
  "/dashboard/settings/security": "Security",
  "/dashboard/settings/help-support": "Help and Support",
  "/dashboard/settings/terms": "Terms and Conditions",
  "/stocks-dashboard": "Stocks Dashboard",
  "/stocks-dashboard/top-trades": "Top Trades",
  "/stocks-dashboard/ai-insights": "AI Insights",
  "/stocks-dashboard/holdings": "My Holdings",
  "/stocks-dashboard/trade-opportunities": "Trade Opportunities",
  "/stocks-dashboard/profile": "Profile",
  "/ai/strategy-mode": "Strategy Mode",
  "/sentiment/news": "Live News",
  "/charts/advanced": "Advanced Charts",
};

function getPageTitle(pathname: string | null): string {
  if (!pathname) return "Dashboard";

  // Check for exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  // Check for paths that start with known paths
  const matchedPath = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length) // Sort by length descending to match longest first
    .find((path) => pathname.startsWith(path));

  if (matchedPath) {
    return pageTitles[matchedPath];
  }

  // Fallback: format the pathname
    const segments = pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.replace(/-/g, " "));
  return segments.length > 0
    ? segments[segments.length - 1].replace(/\b\w/g, (l) => l.toUpperCase())
    : "Dashboard";
}

// User Profile Component
function UserProfileSection() {
  const [userName, setUserName] = useState<string>("User");
  const [userInitial, setUserInitial] = useState<string>("U");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadProfileData = async () => {
    if (typeof window !== "undefined") {
      try {
        // Try to get profile from API first (includes profile_pic_url)
        const profile = await getUserProfile();
        setUserName(profile.full_name || profile.username || "User");
        setUserInitial((profile.full_name || profile.username || "User").charAt(0).toUpperCase());
        
        // Use profile_pic_url from API if available
        if (profile.profile_pic_url) {
          setProfileImage(profile.profile_pic_url);
        } else {
          // Fallback to localStorage for backward compatibility
          const savedImage = localStorage.getItem("quantivahq_profile_image");
          setProfileImage(savedImage);
        }
      } catch (error) {
        // Fallback to localStorage if API call fails
        console.error("Failed to load profile from API:", error);
        const name = localStorage.getItem("quantivahq_user_name") || "User";
        const savedImage = localStorage.getItem("quantivahq_profile_image");
        setUserName(name);
        setUserInitial(name.charAt(0).toUpperCase());
        if (savedImage) {
          setProfileImage(savedImage);
        } else {
          setProfileImage(null);
        }
      }
    }
  };

  useEffect(() => {
    loadProfileData();

    // Listen for storage changes (when profile image is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "quantivahq_profile_image" || e.key === "quantivahq_user_name") {
        loadProfileData();
      }
    };

    // Listen for custom event (for same-tab updates)
    const handleProfileImageUpdate = () => {
      loadProfileData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("profileImageUpdated", handleProfileImageUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("profileImageUpdated", handleProfileImageUpdate);
    };
  }, []);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 12, // 12px gap to prevent border overlap
        right: window.innerWidth - rect.right,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      // Call backend logout API to revoke session and clear cookies
      await authService.logout();
    } catch (error: any) {
      // Silently handle 401 errors (session already expired) - this is expected
      if (error?.status !== 401 && error?.statusCode !== 401) {
        console.error("Logout API error:", error);
      }
      // Continue with logout even if API call fails
    } finally {
      // Clear all local storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("quantivahq_user_email");
        localStorage.removeItem("quantivahq_user_name");
        localStorage.removeItem("quantivahq_user_id");
        localStorage.removeItem("quantivahq_auth_method");
        localStorage.removeItem("quantivahq_is_authenticated");
        localStorage.removeItem("quantivahq_selected_exchange");
        localStorage.removeItem("quantivahq_personal_info");
        localStorage.removeItem("quantivahq_profile_image");
        localStorage.removeItem("quantivahq_pending_email");
        localStorage.removeItem("quantivahq_pending_password");
        localStorage.removeItem("quantivahq_device_id");
        // Clear sessionStorage as well
        sessionStorage.clear();
        // Redirect to login page
        router.push("/onboarding/sign-up?tab=login");
      }
    }
  };


  return (
    <>
      <div className="relative z-50">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-2 transition-all duration-200 hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt] cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] text-sm font-bold text-white shadow-lg shadow-[#fc4f02]/30">
            {profileImage ? (
              <img
                src={profileImage}
                alt={userName}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              userInitial
            )}
          </div>
          <div className="flex items-center min-w-0">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
          </div>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown Menu - Rendered via Portal */}
      {isOpen && dropdownPosition && typeof window !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[100] w-64 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] p-2 shadow-2xl shadow-black/50"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
          }}
        >
          <div className="space-y-1">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10 hover:shadow-sm"
            >
              <svg className="h-5 w-5 transition-colors text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="transition-colors text-white group-hover:font-semibold">Logout</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function DashboardSwitcher({ headingRef }: { headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasBothAccounts, setHasBothAccounts] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const checkBothAccounts = () => {
    if (typeof window !== "undefined") {
      // Use sessionStorage for UI state flags (cleared on browser close, more secure)
      const cryptoConnected = sessionStorage.getItem("quantivahq_crypto_connected") === "true";
      const stocksConnected = sessionStorage.getItem("quantivahq_stocks_connected") === "true";
      setHasBothAccounts(cryptoConnected && stocksConnected);
    }
  };

  useEffect(() => {
    // Check if both accounts are connected
    checkBothAccounts();

    // Listen for storage changes (works for sessionStorage too)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "quantivahq_crypto_connected" || e.key === "quantivahq_stocks_connected") {
        checkBothAccounts();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Re-check when pathname changes (in case flag was set just before navigation)
  useEffect(() => {
    checkBothAccounts();
  }, [pathname]);

  // Calculate dropdown position - position it below the heading and adjust for sidebar
  useEffect(() => {
    if (isOpen && headingRef.current) {
      const updatePosition = () => {
        if (headingRef.current) {
          const headingRect = headingRef.current.getBoundingClientRect();
          
          // Check if sidebar is expanded by looking for the sidebar element
          const sidebar = document.querySelector('aside[class*="w-[280px]"]');
          const sidebarCollapsed = document.querySelector('aside[class*="w-[80px]"]');
          
          // Determine sidebar width (80px collapsed, 280px expanded)
          let sidebarWidth = 80;
          if (sidebar && !sidebarCollapsed) {
            sidebarWidth = 280;
          }
          
          // Position dropdown just below the heading, aligned with the left edge of the heading
          // Ensure it doesn't collide with sidebar by checking if it would overlap
          const dropdownWidth = 224; // w-56 = 14rem = 224px
          const minLeftPosition = sidebarWidth + 16; // Add some padding
          
          let leftPosition = headingRect.left;
          
          // If dropdown would overlap with sidebar, adjust position
          if (leftPosition < minLeftPosition) {
            leftPosition = minLeftPosition;
          }
          
          setDropdownPosition({
            top: headingRect.bottom + 8,
            left: leftPosition,
          });
        }
      };
      
      // Update position immediately
      updatePosition();
      
      // Use MutationObserver to watch for sidebar class changes (when it expands/collapses)
      const observer = new MutationObserver(() => {
        updatePosition();
      });
      
      // Observe sidebar element for class changes
      const sidebarElement = document.querySelector('aside');
      if (sidebarElement) {
        observer.observe(sidebarElement, {
          attributes: true,
          attributeFilter: ['class'],
        });
      }
      
      // Also observe the document body for any layout changes
      if (document.body) {
        observer.observe(document.body, {
          childList: false,
          subtree: true,
          attributes: true,
          attributeFilter: ['class'],
        });
      }
      
      // Update position on window resize or scroll
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      
      // Use requestAnimationFrame for smooth updates during sidebar hover
      let animationFrameId: number;
      const continuousUpdate = () => {
        updatePosition();
        if (isOpen) {
          animationFrameId = requestAnimationFrame(continuousUpdate);
        }
      };
      animationFrameId = requestAnimationFrame(continuousUpdate);
      
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen, headingRef]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Show switcher only on the main dashboard pages (not sub-pages) when both accounts are connected
  const isCryptoDashboard = pathname === "/dashboard";
  const isStocksDashboard = pathname === "/stocks-dashboard";
  
  if ((!isCryptoDashboard && !isStocksDashboard) || !hasBothAccounts) {
    return null;
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-1.5 transition-all duration-200 hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt] cursor-pointer"
      >
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && dropdownPosition && typeof window !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[100] w-56 rounded-xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-2 shadow-2xl shadow-black/50 backdrop-blur"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            position: 'fixed',
          }}
        >
          {isCryptoDashboard ? (
            <button
              onClick={() => {
                router.push("/stocks-dashboard");
                setIsOpen(false);
              }}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-gradient-to-r hover:from-[#fc4f02]/10 hover:to-[#fda300]/10 hover:border hover:border-[#fc4f02]/30 hover:shadow-sm"
            >
              <svg className="h-5 w-5 text-slate-400 transition-colors group-hover:text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="transition-colors group-hover:text-[#fc4f02] group-hover:font-semibold">Stocks Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => {
                router.push("/dashboard");
                setIsOpen(false);
              }}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-gradient-to-r hover:from-[#fc4f02]/10 hover:to-[#fda300]/10 hover:border hover:border-[#fc4f02]/30 hover:shadow-sm"
            >
              <svg className="h-5 w-5 text-slate-400 transition-colors group-hover:text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="transition-colors group-hover:text-[#fc4f02] group-hover:font-semibold">Crypto Dashboard</span>
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const headingRef = useRef<HTMLHeadingElement>(null);

  return (
    <header className="sticky top-0 z-50 flex h-24 items-center justify-between gap-8 border-b border-[--color-border] bg-[--color-surface-alt]/80 px-8 backdrop-blur">
      <div className="flex items-center gap-3 relative">
        <h1 ref={headingRef} className="text-2xl font-bold text-white">{pageTitle}</h1>
        <DashboardSwitcher headingRef={headingRef} />
      </div>
      <UserProfileSection />
    </header>
  );
}
