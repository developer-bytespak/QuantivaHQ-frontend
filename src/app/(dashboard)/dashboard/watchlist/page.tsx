import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function WatchlistScreen() {
  return (
    <ScreenScaffold
      title="Custom Watchlist"
      description="Personalized asset tracking with AI-backed sentiment overlays."
      highlights={[
        "Drag-and-drop ordering with grouping",
        "Live price sparkline and news sentiment badges",
        "Alert toggles and SMS/email webhook placeholders",
        "Sync watchlist to strategy builder",
      ]}
    />
  );
}
