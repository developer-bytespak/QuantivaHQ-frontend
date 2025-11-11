import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function RiskDisclosureScreen() {
  return (
    <ScreenScaffold
      title="Risk Disclosure"
      description="Legal acknowledgement gating user access to QuantivaHQ trading tools."
      highlights={[
        "Rich-text disclosure referencing jurisdiction",
        "Scroll-to-end detection before enabling acceptance",
        "Electronic signature or typed full name",
        "Audit log entry generation",
      ]}
    />
  );
}
