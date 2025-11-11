import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function FollowTradersScreen() {
  return (
    <ScreenScaffold
      title="Follow Top Traders"
      description="Discover top-performing traders with verified track records."
      highlights={[
        "Leaderboards with performance badges",
        "Transparency metrics and risk score",
        "Follow button syncing to copy trading",
        "Community testimonials and chat snippets",
      ]}
    />
  );
}
