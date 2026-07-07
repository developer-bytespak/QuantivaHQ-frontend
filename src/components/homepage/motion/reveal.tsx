"use client";

import { ReactNode } from "react";
import { m } from "framer-motion";

export const HP_EASE = [0.21, 0.47, 0.32, 0.98] as const;

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
  amount?: number;
  className?: string;
}

/** Blur-fade-up reveal on first viewport entry. The single replacement for the legacy scroll systems. */
export function Reveal({ children, delay = 0, y = 24, once = true, amount = 0.2, className }: RevealProps) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount }}
      transition={{ duration: 0.6, delay, ease: HP_EASE }}
    >
      {children}
    </m.div>
  );
}
