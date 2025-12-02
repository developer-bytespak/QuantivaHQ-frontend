"use client";

import { SettingsBackButton } from "@/components/settings/settings-back-button";

const allocationData = [
  { label: "Team & Advisors", percentage: 20, amount: "200,000,000 QTV", color: "from-[#fc4f02] to-[#fd6a00]" },
  { label: "Public Sale", percentage: 30, amount: "300,000,000 QTV", color: "from-[#fc4f02] to-[#fda300]" },
  { label: "Liquidity Pool", percentage: 25, amount: "250,000,000 QTV", color: "from-[#fd6a00] to-[#fda300]" },
  { label: "Ecosystem & Development", percentage: 15, amount: "150,000,000 QTV", color: "from-[#fc4f02] to-[#fd8a00]" },
  { label: "Reserve", percentage: 10, amount: "100,000,000 QTV", color: "from-[#fd8a00] to-[#fda300]" },
];

export default function TokenomicsPage() {
  return (
    <div className="space-y-6">
      <SettingsBackButton />
      
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Tokenomics</h1>
        </div>

        <div className="space-y-6">
          {/* Token Distribution */}
          <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-xl p-6 hover:border-[#fc4f02]/30 transition-all duration-200">
            <h2 className="text-xl font-semibold text-white mb-6">Token Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Total Supply</p>
                <p className="text-2xl font-bold text-white">1,000,000,000</p>
                <p className="text-sm text-slate-400 mt-1">QTV</p>
              </div>
              <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Circulating Supply</p>
                <p className="text-2xl font-bold text-white">450,000,000</p>
                <p className="text-sm text-slate-400 mt-1">QTV (45%)</p>
              </div>
              <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Market Cap</p>
                <p className="text-2xl font-bold text-white">$12,500,000</p>
                <p className="text-sm text-slate-400 mt-1">USD</p>
              </div>
            </div>
          </div>

          {/* Allocation Breakdown */}
          <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-xl p-6 hover:border-[#fc4f02]/30 transition-all duration-200">
            <h2 className="text-xl font-semibold text-white mb-6">Allocation Breakdown</h2>
            <div className="space-y-5">
              {allocationData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${item.color}`}></div>
                      <span className="text-white font-medium">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-semibold text-lg">{item.percentage}%</span>
                      <p className="text-xs text-slate-400">{item.amount}</p>
                    </div>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[--color-surface] shadow-inner">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} transition-all duration-500 ease-out shadow-lg rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Token Utility */}
          <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-xl p-6 hover:border-[#fc4f02]/30 transition-all duration-200">
            <h2 className="text-xl font-semibold text-white mb-6">Token Utility</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg hover:border-[#fc4f02]/30 transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Premium Features</h3>
                  <p className="text-sm text-slate-400">Access to premium trading features and AI insights</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg hover:border-[#fc4f02]/30 transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Staking & Governance</h3>
                  <p className="text-sm text-slate-400">Staking rewards and governance participation</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg hover:border-[#fc4f02]/30 transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Trading Benefits</h3>
                  <p className="text-sm text-slate-400">Reduced trading fees and platform discounts</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg hover:border-[#fc4f02]/30 transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">VC Pool Access</h3>
                  <p className="text-sm text-slate-400">Exclusive access to VC pool investments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

