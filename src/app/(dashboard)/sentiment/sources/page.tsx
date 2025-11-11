import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function SourceReliabilityScreen() {
  return (
    <ScreenScaffold
      title="Source Reliability"
      description="Score signal providers to ensure trading decisions rely on verified intelligence."
      highlights={[
        "Trust scoring with historical accuracy",
        "Source categories with badges",
        "Flagged anomalies requiring manual review",
        "Exportable compliance log",
      ]}
    />
  );
}
