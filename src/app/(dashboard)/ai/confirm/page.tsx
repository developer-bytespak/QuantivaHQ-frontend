import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function TradeConfirmationScreen() {
  return (
    <ScreenScaffold
      title="Trade Confirmation"
      description="Final review of AI-generated trade with expected performance metrics."
      highlights={[
        "Projected profit bands and stop-loss",
        "Risk scoring and capital at risk",
        "News + sentiment quick summary",
        "Biometric confirmation placeholder",
      ]}
    />
  );
}
