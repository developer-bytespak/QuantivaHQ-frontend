import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function StrategyParametersScreen() {
  return (
    <ScreenScaffold
      title="Strategy Parameters"
      description="Configure trade duration, leverage, and margin across AI modes."
      highlights={[
        "Duration toggles: 30s, 60s, 120s, 300s",
        "Leverage input with recommended guardrails",
        "Margin allocation preview",
        "Advanced toggles for trailing stops and take-profit",
      ]}
    />
  );
}
