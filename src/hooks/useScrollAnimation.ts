"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook that triggers animation every time element scrolls into view
 * Only triggers on scroll down, not on scroll up
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number;
  rootMargin?: string;
}) {
  const elementRef = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const lastScrollY = useRef(0);
  const wasIntersecting = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const currentScrollY = window.scrollY;
          const isScrollingDown = currentScrollY > lastScrollY.current;
          lastScrollY.current = currentScrollY;

          if (entry.isIntersecting && isScrollingDown) {
            // Scrolling down and element enters view - trigger animation
            setIsVisible(false);
            // Use double requestAnimationFrame to ensure reset happens before animation
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsVisible(true);
                wasIntersecting.current = true;
              });
            });
          } else if (!entry.isIntersecting) {
            // Element left viewport - reset for next time
            setIsVisible(false);
            wasIntersecting.current = false;
          } else if (entry.isIntersecting && !isScrollingDown && !wasIntersecting.current) {
            // Scrolling up but element just entered view - show it
            setIsVisible(true);
            wasIntersecting.current = true;
          }
        });
      },
      {
        threshold: options?.threshold ?? 0.1,
        rootMargin: options?.rootMargin ?? "0px",
      }
    );

    observer.observe(element);

    // Track scroll direction
    const handleScroll = () => {
      lastScrollY.current = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.unobserve(element);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [options?.threshold, options?.rootMargin]);

  return { ref: elementRef, isVisible };
}

