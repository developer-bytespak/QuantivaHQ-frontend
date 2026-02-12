/**
 * SUBSCRIPTION SYSTEM - COMPLETE URL GUIDE
 * 
 * All URLs that are NOW AVAILABLE in your app
 * Last Updated: February 11, 2026
 */

// ╔════════════════════════════════════════════════════════════════╗
// ║               🌐 ALL WORKING URLS                              ║
// ╚════════════════════════════════════════════════════════════════╝

/**
 * 🏠 HOMEPAGE - PRICING PAGE
 * 
 * URL: http://localhost:3000/#pricing
 * Component: src/components/homepage/pricing-section.tsx
 * What You See:
 *   • 3 pricing cards: FREE, PRO, ELITE
 *   • Billing period toggle: Monthly/Quarterly/Yearly
 *   • Dynamic prices that update when toggle changes
 *   • Discount badges: -15% (Quarterly), -20% (Yearly)
 *   • Feature checklists for each plan
 *   • "Get Started" buttons
 *   • Current plan badge
 * 
 * Interaction:
 *   ✓ Click Monthly/Quarterly/Yearly buttons
 *   ✓ See prices update in real-time
 *   ✓ See discount percentages
 *   ✓ Click "Get Started" to sign up
 */

/**
 * 📊 DASHBOARD - MAIN DASHBOARD
 * 
 * URL: http://localhost:3000/dashboard
 * What You See:
 *   • Top bar with page title
 *   • ✨ NEW: Subscription badge (shows your tier)
 *   • Sidebar with navigation
 *   • Dashboard content
 * 
 * New Features:
 *   ✓ Subscription badge shows in top bar
 *   ✓ Color coded: Gray (FREE), Orange (PRO), Blue (ELITE)
 *   ✓ Shows "PRO Trial" if in trial
 *   ✓ Warning tooltip if renewal in 3 days
 */

/**
 * ⚙️ DASHBOARD - SETTINGS MAIN PAGE
 * 
 * URL: http://localhost:3000/dashboard/settings
 * What You See:
 *   • User profile edit section
 *   • ✨ NEW: "Subscription Plans" menu item (first item)
 *   • Other settings: Tokenomics, Bank Details, Notifications, etc.
 * 
 * Interaction:
 *   ✓ Click "Subscription Plans" → goes to /dashboard/settings/subscription
 */

/**
 * 💎 DASHBOARD - SUBSCRIPTION SETTINGS (NEW!)
 * 
 * URL: http://localhost:3000/dashboard/settings/subscription
 * Component: src/components/settings/subscription-settings.tsx
 * Status: ✅ FULLY WORKING
 * 
 * What You See: 4 TABS
 * ┌─────────────────────────────────────────────────────────────┐
 * │ TAB 1: CURRENT PLAN                                         │
 * ├─────────────────────────────────────────────────────────────┤
 * │ • Your current plan (FREE/PRO/ELITE)                       │
 * │ • Plan status (Active)                                     │
 * │ • Billing cycle (Monthly/Quarterly/Yearly)               │
 * │ • Current period dates                                    │
 * │ • Next billing date                                       │
 * │ • Days until next billing                                 │
 * │ • Auto-renewal status                                     │
 * │ • Buttons: Upgrade Plan, Manage Auto-Renewal, Cancel      │
 * │ • Trial info (if in trial)                               │
 * │                                                             │
 * │ TAB 2: BILLING HISTORY                                     │
 * ├─────────────────────────────────────────────────────────────┤
 * │ • Payment transactions table                               │
 * │ • Date, Amount, Status                                     │
 * │ • Download invoice/receipt links                           │
 * │ • See payment status (Succeeded/Failed/Pending)            │
 * │ • Failure reasons for failed payments                      │
 * │                                                             │
 * │ TAB 3: USAGE ANALYTICS                                     │
 * ├─────────────────────────────────────────────────────────────┤
 * │ • Feature usage breakdown                                  │
 * │ • Progress bars with percentages                           │
 * │ • Custom Strategies: 3/5 (for PRO)                         │
 * │ • Unlimited for ELITE                                      │
 * │ • Billing period dates                                     │
 * │ • Usage warnings when limits near                          │
 * │                                                             │
 * │ TAB 4: CHANGE PLAN                                         │
 * ├─────────────────────────────────────────────────────────────┤
 * │ • Side-by-side plan comparison                             │
 * │ • Current plan highlighted                                 │
 * │ • Click to select new plan                                 │
 * │ • Proration info                                           │
 * │ • Upgrade/Downgrade buttons                                │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * Interactions:
 *   ✓ Click each tab to switch between
 *   ✓ Click action buttons (Upgrade, Cancel, etc.)
 *   ✓ Download invoices/receipts
 *   ✓ See live progress bars
 */

