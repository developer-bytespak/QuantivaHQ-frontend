"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { BackButton } from "@/components/common/back-button";
import { useState, useEffect } from "react";

interface StepProps {
  number: number;
  title: string;
  description: string;
  action?: React.ReactNode;
  warning?: string;
  diagram?: React.ReactNode;
  tip?: string;
  delay: string;
}

function StepCard({ number, title, description, action, warning, diagram, tip, delay }: StepProps) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm p-3 transition-all duration-300"
      style={{ animationDelay: delay }}
    >
      {/* Step header - Badge on left, title and description on right */}
      <div className="mb-3 flex items-start gap-3">
        {/* Circular badge */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] text-xl font-bold text-white shadow-lg shadow-[#fc4f02]/30">
          {number}
        </div>

        {/* Title and description */}
        <div className="flex-1">
          <h3 className="mb-1.5 text-xl font-bold text-white">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-300">{description}</p>
        </div>
      </div>

      {/* Diagram/Screenshot placeholder */}
      {diagram && (
        <div className="mb-3 rounded-lg border border-slate-700/50 bg-slate-800/40 p-3">
          {diagram}
        </div>
      )}

      {/* Action button or content */}
      {action && <div className="mb-3">{action}</div>}

      {/* Warning */}
      {warning && (
        <div className="mb-3 rounded-lg border-l-4 border-amber-500/60 bg-amber-500/10 p-2.5">
          <div className="flex items-start gap-2">
            <svg className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-amber-200 leading-relaxed">{warning}</p>
          </div>
        </div>
      )}

      {/* Tip */}
      {tip && (
        <div className="flex items-start gap-1.5 text-xs text-amber-300/90">
          <svg className="h-3.5 w-3.5 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="leading-relaxed">{tip}</p>
        </div>
      )}
    </div>
  );
}

