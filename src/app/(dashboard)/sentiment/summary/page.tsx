import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function SentimentSummaryScreen() {
  return (
    <ScreenScaffold
      title="AI News Summary"
      description="Condensed AI-generated brief with optional voice narration."
      highlights={[
        "10-second audio summary trigger",
        "Headline digest with sentiment tags",
        "Actionable insights recommended",
        "Sharing to Slack/Discord placeholders",
      ]}
    />
  );
}