/**
 * 🏦 DASHBOARD - VC POOL
 * 
 * URL: http://localhost:3000/dashboard/vc-pool
 * Component: src/components/market/vc-pool-section.tsx
 * Status: ✅ WORKS WITH ACCESS CONTROL
 * 
 * FREE User Sees:
 *   🔒 Lock overlay with "Feature Locked" message
 *   📢 Message: "VC Pool Access is exclusively for ELITE"
 *   🔗 "Upgrade Now" button
 * 
 * PRO User Sees:
 *   🔒 Lock overlay with "Feature Locked" message
 *   📢 Message: "VC Pool Access is exclusively for ELITE"
 *   🔗 "Upgrade to ELITE" button
 * 
 * ELITE User Sees:
 *   💰 Investment opportunities list
 *   📊 Funding progress bars
 *   💹 ROI percentages
 *   💵 Total invested, Active pools, Avg ROI stats
 *   🔗 "Invest Now" buttons for each opportunity
 * 
 * Interactions (ELITE):
 *   ✓ View opportunities
 *   ✓ See funding progress
 *   ✓ View ROI and minimum investment
 *   ✓ Click "Invest Now" buttons
 */

/**
 * 🎯 DASHBOARD - TRADING STRATEGIES (NEW!)
 * 
 * URL: http://localhost:3000/dashboard/trading/strategies
 * Component: src/components/trading/custom-strategies-section.tsx
 * Status: ✅ FULLY WORKING
 * 
 * FREE User Sees:
 *   🔒 Lock overlay: "Feature Locked"
 *   📢 "Custom Strategies are only available in"
 *   🔗 "Upgrade to PRO" button
 * 
 * PRO User Sees:
 *   📋 Strategy list (dummy strategies shown)
 *   🔢 Usage indicator: "3/5" (shows you can create 2 more)
 *   📊 Progress bar: 60% used
 *   ⚠️ Warning: "2 strategy slots remaining"
 *   🎯 Strategy cards with:
 *      • Strategy name
 *      • Type (Technical Analysis, Momentum, etc.)
 *      • Status (Active/Paused)
 *      • Win rate
 *      • Total trades
 *   ➕ "+ New Strategy" button (if slots available)
 * 
 * ELITE User Sees:
 *   📋 Strategy list (unlimited)
 *   ♾️ No limit indicator
 *   📊 Progress bar at 100% (or none)
 *   ➕ "+ New Strategy" button (always visible)
 *   🎯 All strategy features available
 *   🎨 Can create unlimited strategies
 * 
 * Interactions:
 *   ✓ View strategy list
 *   ✓ Click "View Details" on strategies
 *   ✓ Click "+ New Strategy" (if allowed)
 *   ✓ See usage progress
 */

/**
 * 📱 DASHBOARD - MARKET OVERVIEW
 * 
 * URL: http://localhost:3000/dashboard/market
 * What You See:
 *   • Cryptocurrency/Stock market data
 *   • Search functionality
 *   • Market tables
 */

