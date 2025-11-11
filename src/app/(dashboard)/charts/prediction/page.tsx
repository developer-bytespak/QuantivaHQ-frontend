import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function PredictionOverlayScreen() {
  return (
    <ScreenScaffold
      title="Prediction Overlay"
      description="Display AI-projected price paths with probability bands."
      highlights={[
        "Probability of upward movement headline",
        "Scenario analysis: bullish, base, bearish",
        "Confidence intervals shaded on chart",
        "Save overlay to strategy automation",
      ]}
    />
  );
}
