import { SidebarSection } from "@/components/layout/sidebar";

type NavItem = {
  label: string;
  href: string;
  description?: string;
};

type NavSection = SidebarSection;

const onboardingBase = "/onboarding";

export const DASHBOARD_NAV: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Market", href: "/dashboard/market" },
      { label: "Top trades", href: "/dashboard/top-trades" },
      { label: "AI insights", href: "/dashboard/ai-insights" },
      { label: "VC pool", href: "/dashboard/vc-pool" },
      { label: "Paper Trading", href: "/dashboard/paper-trading" },
      { label: "Profile", href: "/dashboard/profile" },
    ],
  },
];

// Legacy export for backward compatibility - now points to unified dashboard
export const STOCKS_DASHBOARD_NAV: NavSection[] = DASHBOARD_NAV;

export const AUTH_STEPS: NavItem[] = [
  { label: "Splash", href: `${onboardingBase}/splash` },
  { label: "Account Type", href: `${onboardingBase}/account-type` },
  { label: "Sign Up", href: `${onboardingBase}/sign-up` },
  { label: "Personal Info", href: `${onboardingBase}/personal-info` },
  { label: "Identity Verification", href: `${onboardingBase}/kyc-verification` },
  { label: "Verification Status", href: `${onboardingBase}/verification-status` },
  { label: "Experience", href: `${onboardingBase}/experience` },
  { label: "API Setup", href: `${onboardingBase}/api-setup` },
];
