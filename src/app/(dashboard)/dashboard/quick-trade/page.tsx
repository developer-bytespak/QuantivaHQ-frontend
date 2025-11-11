import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function QuickTradeScreen() {
  return (
    <ScreenScaffold
      title="Quick Trade Panel"
      description="Execute market, limit, and leverage trades directly from the dashboard."
      highlights={[
        "Order ticket with AI-assist suggestions",
        "Risk controls: max leverage, auto-stop",
        "Preview of margin impact and fees",
        "Confirmations with biometric placeholder",
      ]}
    />
  );
}
