"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationProps {
  message: string;
  type?: NotificationType;
  duration?: number;
  onClose?: () => void;
}

export function Notification({ message, type = "info", duration = 3000, onClose }: NotificationProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          onClose?.();
        }, 300); // Wait for fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!mounted || typeof window === "undefined") return null;

  const typeStyles = {
    success: "bg-gradient-to-r from-green-500/90 to-green-600/90 border-green-400/30 shadow-green-500/20",
    error: "bg-gradient-to-r from-red-500/90 to-red-600/90 border-red-400/30 shadow-red-500/20",
    info: "bg-gradient-to-r from-blue-500/90 to-blue-600/90 border-blue-400/30 shadow-blue-500/20",
    warning: "bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 border-yellow-400/30 shadow-yellow-500/20",
  };

  const icons = {
    success: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    ),
    error: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    ),
    info: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    warning: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
  };

  return createPortal(
    <div
      className={`fixed top-4 right-4 z-[99999] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${typeStyles[type]} backdrop-blur-sm border shadow-lg`}>
        <svg
          className="w-5 h-5 text-white flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {icons[type]}
        </svg>
        <span className="text-white font-medium">{message}</span>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="ml-2 text-white/80 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}

// Hook for managing notifications
export function useNotification() {
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);

  const showNotification = (message: string, type: NotificationType = "info") => {
    setNotification({ message, type });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    showNotification,
    hideNotification,
  };
}

