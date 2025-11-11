import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function AdvancedChartScreen() {
  return (
    <ScreenScaffold
      title="Advanced Chart"
      description="Institutional-grade charting with AI overlays and custom indicators."
      highlights={[
        "Candlestick with order blocks and liquidity zones",
        "AI probability ribbons and signal markers",
        "Overlay presets: VWAP, Ichimoku, Bollinger",
        "Link to strategy builder and quick trade",
      ]}
    />
  );
}
