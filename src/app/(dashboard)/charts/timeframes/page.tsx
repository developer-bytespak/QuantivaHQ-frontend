import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function MultiTimeframeScreen() {
  return (
    <ScreenScaffold
      title="Multi-timeframe Analyzer"
      description="Compare AI and technical signals across synchronized timeframes."
      highlights={[
        "Grid of 1m, 5m, 1h, 1d",
        "Sync crosshairs and annotations",
        "Divergence detection callouts",
        "Export as layout template",
      ]}
    />
  );
}
