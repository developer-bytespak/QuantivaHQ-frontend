"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AUTH_STEPS } from "@/config/navigation";
import { QuantivaLogo } from "./quantiva-logo";
import { useState } from "react";

interface StepIconProps {
  stepNumber: number;
  status: "completed" | "active" | "upcoming";
}

function StepIcon({ stepNumber, status }: StepIconProps) {
  if (status === "completed") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg shadow-white/30">
        <svg className="h-5 w-5 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="relative flex h-8 w-8 items-center justify-center">
        <div className="absolute h-8 w-8 rounded-full bg-white opacity-20 animate-pulse" />
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white/10">
          <span className="text-xs font-semibold text-white">{stepNumber}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/10">
      <span className="text-xs font-semibold text-white/80">{stepNumber}</span>
    </div>
  );
}

export function OnboardingSidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

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

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <aside className={`hidden h-screen flex-col justify-between border-r border-[#FF6B35]/30 bg-[#FF6B35] transition-all duration-300 ease-in-out overflow-y-auto xl:flex ${
      isExpanded ? "w-[320px] px-6 py-6" : "w-[80px] px-3 py-6"
    }`}>
      <div className="space-y-4">
        {/* Logo and Header */}
        <div>
          <div className={`mb-4 flex items-center transition-all duration-300 ${
            isExpanded ? "gap-3" : "justify-center"
          }`}>
            <button
              onClick={toggleSidebar}
              className="relative cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-[#0b0f19] rounded-lg blur-sm opacity-60" />
              <div className="relative bg-[#0b0f19]/80 rounded-lg p-2 shadow-lg">
                <QuantivaLogo className="h-12 w-12 brightness-0 invert" />
              </div>
            </button>
            {isExpanded && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-base uppercase tracking-[0.2em] text-white font-bold drop-shadow-lg">
                  QuantivaHQ
                </p>
                <p className="text-xs text-white/95 font-semibold tracking-wide mt-0.5">Onboarding</p>
              </div>
            )}
          </div>
          {isExpanded && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white leading-tight drop-shadow-md">
                Launch your AI-powered trading HQ
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/95 font-medium">
                Complete these quick steps to activate personalized intelligence, compliance, and secure API routing.
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isExpanded && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-semibold tracking-wide">Progress</span>
              <span className="font-bold text-white text-lg drop-shadow-md">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/25 shadow-inner">
              <div
                className="h-full bg-white transition-all duration-500 ease-out shadow-lg shadow-white/50 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

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
                  className={`group relative flex items-center rounded-lg px-2 py-1.5 transition-all duration-200 ${
                    isExpanded ? "gap-2" : "justify-center"
                  } ${
                    isActive
                      ? "bg-white/20 border border-white/30 shadow-sm shadow-white/10"
                      : "hover:bg-white/10 hover:border-white/20 border border-transparent"
                  }`}
                  title={!isExpanded ? step.label : undefined}
                >
                  <StepIcon stepNumber={index + 1} status={status} />

                  {isExpanded && (
                    <div className="flex-1 min-w-0 animate-fade-in">
                      <div
                        className={`text-sm font-semibold transition-colors ${
                          isActive
                            ? "text-white drop-shadow-md"
                            : isCompleted
                            ? "text-white/95 font-medium"
                            : "text-white/85 group-hover:text-white font-medium"
                        }`}
                      >
                        {step.label}
                      </div>
                    </div>
                  )}

                  {/* Active indicator */}
                  {isActive && isExpanded && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>

                {/* Connector Line between steps */}
                {index < AUTH_STEPS.length - 1 && isExpanded && (
                  <div className="relative left-[19px] h-3 w-0.5 -mt-0.5 -mb-0.5">
                    <div
                      className={`h-full w-full transition-colors duration-200 ${
                        isCompleted
                          ? "bg-white"
                          : "bg-white/30"
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
      {isExpanded && (
        <div className="pt-3 border-t border-white/40 animate-fade-in">
          <div className="flex items-start gap-1.5 text-[10px] text-white">
            <svg className="h-3.5 w-3.5 mt-0.5 text-white flex-shrink-0 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <p className="font-semibold text-white mb-0.5 text-[10px] tracking-wide">Secure & Compliant</p>
              <p className="leading-tight text-[9px] text-white/90 font-medium">ISO27001 • Encryption • SOC 2</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

