"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: ReactNode;
  /** Position relative to the trigger element */
  position?: "top" | "bottom" | "left" | "right";
  /** Max width of the tooltip popup */
  maxWidth?: number;
}

export function Tooltip({ content, children, position = "top", maxWidth = 260 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calcPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = rect.top - 8;                          // 8px gap above trigger
        left = rect.left + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
        break;
    }
    setCoords({ top, left });
  }, [position]);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    calcPosition();
    setVisible(true);
  };
  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Translate so the tooltip is centered / anchored correctly
  const transformMap: Record<string, string> = {
    top: "translateX(-50%) translateY(-100%)",
    bottom: "translateX(-50%)",
    left: "translateX(-100%) translateY(-50%)",
    right: "translateY(-50%)",
  };

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible &&
        coords &&
        createPortal(
          <span
            className="pointer-events-none fixed z-[200]"
            style={{
              top: coords.top,
              left: coords.left,
              transform: transformMap[position],
              maxWidth,
              minWidth: 180,
            }}
          >
            <span className="block rounded-lg border border-[--color-border] bg-[--color-surface]/90 px-3 py-2 text-[11px] leading-relaxed text-slate-200 shadow-2xl backdrop-blur-xl">
              {content}
            </span>
          </span>,
          document.body,
        )}
    </span>
  );
}

/**
 * A small (?) icon that shows a tooltip on hover.
 * Use inline next to labels/headings.
 */
export function InfoTip({ content, position = "top", maxWidth }: Omit<TooltipProps, "children">) {
  return (
    <Tooltip content={content} position={position} maxWidth={maxWidth}>
      <span className="inline-flex h-[15px] w-[15px] cursor-help items-center justify-center rounded-full border border-white/[0.1] text-[9px] font-bold text-slate-500 transition-colors hover:border-white/[0.2] hover:text-slate-300">
        ?
      </span>
    </Tooltip>
  );
}
