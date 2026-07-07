import { ReactNode } from "react";

export function GradientText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`animate-gradient bg-gradient-to-r from-[var(--primary)] via-[var(--primary-light)] to-[var(--primary)] bg-clip-text text-transparent ${className}`}
      style={{ backgroundSize: "200% 200%" }}
    >
      {children}
    </span>
  );
}
