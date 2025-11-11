import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function VolumeHeatmapScreen() {
  return (
    <ScreenScaffold
      title="Volume Heatmap"
      description="Visualize liquidity concentrations and order flow intensity."
      highlights={[
        "Time and sales integration",
        "Buy vs sell pressure normalized",
        "Liquidity gaps and iceberg alerts",
        "Export to CSV and AI training set",
      ]}
    />
  );
}
