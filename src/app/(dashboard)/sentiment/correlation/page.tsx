import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function CorrelationScreen() {
  return (
    <ScreenScaffold
      title="News-to-Price Correlation"
      description="Measure impact of news events on price movements across assets."
      highlights={[
        "Heatmap linking news categories to price delta",
        "Time lag controls to adjust correlation window",
        "Export CSV and integrate into AI strategies",
        "Confidence scores and anomaly detection",
      ]}
    />
  );
}
