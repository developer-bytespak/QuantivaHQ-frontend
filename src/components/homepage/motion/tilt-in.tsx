"use client";

import { ReactNode, useRef } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";

interface TiltInProps {
  children: ReactNode;
  className?: string;
  /** Starting pose — every value scrubs to its resting value (0 / 1) as the element scrolls in. */
  fromRotateX?: number;
  fromRotateY?: number;
  fromX?: number;
  fromY?: number;
  fromScale?: number;
  fromOpacity?: number;
  /** Fraction of the element's viewport traversal at which the resting pose is reached. */
  until?: number;
  perspective?: number;
}

/**
 * Scroll-scrubbed 3D entrance: the element starts tilted/shifted in 3D space and
 * settles flat as it crosses the viewport. Reversible; static under reduced motion.
 */
export function TiltIn({
  children,
  className,
  fromRotateX = 0,
  fromRotateY = 0,
  fromX = 0,
  fromY = 0,
  fromScale = 1,
  fromOpacity = 0.35,
  until = 0.35,
  perspective = 1400,
}: TiltInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const range = [0, until];
  const rotateX = useTransform(scrollYProgress, range, [fromRotateX, 0]);
  const rotateY = useTransform(scrollYProgress, range, [fromRotateY, 0]);
  const x = useTransform(scrollYProgress, range, [fromX, 0]);
  const y = useTransform(scrollYProgress, range, [fromY, 0]);
  const scale = useTransform(scrollYProgress, range, [fromScale, 1]);
  const opacity = useTransform(scrollYProgress, range, [fromOpacity, 1]);

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={{ perspective }}>
      <m.div className="h-full" style={{ rotateX, rotateY, x, y, scale, opacity, transformStyle: "preserve-3d" }}>
        {children}
      </m.div>
    </div>
  );
}
