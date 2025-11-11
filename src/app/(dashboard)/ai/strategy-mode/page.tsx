import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function StrategyModeScreen() {
  return (
    <ScreenScaffold
      title="AI Strategy Mode"
      description="Select the trading tempo and automation style tailored to your objectives."
      highlights={[
        "Cards: Ultra-short-term, Swing, DCA",
        "Projected trade frequency and risk profile",
        "Historical win rate and sample trades",
        "CTA to launch setup wizard",
      ]}
    />
  );
}
