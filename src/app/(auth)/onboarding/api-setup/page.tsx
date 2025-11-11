import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function ApiSetupScreen() {
  return (
    <ScreenScaffold
      title="API Connection Setup"
      description="Connect trading accounts securely via exchange and broker APIs."
      highlights={[
        "Connectors: Binance, Bybit, Interactive Brokers",
        "Status badges per integration",
        "Instructions for API key scopes & encryption",
        "CTA to proceed into main dashboard after success",
      ]}
    />
  );
}
