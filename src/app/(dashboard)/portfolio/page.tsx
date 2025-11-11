import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function PortfolioDashboardScreen() {
  return (
    <ScreenScaffold
      title="Portfolio Dashboard"
      description="Aggregate holdings, allocation drift, and ROI across accounts."
      highlights={[
        "Total value with ROI chip",
        "Allocation donut with AI suggestions",
        "Performance vs benchmark line chart",
        "CTA to analyze risk or withdraw funds",
      ]}
    />
  );
}
