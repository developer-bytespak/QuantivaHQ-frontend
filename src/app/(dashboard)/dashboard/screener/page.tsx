import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function MarketScreenerScreen() {
  return (
    <ScreenScaffold
      title="Market Screener"
      description="Quantiva AI-curated screener highlighting outperforming assets across markets."
      highlights={[
        "Tabbed view for stocks and crypto",
        "Filters: trend strength, volatility, sentiment",
        "Sparkline previews and score badges",
        "Export shortlist to watchlist and AI strategies",
      ]}
    />
  );
}
