import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[--color-background] text-[--color-foreground]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle,_rgba(56,189,248,0.08)_0%,_transparent_70%)]" />
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 text-center md:px-0">
        <span className="rounded-full border border-[--color-border] bg-[--color-surface]/60 px-6 py-2 text-xs font-medium uppercase tracking-[0.4em] text-slate-400">
          QuantivaHQ Platform Blueprint
        </span>
        <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
          Trade with Intelligence. Automate with Confidence.
        </h1>
        <p className="max-w-3xl text-lg text-slate-300">
          Neural-level trading decisions powered by AI strategy automation, real-time sentiment intelligence, and institutional-grade risk management. Start your onboarding journey to unlock the full 40-screen QuantivaHQ experience.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/onboarding/splash"
            className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-blue-500 via-sky-500 to-cyan-400 px-10 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-blue-900/30 transition hover:opacity-90"
          >
            Begin Onboarding Flow
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-[--color-border] bg-[--color-surface] px-10 py-3 text-sm font-semibold text-slate-200 transition hover:border-[--color-accent] hover:text-[--color-accent]"
          >
            Preview Dashboard Shell
          </Link>
        </div>
      </div>
    </div>
  );
}
