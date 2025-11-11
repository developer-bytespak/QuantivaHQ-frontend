import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function ResultsScreen() {
  return (
    <ScreenScaffold
      title="Trade Results & Next Signal"
      description="Summarize realized performance and prepare trader for next AI signal."
      highlights={[
        "Outcome summary with ROI and duration",
        "Attribution: signal, sentiment, market structure",
        "Recommendations for next action",
        "Buttons: Replay, Share, Queue Next Signal",
      ]}
    />
  );
}