export default function ApiKeyTutorialPage() {
  const router = useRouter();
  const [selectedExchange, setSelectedExchange] = useState<"binance" | "bybit" | "ibkr" | null>(null);

  useEffect(() => {
    // Get selected exchange from localStorage
    const exchange = localStorage.getItem("quantivahq_selected_exchange");
    if (exchange === "binance" || exchange === "bybit" || exchange === "ibkr") {
      setSelectedExchange(exchange);
    } else {
      // Default to Binance if not set
      setSelectedExchange("binance");
    }
  }, []);

  const handleOpenExchange = () => {
    let url = "https://www.binance.com/en/login";
    if (selectedExchange === "bybit") url = "https://www.bybit.com/login";
    if (selectedExchange === "ibkr") url = "https://www.interactivebrokers.com/sso/Login";

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const exchangeInfo = {
    binance: {
      name: "Binance",
      logo: (
        <Image
          src="/binance logo.png"
          alt="Binance"
          width={64}
          height={64}
          className="h-16 w-16 object-contain"
        />
      ),
      gradient: "from-[#f0b90b] to-[#f8d33a]",
      apiManagementPath: "API Management",
    },
    bybit: {
      name: "Bybit",
      logo: (
        <Image
          src="/bybit logo.png"
          alt="Bybit"
          width={64}
          height={64}
          className="h-16 w-16 object-contain"
        />
      ),
      gradient: "from-[#f59e0b] to-[#d97706]",
      apiManagementPath: "API Management",
    },
    ibkr: {
      name: "Interactive Brokers",
      logo: (
        <div className="flex h-16 w-16 items-center justify-center p-2">
          <Image
            src="/IBKR_logo.png"
            alt="Interactive Brokers"
            width={64}
            height={64}
            className="h-full w-full object-contain"
          />
        </div>
      ),
      gradient: "from-[#ce2029] to-[#e63946]",
      apiManagementPath: "Settings > API Settings",
    },
  };

  const currentExchange = selectedExchange ? exchangeInfo[selectedExchange] : exchangeInfo.binance;
  const exchangeName = selectedExchange ? exchangeInfo[selectedExchange].name : "Binance";

  const allSteps = [
    {
      number: 1,
      title: `Log in to ${exchangeName}`,
      description: `First, make sure you're logged into your ${exchangeName} account. If you don't have an account yet, you'll need to create one and complete the verification process first.`,
      action: (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleOpenExchange}
            className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#fc4f02]/40"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Open {exchangeName}
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>

          {selectedExchange === "ibkr" && (
            <button
              onClick={() => {
                // Check if account type is "both" and crypto is already connected
                const accountType = localStorage.getItem("quantivahq_account_type");
                const cryptoConnected = localStorage.getItem("quantivahq_crypto_connected") === "true";
                
                if (accountType === "both" && cryptoConnected) {
                  // Set stocks connection flag since we're connecting stocks account
                  localStorage.setItem("quantivahq_stocks_connected", "true");
                  // Navigate to crypto dashboard when coming from "both" flow
                  router.push("/dashboard");
                } else {
                  // Set stocks connection flag for normal flow too
                  localStorage.setItem("quantivahq_stocks_connected", "true");
                  // Navigate to stocks dashboard for normal flow
                  router.push("/stocks-dashboard");
                }
              }}
              className="group relative overflow-hidden rounded-lg border border-slate-600 bg-slate-800/50 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-700/50 hover:scale-[1.02]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Demo
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          )}
        </div>
      ),
    },
    {
      number: 2,
      title: "Go to API Management",
      description: `Once logged in, click on your profile icon (usually in the top right corner), then navigate to "Account Settings" or "Security". Look for the "API Management" option in the menu.`,
      diagram: (
        <div className="space-y-3">
          {/* Step-by-step navigation guide */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
            <h4 className="mb-2 text-xs font-semibold text-white">Follow these steps:</h4>
            <div className="space-y-2">
              {/* Step 1 */}
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30 text-xs font-semibold text-blue-400">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-300">Click on your <span className="font-semibold text-white">profile icon</span> (👤) in the top right corner</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30 text-xs font-semibold text-blue-400">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-300">Select <span className="font-semibold text-white">"Account Settings"</span> or <span className="font-semibold text-white">"Security"</span> from the dropdown menu</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] text-xs font-semibold text-white shadow-md shadow-[#fc4f02]/30">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-300">Look for and click on <span className="font-semibold text-[#fc4f02]">"API Management"</span> in the settings menu</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual representation of the settings page */}
          <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between border-b border-slate-700/50 pb-1.5">
              <h5 className="text-xs font-semibold text-white">What you'll see:</h5>
            </div>

            <div className="flex gap-3">
              {/* Left sidebar - Settings menu */}
              <div className="w-48 space-y-1.5">
                <div className="mb-2 px-2">
                  <div className="h-3 w-24 rounded bg-slate-700/60"></div>
                </div>
                <div className="space-y-1.5">
                  {/* Menu Item 1 */}
                  <div className="flex h-9 items-center rounded-lg bg-slate-700/50 border border-slate-600/40 px-3">
                    <span className="text-xs font-medium text-slate-400">Security</span>
                  </div>

                  {/* Menu Item 2 */}
                  <div className="flex h-9 items-center rounded-lg bg-slate-700/50 border border-slate-600/40 px-3">
                    <span className="text-xs font-medium text-slate-400">Account</span>
                  </div>

                  {/* Highlighted API Management option */}
                  <div className="flex h-9 items-center rounded-lg bg-gradient-to-r from-[#fc4f02]/40 to-[#fda300]/40 border-2 border-[#fc4f02]/60 px-3 shadow-lg shadow-[#fc4f02]/30">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#fc4f02] shadow-sm shadow-[#fc4f02]/50"></div>
                      <span className="text-xs font-semibold text-white">API Management</span>
                    </div>
                  </div>

                  {/* Menu Item 4 */}
                  <div className="flex h-9 items-center rounded-lg bg-slate-700/50 border border-slate-600/40 px-3">
                    <span className="text-xs font-medium text-slate-400">Notifications</span>
                  </div>

                  {/* Menu Item 5 */}
                  <div className="flex h-9 items-center rounded-lg bg-slate-700/50 border border-slate-600/40 px-3">
                    <span className="text-xs font-medium text-slate-400">Preferences</span>
                  </div>
                </div>
              </div>

              {/* Right content area */}
              <div className="flex-1 rounded-lg bg-slate-800/70 border border-slate-700/60 p-4">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-1.5 flex justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fc4f02]/20 border-2 border-[#fc4f02]/40 shadow-lg shadow-[#fc4f02]/20">
                        <svg className="h-6 w-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white mb-1">API Management</p>
                    <p className="text-xs text-slate-300 leading-relaxed">This is where you'll create your API keys</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      tip: `💡 Quick tip: You can also use the search bar in settings and type "API" to quickly find the API Management section.`,
    },
    {
      number: 3,
      title: "Create New API Key",
      description: `Click the "Create API Key" or "Create" button. You'll be prompted to give your API key a label. Name it something descriptive like "QuantivaHQ" or "MyTradingApp" so you can easily identify it later.`,
      action: (
        <div className="space-y-3">
          {/* API Key Name Input Example */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-3">
            <label className="mb-2 block text-sm font-medium text-slate-300">API Key Label</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value="QuantivaHQ"
                readOnly
                className="flex-1 rounded-lg bg-slate-900/60 border border-slate-700/50 px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]/50 focus:ring-1 focus:ring-[#fc4f02]/20"
              />
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/20 border border-green-500/30">
                <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">Example: "QuantivaHQ", "MyTradingApp", "TradingBot"</p>
          </div>

          {/* Permissions Section */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-3">
            <h4 className="mb-3 text-sm font-semibold text-white">Set Permissions</h4>
            <div className="space-y-2">
              {/* Read Permission */}
              <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/20 border border-green-500/30">
                  <svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-white">Enable Reading</span>
                    <span className="rounded bg-green-500/20 border border-green-500/30 px-2 py-0.5 text-xs font-medium text-green-400">Required</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">Allows QuantivaHQ to read your account balance, trading history, and portfolio data.</p>
                </div>
              </div>

              {/* Trading Permission */}
              <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500/20 border border-green-500/30">
                  <svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-white">Enable Trading</span>
                    <span className="rounded bg-green-500/20 border border-green-500/30 px-2 py-0.5 text-xs font-medium text-green-400">Required</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">Allows QuantivaHQ to execute trades and manage your trading strategies automatically.</p>
                </div>
              </div>

              {/* Withdrawals Permission */}
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-500/20 border border-amber-500/30">
                  <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-white">Enable Withdrawals</span>
                    <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-xs font-medium text-amber-400">Not Recommended</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">Keep this disabled for maximum security. QuantivaHQ does not need withdrawal permissions to function.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: 4,
      title: "Copy and Save API Keys",
      description: `${exchangeName} will generate two keys for you: an API Key (public identifier) and a Secret Key (private authentication token). Copy both keys immediately and store them securely - you won't be able to see the Secret Key again after closing this window!`,
      warning: "⚠️ SECURITY WARNING: Do NOT share your Secret Key with anyone. Never post it online, send it via email, or store it in unsecured locations. Treat it like a password.",
      action: (
        <div className="space-y-3">
          {/* API Key Display */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-white">API Key</label>
              <span className="rounded bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-xs font-medium text-blue-400">Public</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-2">
              <code className="flex-1 font-mono text-sm text-slate-300">
                {selectedExchange === "binance" ? "bin_" : "bybit_"}
                xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
              </code>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/60 border border-slate-700/50 text-[#fc4f02] transition-colors hover:bg-slate-700/60 hover:text-[#fda300]">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">This is your public API key. You can view this again later.</p>
          </div>

          {/* Secret Key Display */}
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-white">Secret Key</label>
              <span className="rounded bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-xs font-medium text-red-400">Private</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-slate-900/60 px-3 py-2">
              <code className="flex-1 font-mono text-sm text-slate-300">
                ••••••••••••••••••••••••••••••••••••••••
              </code>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/60 border border-amber-500/30 text-amber-400 transition-colors hover:bg-slate-700/60 hover:text-amber-300">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-xs text-amber-300">⚠️ Copy this immediately! You won't be able to see it again.</p>
          </div>

          {/* Storage Tips */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-3">
            <h4 className="mb-2 text-sm font-semibold text-slate-300">💾 Storage Tips:</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-start gap-1.5">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Save in a password manager</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Store in a secure note-taking app</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-red-400 mt-0.5">✗</span>
                <span>Don't save in browser or unencrypted files</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const steps = selectedExchange === "ibkr" ? [allSteps[0]] : allSteps;

  const handleContinue = () => {
    // Navigate to API key entry page
    router.push("/onboarding/api-keys");
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden" >
      <BackButton />
      {/* Background matching Figma design */}
      <div className="absolute inset-0 bg-black" >
        {/* Subtle gradient orbs for depth */}
        < div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div >

      {/* Content */}
      < div className="relative z-10 flex h-full w-full flex-col overflow-y-auto" >
        <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-4 text-center">
            <div className="mb-2 flex justify-center">
              {currentExchange.logo}
            </div>
            <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Connect <span className="text-white">{exchangeName}</span> Account
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-slate-400 sm:text-base">
              Follow these simple steps to create your API keys safely and securely.
            </p>
          </div>

          {/* Steps Section */}
          <div className="mb-4 space-y-4">
            {steps.map((step, index) => (
              <StepCard
                key={step.number}
                number={step.number}
                title={step.title}
                description={step.description}
                action={step.action}
                warning={step.warning}
                diagram={step.diagram}
                tip={step.tip}
                delay={`${index * 0.1}s`}
              />
            ))}
          </div>

          {/* Continue Button */}
          {selectedExchange !== "ibkr" && (
            <div className="flex justify-center">
              <button
                onClick={handleContinue}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-8 py-3 text-base font-semibold text-white shadow-xl shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#fc4f02]/40"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Next: Enter API Keys
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </div>
          )}
          {selectedExchange !== "ibkr" && (
            <p className="mt-3 text-center text-sm text-slate-500">
              Make sure you've copied both keys before continuing
            </p>
          )}
        </div>
      </div >
    </div >
  );
}
