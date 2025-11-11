import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function SplashScreen() {
  return (
    <ScreenScaffold
      title="Splash Experience"
      description="Animated QuantivaHQ identity with tagline reinforcement and brand trust signals."
      highlights={[
        "Logo animation choreographed with AI waveform",
        "Tagline reveal: Trade with Intelligence. Automate with Confidence.",
        "Instant transitions into onboarding flow with compliance notice",
        "Optional skip after 3 seconds for returning users",
      ]}
    />
  );
}
