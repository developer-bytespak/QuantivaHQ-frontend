"use client";

import { TRIAL_DAYS } from "@/config/subscription";
import { Reveal } from "./motion/reveal";
import { Stagger, StaggerItem } from "./motion/stagger";

const STEPS = [
  {
    title: "Pick a plan",
    description: "Monthly, quarterly or yearly. Every feature is included on all three.",
  },
  {
    title: "Add your card, pay nothing today",
    description: `Your card is only used to start the plan after the ${TRIAL_DAYS}-day trial.`,
  },
  {
    title: `Day ${TRIAL_DAYS + 1}: your plan starts unless you cancel`,
    description: "Cancel from Settings at any point. You keep access until the trial ends.",
  },
];

/** Three-step "How the trial works" strip shown under the pricing cards. */
export function TrialStepsStrip() {
  return (
    <div className="mx-auto mt-14 max-w-5xl">
      <Reveal>
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          How the trial works
        </p>
      </Reveal>
      <Stagger className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <StaggerItem key={step.title} className="h-full">
            <div className="flex h-full gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md transition-colors duration-300 hover:border-[var(--primary)]/40">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)]"
                style={{ background: "linear-gradient(90deg,#fc4f02,#fda300)" }}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{step.description}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
