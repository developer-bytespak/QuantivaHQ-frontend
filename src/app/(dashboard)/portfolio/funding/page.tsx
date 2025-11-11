import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function FundingScreen() {
  return (
    <ScreenScaffold
      title="Deposit & Withdraw"
      description="Route funding securely through connected exchanges and brokers."
      highlights={[
        "Selection of connected accounts",
        "Instructions and limits per venue",
        "Status tracker for pending transfers",
        "Compliance notices and support CTA",
      ]}
    />
  );
}
