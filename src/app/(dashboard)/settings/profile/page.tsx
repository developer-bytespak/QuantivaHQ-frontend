import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function ProfileSettingsScreen() {
  return (
    <ScreenScaffold
      title="Profile Settings"
      description="Manage UI preferences, regional currency, and security settings."
      highlights={[
        "Theme switcher and layout density",
        "Base currency and timezone selection",
        "Session management and device log",
        "Personal info sync with onboarding",
      ]}
    />
  );
}
