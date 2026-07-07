"use client";

import { PointerEvent, ReactNode, useRef } from "react";
import { m, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

/**
 * Pointer-driven 3D tilt + cursor spotlight, all through motion values
 * (no React state, no per-move re-renders). Inert on touch and reduced motion.
 */
export function TiltCard({ children, className, maxTilt = 8 }: TiltCardProps) {
  const reduced = useReducedMotion();
  const rectRef = useRef<DOMRect | null>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 220, damping: 22 });
  const springY = useSpring(rotateY, { stiffness: 220, damping: 22 });

  const spotX = useMotionValue(50);
  const spotY = useMotionValue(50);
  const spotOpacity = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(340px circle at ${spotX}% ${spotY}%, rgba(252,79,2,0.12), transparent 70%)`;

  const isMouse = (e: PointerEvent) => e.pointerType === "mouse" && !reduced;

  const onPointerEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (!isMouse(e)) return;
    rectRef.current = e.currentTarget.getBoundingClientRect();
    spotOpacity.set(1);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isMouse(e) || !rectRef.current) return;
    const rect = rectRef.current;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 2 * maxTilt);
    rotateX.set(-(py - 0.5) * 2 * maxTilt);
    spotX.set(px * 100);
    spotY.set(py * 100);
  };

  const onPointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    spotOpacity.set(0);
  };

  return (
    <div style={{ perspective: 900 }} className="h-full">
      <m.div
        className={`relative h-full ${className ?? ""}`}
        style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {children}
        <m.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: spotlight, opacity: spotOpacity }}
        />
      </m.div>
    </div>
  );
}
