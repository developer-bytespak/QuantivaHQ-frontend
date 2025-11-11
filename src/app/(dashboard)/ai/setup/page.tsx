import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function AiSetupScreen() {
  return (
    <ScreenScaffold
      title="AI Trading Setup"
      description="Guided wizard to configure account, capital, and risk controls."
      highlights={[
        "Stepper UI with progress",
        "Account selection and funding allocation",
        "Risk profile slider: Low, Medium, Aggressive",
        "Save presets and clone from marketplace",
      ]}
    />
  );
}
