"use client";

import { CSSProperties, ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

interface MarqueeProps {
  children: ReactNode;
  reverse?: boolean;
  /** Seconds for one full loop. */
  duration?: number;
  pauseOnHover?: boolean;
  className?: string;
}

/** Pure-CSS marquee: children are duplicated once and the track translates -50%. */
export function Marquee({ children, reverse = false, duration = 40, pauseOnHover = true, className = "" }: MarqueeProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={`flex flex-wrap justify-center gap-4 ${className}`}>{children}</div>;
  }

  return (
    <div
      className={`relative overflow-hidden ${reverse ? "hp-marquee-reverse" : ""} ${pauseOnHover ? "hp-marquee-paused" : ""} ${className}`}
      style={{
        maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div
        className="hp-marquee-track flex w-max"
        style={{ "--hp-marquee-duration": `${duration}s` } as CSSProperties}
      >
        <div className="flex shrink-0 gap-4 pr-4">{children}</div>
        <div className="flex shrink-0 gap-4 pr-4" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