/**
 * 🏆 DASHBOARD - TOP TRADES
 * 
 * URL: http://localhost:3000/dashboard/top-trades
 * What You See:
 *   • Top performing trades
 *   • Trade statistics
 */

/**
 * 🤖 DASHBOARD - AI INSIGHTS
 * 
 * URL: http://localhost:3000/dashboard/ai-insights
 * What You See:
 *   • AI-powered trading insights
 *   • Market analysis
 */

/**
 * 👤 DASHBOARD - PROFILE
 * 
 * URL: http://localhost:3000/dashboard/profile
 * What You See:
 *   • User profile information
 *   • Settings link
 */

// ╔════════════════════════════════════════════════════════════════╗
// ║          🎪 GLOBALLY AVAILABLE ON ALL DASHBOARD PAGES          ║
// ╚════════════════════════════════════════════════════════════════╝

/**
 * 1️⃣ SUBSCRIPTION BADGE (Top Bar)
 *    └─ Shows current tier with color:
 *       • Gray = FREE
 *       • Orange = PRO (PRO Trial if trial active)
 *       • Blue = ELITE
 *    └─ Shows warning tooltip if renewal in 3 days
 * 
 * 2️⃣ UPGRADE MODAL
 *    └─ Opens when "Upgrade" button clicked
 *    └─ Billing period selector
 *    └─ Plan options with pricing
 *    └─ "Continue to Payment" button
 * 
 * 3️⃣ CANCEL SUBSCRIPTION MODAL
 *    └─ Opens when "Cancel Subscription" button clicked
 *    └─ Warning message
 *    └─ Feedback form
 *    └─ "Yes, Cancel" confirmation
 * 
 * 4️⃣ PAYMENT MODAL
 *    └─ Opens when "Continue to Payment" clicked
 *    └─ Card details form
 *    └─ Billing address
 *    └─ "Pay Now" button
 */

// ╔════════════════════════════════════════════════════════════════╗
// ║          📍 URL STRUCTURE SUMMARY                              ║
// ╚════════════════════════════════════════════════════════════════╝

// Homepage URLs:
// http://localhost:3000/              → Main page
// http://localhost:3000/#pricing      → Pricing section (scroll)

// Dashboard URLs:
// http://localhost:3000/dashboard     → Main dashboard
// http://localhost:3000/dashboard/market              → Market
// http://localhost:3000/dashboard/top-trades         → Top Trades
// http://localhost:3000/dashboard/ai-insights        → AI Insights
// http://localhost:3000/dashboard/vc-pool            → VC Pool ✨
// http://localhost:3000/dashboard/paper-trading      → Paper Trading
// http://localhost:3000/dashboard/profile            → Profile

// Settings URLs:
// http://localhost:3000/dashboard/settings                    → Settings Menu
// http://localhost:3000/dashboard/settings/subscription       → Subscription ✨ NEW!
// http://localhost:3000/dashboard/settings/tokenomics         → Tokenomics
// http://localhost:3000/dashboard/settings/bank-details       → Bank Details
// http://localhost:3000/dashboard/settings/notifications      → Notifications
// http://localhost:3000/dashboard/settings/security           → Security
// http://localhost:3000/dashboard/settings/help-support       → Help & Support
// http://localhost:3000/dashboard/settings/terms              → Terms & Conditions

// Trading URLs:
// http://localhost:3000/dashboard/trading/strategies          → Custom Strategies ✨ NEW!
// http://localhost:3000/dashboard/my-strategies               → My Strategies (existing)
// http://localhost:3000/dashboard/custom-strategies-trading   → Strategies Trading (existing)

// ╔════════════════════════════════════════════════════════════════╗
// ║          ✅ WHAT'S NEW OR UPDATED                              ║
// ╚════════════════════════════════════════════════════════════════╝

