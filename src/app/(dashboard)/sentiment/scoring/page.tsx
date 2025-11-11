import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function SentimentScoringScreen() {
  return (
    <ScreenScaffold
      title="Sentiment Scoring"
      description="Quantify bullish vs bearish momentum with explainable AI metrics."
      highlights={[
        "Aggregate sentiment timeline with zoom",
        "Breakdown by news, social, on-chain",
        "Explainability panel with key drivers",
        "Risk overlay showing probability bands",
      ]}
    />
  );
}
