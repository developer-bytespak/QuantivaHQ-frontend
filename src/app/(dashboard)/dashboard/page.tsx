import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function DashboardHome() {
  return (
    <ScreenScaffold
      title="AI Trading Command Center"
      description="Unified view of AI signals, balances, open exposure, and personalized alerts."
      highlights={[
        "AI signal stack with confidence bands",
        "Aggregated balances across connected brokers",
        "Open positions with P&L waterfall",
        "Quick insights: win rate, drawdown, net capital",
      ]}
    />
  );
}
