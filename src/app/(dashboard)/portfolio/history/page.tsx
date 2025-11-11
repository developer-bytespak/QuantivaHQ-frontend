import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function TradeHistoryScreen() {
  return (
    <ScreenScaffold
      title="Trade History"
      description="Complete audit trail of executed trades with AI rationale."
      highlights={[
        "Table with trade metadata and outcomes",
        "Expandable AI reasoning per trade",
        "Filter by strategy, account, or asset",
        "Export and compliance attestation",
      ]}
    />
  );
}
