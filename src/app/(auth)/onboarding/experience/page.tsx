import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function ExperienceScreen() {
  return (
    <ScreenScaffold
      title="Trading Experience Assessment"
      description="Gauge trader profile to calibrate AI guidance and risk controls."
      highlights={[
        "Selector for Novice, Intermediate, Expert",
        "Questionnaire on trading frequency and capital",
        "Conditional hints about educational modules",
        "Persist selections for strategy defaults",
      ]}
    />
  );
}
