import { AUTH_STEPS } from "@/config/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "QuantivaHQ Onboarding",
  description: "Intelligent onboarding flow for QuantivaHQ traders.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen bg-[--color-background] text-[--color-foreground]">
      <aside className="hidden w-[320px] flex-col justify-between border-r border-[--color-border] bg-[--color-surface] px-10 py-12 xl:flex">
        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
              QuantivaHQ
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-100">
              Launch your AI-powered trading HQ
            </h1>
            <p className="mt-3 text-sm text-slate-400">
              Complete these quick steps to activate personalized intelligence, compliance, and secure API routing.
            </p>
          </div>
          <ol className="space-y-4 text-sm">
            {AUTH_STEPS.map((step, index) => (
              <li key={step.href} className="flex items-center gap-3 text-slate-400">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[--color-border] bg-[--color-surface-alt] font-semibold text-slate-300">
                  {index + 1}
                </span>
                <Link href={step.href} className="hover:text-slate-200">
                  {step.label}
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div className="text-xs text-slate-500">
          Secure infrastructure • Compliance ready • ISO27001 workflows
        </div>
      </aside>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-12 lg:px-24">
        <div className="w-full max-w-2xl rounded-3xl border border-[--color-border] bg-[--color-surface-alt]/80 p-10 shadow-2xl shadow-blue-900/20 backdrop-blur">
          {children}
        </div>
        <p className="mt-10 text-sm text-slate-500">
          Need help? Contact our onboarding desk at
          <a className="ml-2 text-[--color-accent]" href="mailto:onboard@quantivahq.com">
            onboard@quantivahq.com
          </a>
        </p>
      </main>
    </div>
  );
}
