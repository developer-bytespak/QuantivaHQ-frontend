import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function SubscriptionScreen() {
  return (
    <ScreenScaffold
      title="Subscription Management"
      description="Upgrade plans, manage billing, and unlock QuantivaHQ Pro & Elite features."
      highlights={[
        "Plan comparison with feature matrix",
        "Billing history and invoice download",
        "Usage meters for AI calls and automation",
        "Cancel/downgrade flow with retention messaging",
      ]}
    />
  );
}
