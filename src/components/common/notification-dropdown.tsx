"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSocket } from "@/hooks/useSocket";
import axios from "axios";
import { toast } from "react-toastify";

const DUMMY_NOTIFICATIONS = [
  { id: "1", title: "New trade alert", message: "BTC crossed $95,000. Check your portfolio.", time: "2 min ago", unread: true },
  { id: "2", title: "Price target hit", message: "ETH reached your target of $3,500.", time: "15 min ago", unread: true },
  { id: "3", title: "Weekly summary", message: "Your portfolio is up 5.2% this week.", time: "1 hour ago", unread: false },
  { id: "4", title: "Market update", message: "Major movers: SOL +8%, AVAX +4%.", time: "2 hours ago", unread: false },
];

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number; arrowLeft: number } | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { notificationCount, setNotificationDropdownOpen, setNotificationCount, notifications: socketNotifications } = useSocket();
  const [unreadCount, setUnreadCount] = useState(notificationCount);

  useEffect(() => {
    setUnreadCount(notificationCount);
  }, [notificationCount]);


  useEffect(() => {
    setNotifications((prev: any[]) => [...socketNotifications, ...prev]);
  }, [socketNotifications]);

  // Context ko batate raho dropdown open/closed hai — taake socket sirf closed pe counter update kare
  useEffect(() => {
    setNotificationDropdownOpen(isOpen);
  }, [isOpen, setNotificationDropdownOpen]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const gap = 8;
      const dropdownWidth = typeof window !== "undefined" && window.innerWidth < 640
        ? window.innerWidth - 24
        : 340;
      const dropdownRight = window.innerWidth - rect.right;
      const dropdownLeft = window.innerWidth - dropdownRight - dropdownWidth;
      const bellCenterX = (rect.left + rect.right) / 2;
      const arrowLeft = bellCenterX - dropdownLeft;
      setDropdownPosition({
        top: rect.bottom + gap,
        right: dropdownRight,
        arrowLeft: Math.max(12, Math.min(dropdownWidth - 12, arrowLeft)),
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen, isMobile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleGetAllNotifications = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications`);
    if(response.status === 200){
      setNotifications(response.data);
      setUnreadCount(0);
      setNotificationCount(0);
    }else{
      console.log("error",response);
      toast.error("Error fetching notifications");
    }
  }

  return (
    <>
      <div className="relative z-[100]">
        <button
          ref={buttonRef}
          onClick={() => {
            setIsOpen(!isOpen);
            handleGetAllNotifications();
          }}
          className="relative flex items-center justify-center h-10 w-10 min-w-[2.5rem] min-h-[2.5rem] sm:h-10 sm:w-10 rounded-lg border border-[#fc4f02]/30 bg-gradient-to-br from-white/[0.07] to-transparent hover:border-[#fc4f02]/50 hover:from-white/[0.1] active:bg-[#fc4f02]/10 transition-all duration-200 touch-manipulation"
          aria-label="Notifications"
        >
          <svg className="h-5 w-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fc4f02] px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {isOpen && dropdownPosition && typeof window !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] max-h-[18rem] sm:max-h-[20rem] rounded-xl overflow-visible flex flex-col bg-[#161616]/75 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50"
          style={
            isMobile
              ? { top: `${dropdownPosition.top}px`, left: 12, right: 12 }
              : { top: `${dropdownPosition.top}px`, right: dropdownPosition.right, width: 340 }
          }
        >
          {/* Arrow pointer – glass-style border */}
          <div
            className="absolute left-0 top-0 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[7px] border-l-transparent border-r-transparent border-b-white/[0.08] -translate-y-full"
            style={{ left: `${dropdownPosition.arrowLeft}px`, transform: "translate(-50%, -100%)" }}
            aria-hidden
          />
          <div
            className="absolute left-0 top-0 w-0 h-0 border-l-[5px] border-r-[5px] border-b-[5px] border-l-transparent border-r-transparent border-b-[#161616]/90 -translate-y-full"
            style={{ left: `${dropdownPosition.arrowLeft}px`, transform: "translate(-50%, -100%)", marginTop: "2px" }}
            aria-hidden
          />
          {/* Header – glass with soft orange fade */}
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-[#161616]/50 bg-gradient-to-r from-[#fc4f02]/12 via-[#fc4f02]/05 to-transparent shrink-0 rounded-t-xl overflow-hidden backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-1.5 rounded-full bg-[#fc4f02] shadow-sm shadow-[#fc4f02]/40" aria-hidden />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Notifications</h3>
            </div>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold text-white bg-[#fc4f02] px-2 py-1 rounded-md min-w-[1.5rem] text-center shadow-md shadow-[#fc4f02]/40">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          {/* List – glass fade */}
          <div className="overflow-y-auto flex-1 min-h-0 bg-transparent">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-sm text-slate-400 text-center">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-[#fc4f02]/15">
                {notifications.map((n: any) => (
                  <li
                    key={n._id}
                    className={`group px-4 py-2.5 transition-colors cursor-default touch-manipulation hover:bg-[#fc4f02]/10 active:bg-[#fc4f02]/15 ${!n.read ? "bg-[#fc4f02]/15 border-l-2 border-l-[#fc4f02] pl-3" : ""}`}
                  >
                    <p className="text-sm font-semibold text-white truncate">{n.title || n.notification_type}</p>
                    <p className="text-xs text-slate-300 mt-0.5 truncate">{n.message}</p>
                    <p className="text-xs font-medium text-[#fc4f02] mt-1">
                      {n.created_at
                        ? new Date(n.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
