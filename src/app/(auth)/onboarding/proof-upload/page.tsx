import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function ProofUploadScreen() {
  return (
    <ScreenScaffold
      title="Identity Verification Upload"
      description="Secure document capture and upload for KYC verification."
      highlights={[
        "Upload options: passport, driver license, national ID",
        "Camera capture widget placeholder",
        "Encryption notice and compliance tooltip",
        "Progress indicator for document checks",
      ]}
    />
  );
}
