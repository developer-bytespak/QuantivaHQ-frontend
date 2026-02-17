"use client";

import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";

export function VCPoolSection() {
  const { currentSubscription, canAccessFeature } = useSubscriptionStore();

  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);

  // Dummy VC pool opportunities
  const opportunities = [
    {
      id: 1,
      name: "AI-Driven Trading Fund",
      target: "$500K",
      raised: "$380K",
      minInvestment: "$5000",
      roi: "24%",
      duration: "12 months",
    },
    {
      id: 2,
      name: "Crypto Growth Portfolio",
      target: "$1M",
      raised: "$720K",
      minInvestment: "$10000",
      roi: "32%",
      duration: "18 months",
    },
  ];

  return (
    <div className="relative">
      {/* Lock overlay for non-ELITE users */}
      {!canAccessVCPool && (
        <LockedFeatureOverlay
          featureName="VC Pool Access"
          requiredTier={PlanTier.ELITE}
          message="Access to venture capital funding opportunities is exclusively available for ELITE plan members."
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">VC Pool Access</h2>
          <p className="text-slate-400">Invest in curated trading funds and portfolio strategies</p>
        </div>

        {/* Stats */}
        {canAccessVCPool && (
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-[--color-border] rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Total Invested</p>
              <p className="text-2xl font-bold text-[#fc4f02]">$45</p>
            </div>
            <div className="border border-[--color-border] rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Active Pools</p>
              <p className="text-2xl font-bold text-green-400">2</p>
            </div>
            <div className="border border-[--color-border] rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Avg ROI</p>
              <p className="text-2xl font-bold text-blue-400">28%</p>
            </div>
          </div>
        )}

        {/* Opportunities List */}
        {canAccessVCPool && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Available Opportunities</h3>
            {opportunities.map((opp) => {
              const progressPercent = (parseInt(opp.raised.replace(/\D/g, "")) / 
                parseInt(opp.target.replace(/\D/g, ""))) * 100;

              return (
                <div
                  key={opp.id}
                  className="border border-[--color-border] rounded-lg p-4 hover:border-[#fc4f02]/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{opp.name}</h4>
                      <p className="text-xs text-slate-400">Min Investment: {opp.minInvestment}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-400">{opp.roi}</span>
                      <p className="text-xs text-slate-400">expected ROI</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Funding Progress</span>
                      <span className="text-xs text-white font-semibold">
                        {opp.raised} of {opp.target}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[#fc4f02] transition-all"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Duration</p>
                      <p className="text-white font-semibold">{opp.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Status</p>
                      <p className="text-white font-semibold">
                        {progressPercent < 100 ? "Raising" : "Closed"}
                      </p>
                    </div>
                  </div>

                  <button className="w-full px-4 py-2 bg-[#fc4f02] text-white rounded-lg hover:bg-[#e04502] transition-colors font-semibold text-sm">
                    Invest Now
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
