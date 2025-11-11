import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function StrategyMarketplaceScreen() {
  return (
    <ScreenScaffold
      title="Strategy Marketplace"
      description="Buy and sell AI strategies with verifiable performance analytics."
      highlights={[
        "Marketplace cards with ROI, risk, subscribers",
        "Due diligence checklist and changelog",
        "Subscription tiers with revenue split",
        "Moderation status and compliance notes",
      ]}
    />
  );
}
