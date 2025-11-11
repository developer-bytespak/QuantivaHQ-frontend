import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function AiPreferencesScreen() {
  return (
    <ScreenScaffold
      title="AI Behavior Preferences"
      description="Fine-tune AI risk appetite, communication style, and automation permissions."
      highlights={[
        "Risk appetite slider and scenario previews",
        "Notification cadence and channels",
        "Automation permissions per exchange",
        "Save personas and share with team",
      ]}
    />
  );
}
