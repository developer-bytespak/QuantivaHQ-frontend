import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function IndicatorHubScreen() {
  return (
    <ScreenScaffold
      title="Indicator Hub"
      description="Centralize technical and AI indicators for combined analysis."
      highlights={[
        "Indicator library with favorites",
        "Preview charts: RSI, OBV, Ichimoku, AI probability",
        "Drag indicators onto advanced chart",
        "Recommendations based on strategy mode",
      ]}
    />
  );
}
