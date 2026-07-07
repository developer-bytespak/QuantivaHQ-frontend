"use client";

import { ReactNode } from "react";
import { Reveal } from "./reveal";
import { GradientText } from "./gradient-text";

interface HomeSectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  highlight?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** Standard section shell: consistent width, vertical rhythm and revealed header. */
export function HomeSection({ id, eyebrow, title, highlight, description, children, className = "" }: HomeSectionProps) {
  return (
    <section id={id} className={`relative py-24 sm:py-32 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(eyebrow || title) && (
          <div className="mx-auto mb-16 max-w-3xl text-center">
            {eyebrow && (
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-slate-300 backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                  {eyebrow}
                </span>
              </Reveal>
            )}
            {title && (
              <Reveal delay={0.08}>
                <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {title} {highlight && <GradientText>{highlight}</GradientText>}
                </h2>
              </Reveal>
            )}
            {description && (
              <Reveal delay={0.16}>
                <p className="mt-5 text-lg leading-relaxed text-slate-400">{description}</p>
              </Reveal>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
