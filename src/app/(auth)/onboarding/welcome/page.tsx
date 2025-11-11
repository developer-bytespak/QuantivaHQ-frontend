import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function WelcomeScreen() {
  return (
    <ScreenScaffold
      title="Welcome & Value Proposition"
      description="Introduce the AI-driven trading edge with concise bulletproof messaging and video loop."
      highlights={[
        "Hero statement: Trade smarter, not harder",
        "One-line proof points about AI signals, automation, and news graph",
        "Embedded looping hero or interactive story",
        "CTA: Continue to region selection",
      ]}
    />
  );
}
