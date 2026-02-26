"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/lib/auth/auth.service";
import { getUserProfile } from "@/lib/api/user";
import { useMobileNav } from "@/hooks/useMobileNav";
import { SubscriptionBadge } from "@/components/common/subscription-badge";
import { useExchange } from "@/context/ExchangeContext";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/market": "Market Overview",
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

// Mobile Menu Button Component
function MobileMenuButton() {
  const { isOpen, toggle } = useMobileNav();

  return (
    <button
      onClick={toggle}
      className="sm:hidden flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-white/[0.07] to-transparent border border-[#fc4f02]/30 hover:border-[#fc4f02]/50 transition-all"
      aria-label="Toggle menu"
    >
      <svg
        className="h-6 w-6 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {isOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
  );
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
      } catch (error: any) {
        // Fallback: Try getCurrentUser if getUserProfile fails
        try {
          const { getCurrentUser } = await import("@/lib/api/user");
          const user = await getCurrentUser();
          setUserName(user.username || "User");
          setUserInitial((user.username || "User").charAt(0).toUpperCase());
          const savedImage = localStorage.getItem("quantivahq_profile_image");
          setProfileImage(savedImage);
        } catch (fallbackError) {
          // Final fallback to localStorage if all API calls fail
          console.warn("Failed to load profile from API, using localStorage:", error);
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
          className="flex items-center gap-2 sm:gap-3 rounded-lg border border-[#fc4f02]/30 bg-gradient-to-br from-white/[0.07] to-transparent px-2 sm:px-3 py-1.5 sm:py-2 transition-all duration-200 hover:border-[#fc4f02]/50 hover:from-white/[0.1] hover:to-transparent cursor-pointer"
        >
          <div className="flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#fc4f02]/30">
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
          <div className="hidden sm:flex items-center min-w-0">
            <p className="truncate text-xs sm:text-sm font-semibold text-white">{userName}</p>
          </div>
          <svg
            className={`h-3 w-3 sm:h-4 sm:w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
          className="fixed z-[100] w-24 sm:w-28 md:w-32 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] p-1.5 sm:p-2 shadow-2xl shadow-black/50"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
          }}
        >
          <div className="space-y-0.5 sm:space-y-1">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition-all duration-200 hover:bg-white/10 hover:shadow-sm"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5 transition-colors text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  const pathname = usePathname();
  const { hasBothConnections, selectedDashboardType, setSelectedDashboardType } = useExchange();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  // Only show on dashboard routes
  const isDashboardRoute = pathname?.startsWith("/dashboard") ?? false;
  const shouldShow = hasBothConnections && isDashboardRoute;

  useEffect(() => {
    if (isOpen && headingRef.current) {
      const updatePosition = () => {
        if (headingRef.current) {
          const headingRect = headingRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: headingRect.bottom + 8,
            left: headingRect.left,
          });
        }
      };
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen, headingRef]);

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

  if (!shouldShow) return null;

  const options: { type: "crypto" | "stocks"; label: string; icon: React.ReactNode }[] = [
    {
      type: "crypto",
      label: "Crypto",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.5 8h4a1.5 1.5 0 010 3H9.5V8zM9.5 11h5a1.5 1.5 0 010 3H9.5v-3zM12 6v2M12 16v2M9 17h6M9 7h6" />
        </svg>
      ),
    },
    {
      type: "stocks",
      label: "Stocks",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-[#fc4f02]/30 bg-gradient-to-br from-white/[0.07] to-transparent px-2.5 py-1 sm:px-3 sm:py-1.5 transition-all duration-200 hover:border-[#fc4f02]/50 hover:from-white/[0.1] hover:to-transparent cursor-pointer"
      >
        <span className="text-xs sm:text-sm font-medium text-slate-300">
          {selectedDashboardType === "stocks" ? "Stocks" : "Crypto"}
        </span>
        <svg
          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && dropdownPosition && typeof window !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[100] w-44 sm:w-48 rounded-xl border border-[#fc4f02]/20 bg-[--color-surface-alt] p-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          {options.map((option) => {
            const isActive = selectedDashboardType === option.type;
            return (
              <button
                key={option.type}
                onClick={() => {
                  setSelectedDashboardType(option.type);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[#fc4f02]/15 text-[#fc4f02]"
                    : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span className={isActive ? "text-[#fc4f02]" : "text-slate-400"}>{option.icon}</span>
                <span>{option.label}</span>
                {isActive && (
                  <svg className="ml-auto h-4 w-4 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
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
    <header className="sticky top-0 z-50 flex h-16 sm:h-20 lg:h-24 items-center justify-between gap-2 sm:gap-4 lg:gap-8 border-b border-[#fc4f02]/30 bg-[--color-surface-alt] px-3 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 sm:gap-3 relative min-w-0">
        <h1 ref={headingRef} className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{pageTitle}</h1>
        <DashboardSwitcher headingRef={headingRef} />
      </div>
      <div className="flex items-center gap-2 sm:gap-3 sm:gap-4">
        <SubscriptionBadge />
        <MobileMenuButton />
        <UserProfileSection />
      </div>
    </header>
  );
}
