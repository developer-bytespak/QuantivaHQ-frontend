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
      { label: "Top trades", href: "/dashboard/top-trades" },
      { label: "AI insights", href: "/dashboard/ai-insights" },
      { label: "VC pool", href: "/dashboard/vc-pool" },
      { label: "Profile", href: "/dashboard/profile" },
    ],
  },
];

export const STOCKS_DASHBOARD_NAV: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/stocks-dashboard" },
      { label: "Top trades", href: "/stocks-dashboard/top-trades" },
      { label: "AI insights", href: "/stocks-dashboard/ai-insights" },
      { label: "Holdings", href: "/stocks-dashboard/holdings" },
      { label: "Profile", href: "/stocks-dashboard/profile" },
    ],
  },
];

export const AUTH_STEPS: NavItem[] = [
  { label: "Splash", href: `${onboardingBase}/splash` },
  { label: "Welcome", href: `${onboardingBase}/welcome` },
  { label: "Region", href: `${onboardingBase}/region` },
  { label: "Risk Disclosure", href: `${onboardingBase}/risk-disclosure` },
  { label: "Account Type", href: `${onboardingBase}/account-type` },
  { label: "Sign Up", href: `${onboardingBase}/sign-up` },
  { label: "Personal Info", href: `${onboardingBase}/personal-info` },
  { label: "Proof Upload", href: `${onboardingBase}/proof-upload` },
  { label: "Selfie Capture", href: `${onboardingBase}/selfie-capture` },
  { label: "Verification Status", href: `${onboardingBase}/verification-status` },
  { label: "Experience", href: `${onboardingBase}/experience` },
  { label: "API Setup", href: `${onboardingBase}/api-setup` },
];
