"use client";

import { ReactNode } from "react";
import { m } from "framer-motion";
import { HP_EASE } from "./reveal";

interface StaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
}

export function Stagger({ children, className, stagger = 0.08, delay = 0, once = true, amount = 0.2 }: StaggerProps) {
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({ children, className, y = 24 }: { children: ReactNode; className?: string; y?: number }) {
  return (
    <m.div
      className={className}
      variants={{
        hidden: { opacity: 0, y, filter: "blur(6px)" },
        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: HP_EASE } },
      }}
    >
      {children}
    </m.div>
  );
}

interface StaggerWordsProps {
  text: string;
  className?: string;
  stagger?: number;
  delay?: number;
  /** "mount" animates immediately (hero H1); "view" waits for viewport entry. */
  trigger?: "mount" | "view";
}

/** Word-by-word blur-fade-up. Words start at opacity 0.001 so the LCP element still counts as painted. */
export function StaggerWords({ text, className, stagger = 0.06, delay = 0, trigger = "view" }: StaggerWordsProps) {
  const words = text.split(" ");
  return (
    <m.span
      className={className}
      aria-label={text}
      initial="hidden"
      {...(trigger === "mount"
        ? { animate: "visible" }
        : { whileInView: "visible", viewport: { once: true, amount: 0.5 } })}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {words.map((word, i) => (
        <m.span
          key={i}
          aria-hidden
          className="inline-block"
          variants={{
            hidden: { opacity: 0.001, y: "0.35em", filter: "blur(8px)" },
            visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: HP_EASE } },
          }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </m.span>
      ))}
    </m.span>
  );
}
