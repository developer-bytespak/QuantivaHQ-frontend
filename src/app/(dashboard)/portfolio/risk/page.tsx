import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function RiskAnalyzerScreen() {
  return (
    <ScreenScaffold
      title="Risk Analyzer"
      description="Quantify drawdowns, volatility, and risk-adjusted returns."
      highlights={[
        "Max drawdown tracker",
        "Sharpe ratio and win rate metrics",
        "Scenario stress test cards",
        "AI suggestions to rebalance",
      ]}
    />
  );
}
