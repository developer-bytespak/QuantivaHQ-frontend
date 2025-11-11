export default function OnboardingLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[--color-background] text-[--color-foreground]">
      <div className="flex items-center gap-3 rounded-2xl border border-[--color-border] bg-[--color-surface] px-6 py-4 text-sm text-slate-300">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-[--color-accent] border-t-transparent" />
        Preparing your QuantivaHQ onboarding...
      </div>
    </div>
  );
}
