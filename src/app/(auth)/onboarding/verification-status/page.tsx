import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function VerificationStatusScreen() {
  return (
    <ScreenScaffold
      title="Verification Status"
      description="Track ongoing KYC checks and provide real-time progress updates."
      highlights={[
        "Timeline showing submission, review, approval states",
        "Estimated verification time and support contact",
        "Compliance team notes placeholder",
        "Conditional CTA to continue once approved",
      ]}
    />
  );
}
