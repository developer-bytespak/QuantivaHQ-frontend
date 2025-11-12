"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AUTH_STEPS } from "@/config/navigation";
import { QuantivaLogo } from "./quantiva-logo";

interface StepIconProps {
  stepNumber: number;
  status: "completed" | "active" | "upcoming";
}

function StepIcon({ stepNumber, status }: StepIconProps) {
  if (status === "completed") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] shadow-lg shadow-[#FF6B35]/30">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="relative flex h-8 w-8 items-center justify-center">
        <div className="absolute h-8 w-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] opacity-20 animate-pulse" />
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FF6B35] bg-[--color-surface-alt]">
          <span className="text-xs font-semibold text-[#FF6B35]">{stepNumber}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[--color-border] bg-[--color-surface-alt]">
      <span className="text-xs font-semibold text-slate-400">{stepNumber}</span>
    </div>
  );
}

export function OnboardingSidebar() {
  const pathname = usePathname();

  const getStepStatus = (href: string, index: number) => {
    const currentIndex = AUTH_STEPS.findIndex((step) => 
      pathname === step.href || pathname.startsWith(step.href + "/")
    );
    
    if (pathname === href || pathname.startsWith(href + "/")) return "active";
    if (currentIndex !== -1 && currentIndex > index) return "completed";
    return "upcoming";
  };

  const currentStepIndex = AUTH_STEPS.findIndex((step) => 
    pathname === step.href || pathname.startsWith(step.href + "/")
  );
  const progress = currentStepIndex !== -1 
    ? ((currentStepIndex + 1) / AUTH_STEPS.length) * 100 
    : 0;

  return (
    <aside className="hidden h-screen w-[320px] flex-col justify-between border-r border-[--color-border] bg-gradient-to-b from-[--color-surface] to-[--color-surface-alt] px-6 py-6 xl:flex overflow-y-auto">
      <div className="space-y-4">
        {/* Logo and Header */}
        <div>
          <div className="mb-3 flex items-center gap-3">
            <QuantivaLogo className="h-12 w-12" />
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-slate-400 font-semibold">
                QuantivaHQ
              </p>
              <p className="text-xs text-slate-500 font-medium">Onboarding</p>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-slate-100 leading-tight">
            Launch your AI-powered trading HQ
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Complete these quick steps to activate personalized intelligence, compliance, and secure API routing.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">Progress</span>
            <span className="font-semibold text-[#FF6B35] text-base">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[--color-surface-alt]">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] transition-all duration-500 ease-out shadow-lg shadow-[#FF6B35]/30"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <nav className="relative">
          {AUTH_STEPS.map((step, index) => {
            const status = getStepStatus(step.href, index);
            const isActive = status === "active";
            const isCompleted = status === "completed";

            return (
              <div key={step.href} className="relative">
                <Link
                  href={step.href}
                  className={`group relative flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-[#FF6B35]/10 to-[#FF8C5A]/5 border border-[#FF6B35]/20 shadow-sm shadow-[#FF6B35]/10"
                      : "hover:bg-[--color-surface-alt] hover:border-[--color-border] border border-transparent"
                  }`}
                >
                  <StepIcon stepNumber={index + 1} status={status} />

                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium transition-colors ${
                        isActive
                          ? "text-[#FF6B35]"
                          : isCompleted
                          ? "text-slate-200"
                          : "text-slate-400 group-hover:text-slate-300"
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] animate-pulse" />
                  )}
                </Link>

                {/* Connector Line between steps */}
                {index < AUTH_STEPS.length - 1 && (
                  <div className="relative left-[19px] h-3 w-0.5 -mt-0.5 -mb-0.5">
                    <div
                      className={`h-full w-full transition-colors duration-200 ${
                        isCompleted
                          ? "bg-gradient-to-b from-[#FF6B35] to-[#FF8C5A]"
                          : "bg-[--color-border]"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[--color-border]">
        <div className="flex items-start gap-1.5 text-[10px] text-slate-500">
          <svg className="h-3 w-3 mt-0.5 text-[#10b981] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <p className="font-medium text-slate-400 mb-0.5 text-[10px]">Secure & Compliant</p>
            <p className="leading-tight text-[9px]">ISO27001 • Encryption • SOC 2</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

