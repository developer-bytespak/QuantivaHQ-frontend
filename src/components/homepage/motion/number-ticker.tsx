"use client";

import { useEffect, useRef } from "react";
import { m, animate, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

interface NumberTickerProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

/** Counts up on first viewport entry; re-animates when `value` changes (e.g. pricing toggle). */
export function NumberTicker({ value, prefix = "", suffix = "", decimals = 0, duration = 1.4, className }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const motionVal = useMotionValue(0);
  const text = useTransform(motionVal, (v) =>
    `${prefix}${v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`,
  );

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      motionVal.set(value);
      return;
    }
    const controls = animate(motionVal, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, value, reduced, duration, motionVal]);

  return (
    <m.span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {text}
    </m.span>
  );
}
