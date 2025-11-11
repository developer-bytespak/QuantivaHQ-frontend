import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function CopyTradingScreen() {
  return (
    <ScreenScaffold
      title="Copy Trading Settings"
      description="Allocate capital to followed traders with granular controls."
      highlights={[
        "Allocation sliders per trader",
        "Risk limits and loss protection",
        "Pause/resume and emergency stop",
        "Performance tracking and notifications",
      ]}
    />
  );
}
