import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function RegionScreen() {
  return (
    <ScreenScaffold
      title="Region & Compliance"
      description="Collect region to enforce jurisdictional compliance rules before onboarding continues."
      highlights={[
        "Country picker with search and flag icons",
        "Auto-load compliance copy and disclaimers per region",
        "Consent checkbox to acknowledge regulatory guidance",
        "CTA: Continue enforcing required fields",
      ]}
    />
  );
}
