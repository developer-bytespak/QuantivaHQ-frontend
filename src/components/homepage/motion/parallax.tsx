"use client";

import { ReactNode, useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";

interface ParallaxProps {
  children: ReactNode;
  /** Positive drifts up as you scroll past; ~0.1–0.3 is subtle. */
  speed?: number;
  className?: string;
}

/** Scroll-linked vertical drift via motion values — zero React re-renders. */
export function Parallax({ children, speed = 0.2, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 120, speed * -120]);

  return (
    <m.div ref={ref} className={className} style={{ y }}>
      {children}
    </m.div>
  );
}
