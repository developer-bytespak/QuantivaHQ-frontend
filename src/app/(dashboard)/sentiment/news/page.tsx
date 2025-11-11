import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function NewsFeedScreen() {
  return (
    <ScreenScaffold
      title="Real-time News Feed"
      description="Continuously ingested and ranked news events fueling trading intelligence."
      highlights={[
        "Impact-ranked feed with exchange sync",
        "Source type badges (institutional, social, on-chain)",
        "Inline AI summary per article",
        "Bookmark to watchlist or strategies",
      ]}
    />
  );
}
