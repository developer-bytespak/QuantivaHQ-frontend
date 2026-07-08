"use client";

import Image from "next/image";
import { Stagger, StaggerItem } from "./motion/stagger";
import { GradientText } from "./motion/gradient-text";
import { TiltIn } from "./motion/tilt-in";
import { TiltCard } from "./motion/tilt-card";

export function AboutSection() {
  return (
    <section id="about" className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--primary-rgb),0.08),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* Left — About copy: swings in from the left in 3D, tilts with the cursor */}
          <TiltIn fromRotateY={-16} fromX={-48} until={0.3} className="h-full">
            <TiltCard maxTilt={4} className="rounded-3xl">
            <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md sm:p-8 lg:p-10">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/60 to-transparent" />
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                About Us
              </span>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Built for <GradientText>Modern Traders</GradientText>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
                Quantiva builds AI-powered trading workflows for modern crypto and stock traders. We bring market
                intelligence, automation, and execution support into one focused platform so every decision is
                faster, clearer, and backed by real-time insight.
              </p>
              <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
                <StaggerItem>
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5 transition-colors duration-300 hover:border-[var(--primary)]/30">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                      Real-Time Intelligence
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                      Live market context, sentiment signals, and clearer trade decision support.
                    </p>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5 transition-colors duration-300 hover:border-[var(--primary)]/30">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                      Execution Workflow
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                      A focused system that connects analysis, planning, and action in one place.
                    </p>
                  </div>
                </StaggerItem>
              </Stagger>
            </div>
            </TiltCard>
          </TiltIn>

          {/* Right — brand visual: mirrored 3D entrance, tilts with the cursor */}
          <TiltIn fromRotateY={16} fromX={48} until={0.3} className="h-full">
            <TiltCard maxTilt={4} className="rounded-3xl">
              <div className="relative h-full min-h-[420px] overflow-hidden rounded-3xl border border-white/10 lg:min-h-0">
                <Image
                  src="/about-visual.png"
                  alt="Ascending holographic trading chart in Quantiva brand colors"
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
                {/* Blend edges into the page + tagline */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
                <div className="absolute bottom-7 left-7 right-7">
                  <p className="text-xl font-bold text-white">AI-Powered Trading</p>
                  <p className="mt-1.5 text-xs uppercase tracking-[0.22em] text-slate-300">
                    Intelligent. Unified. Secure.
                  </p>
                </div>
              </div>
            </TiltCard>
          </TiltIn>
        </div>
      </div>
    </section>
  );
}
