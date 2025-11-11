import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function ProfitHeatmapScreen() {
  return (
    <ScreenScaffold
      title="Profit Heatmap"
      description="Visualize performance contribution by market, strategy, and timeframe."
      highlights={[
        "Matrix view of asset vs. timeframe",
        "Toggle between realized and unrealized P&L",
        "Hover tooltips with sentiment correlations",
        "Download report and share to team",
      ]}
    />
  );
}