/**
 * NEW URLS:
 * ✨ /dashboard/settings/subscription ← SUBSCRIPTION MANAGEMENT PAGE
 * ✨ /dashboard/trading/strategies ← CUSTOM STRATEGIES OVERVIEW
 * 
 * UPDATED URLS:
 * 🔄 /dashboard/vc-pool ← Now shows content instead of "Coming Soon"
 * 🔄 /dashboard (Top bar now has subscription badge)
 * 🔄 /dashboard/settings (Has new "Subscription Plans" menu item)
 * 
 * GLOBAL ADDITIONS:
 * 🎪 Subscription badge visible on all dashboard pages
 * 🎪 Modals (Upgrade/Cancel/Payment) available globally
 * 🎪 Feature guards active on all locked features
 */

// ╔════════════════════════════════════════════════════════════════╗
// ║          🧪 TEST THESE URLS                                    ║
// ╚════════════════════════════════════════════════════════════════╝

/**
 * TEST 1: Pricing Page
 * Go: http://localhost:3000/#pricing
 * Do: 
 *   • Click Monthly/Quarterly/Yearly toggles
 *   • See prices update
 *   • See discounts appear
 * ✓ PASS if prices update dynamically
 * 
 * TEST 2: Subscription Settings
 * Go: http://localhost:3000/dashboard/settings/subscription
 * Do:
 *   • Click each of the 4 tabs
 *   • View current plan details
 *   • View billing history
 *   • View usage analytics
 *   • Click action buttons
 * ✓ PASS if all tabs load and show data
 * 
 * TEST 3: VC Pool Access Control
 * Go: http://localhost:3000/dashboard/vc-pool
 * Do (as FREE):
 *   • See lock overlay
 * Do (as ELITE):
 *   • See investment opportunities
 * ✓ PASS if access control works
 * 
 * TEST 4: Custom Strategies
 * Go: http://localhost:3000/dashboard/trading/strategies
 * Do:
 *   • As FREE: See lock overlay
 *   • As PRO: See 5/5 limit
 *   • As ELITE: See unlimited
 * ✓ PASS if limits show correctly
 * 
 * TEST 5: Subscription Badge
 * Go: http://localhost:3000/dashboard (or any dashboard page)
 * Look: Top bar, right side
 * ✓ PASS if badge shows your current tier
 * 
 * TEST 6: Settings Menu
 * Go: http://localhost:3000/dashboard/settings
 * Look: First menu item
 * Click: "Subscription Plans"
 * ✓ PASS if goes to /dashboard/settings/subscription
 */

export const URL_GUIDE = {
  homepage: {
    pricing: "http://localhost:3000/#pricing",
  },
  dashboard: {
    main: "http://localhost:3000/dashboard",
    market: "http://localhost:3000/dashboard/market",
    topTrades: "http://localhost:3000/dashboard/top-trades",
    aiInsights: "http://localhost:3000/dashboard/ai-insights",
    vcPool: "http://localhost:3000/dashboard/vc-pool",
    paperTrading: "http://localhost:3000/dashboard/paper-trading",
    profile: "http://localhost:3000/dashboard/profile",
  },
  settings: {
    main: "http://localhost:3000/dashboard/settings",
    subscription: "http://localhost:3000/dashboard/settings/subscription",
    tokenomics: "http://localhost:3000/dashboard/settings/tokenomics",
    bankDetails: "http://localhost:3000/dashboard/settings/bank-details",
    notifications: "http://localhost:3000/dashboard/settings/notifications",
    security: "http://localhost:3000/dashboard/settings/security",
    helpSupport: "http://localhost:3000/dashboard/settings/help-support",
    terms: "http://localhost:3000/dashboard/settings/terms",
  },
  trading: {
    strategies: "http://localhost:3000/dashboard/trading/strategies",
    myStrategies: "http://localhost:3000/dashboard/my-strategies",
  },
  new: {
    subscriptionSettings: "http://localhost:3000/dashboard/settings/subscription",
    tradingStrategies: "http://localhost:3000/dashboard/trading/strategies",
  },
};
