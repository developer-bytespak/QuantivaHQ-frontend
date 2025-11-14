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
    title: "Overview",
    items: [
      { label: "Main Dashboard", href: "/dashboard" },
      { label: "Market Screener", href: "/dashboard/screener" },
      { label: "Watchlist", href: "/dashboard/watchlist" },
      { label: "Quick Trade", href: "/dashboard/quick-trade" },
      { label: "Profit Heatmap", href: "/dashboard/heatmap" },
    ],
  },
  {
    title: "AI Trading",
    items: [
      { label: "Strategy Mode", href: "/ai/strategy-mode" },
      { label: "Setup Wizard", href: "/ai/setup" },
      { label: "Strategy Parameters", href: "/ai/parameters" },
      { label: "Trade Confirmation", href: "/ai/confirm" },
      { label: "Execution", href: "/ai/execution" },
      { label: "Results", href: "/ai/results" },
    ],
  },
  {
    title: "Sentiment & News",
    items: [
      { label: "Real-time News", href: "/sentiment/news" },
      { label: "Sentiment Scoring", href: "/sentiment/scoring" },
      { label: "Source Reliability", href: "/sentiment/sources" },
      { label: "AI Summary", href: "/sentiment/summary" },
      { label: "Correlation Table", href: "/sentiment/correlation" },
    ],
  },
  {
    title: "Charts & Analysis",
    items: [
      { label: "Advanced Chart", href: "/charts/advanced" },
      { label: "Indicator Hub", href: "/charts/indicators" },
      { label: "Multi-timeframe", href: "/charts/timeframes" },
      { label: "Volume Heatmap", href: "/charts/volume" },
      { label: "Prediction Overlay", href: "/charts/prediction" },
    ],
  },
  {
    title: "Portfolio",
    items: [
      { label: "Portfolio Dashboard", href: "/portfolio" },
      { label: "Risk Analyzer", href: "/portfolio/risk" },
      { label: "Trade History", href: "/portfolio/history" },
      { label: "Deposit / Withdraw", href: "/portfolio/funding" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Follow Traders", href: "/community/follow" },
      { label: "Strategy Marketplace", href: "/community/marketplace" },
      { label: "Copy Trading", href: "/community/copy-trading" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Profile Settings", href: "/settings/profile" },
      { label: "Subscription", href: "/settings/subscription" },
      { label: "AI Preferences", href: "/settings/ai" },
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
