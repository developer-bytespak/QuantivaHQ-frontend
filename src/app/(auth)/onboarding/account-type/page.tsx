import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function AccountTypeScreen() {
  return (
    <ScreenScaffold
      title="Account Type Selection"
      description="Let users define trading universe for tailored onboarding and data feeds."
      highlights={[
        "Cards for Crypto, Stocks, Both with features",
        "Highlight required exchanges per selection",
        "Store preference in onboarding state",
        "CTA: Proceed to sign-up options",
      ]}
    />
  );
}
