import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function PersonalInfoScreen() {
  return (
    <ScreenScaffold
      title="Personal Information"
      description="Capture core identity fields for compliance aligned with KYC requirements."
      highlights={[
        "Form fields: full name, DOB, address, nationality",
        "Inline validation with Zod schema",
        "Secure storage placeholder for PII",
        "CTA: Continue to proof upload",
      ]}
    />
  );
}
