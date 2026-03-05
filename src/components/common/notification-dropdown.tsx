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
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
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
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

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

  console.log("unreadCount",unreadCount);


  // let unreadCount = notificationCount;


  return (
    <>
      <div className="relative z-[100]">
        <button
          ref={buttonRef}
          onClick={() => {
            setIsOpen(!isOpen);
            handleGetAllNotifications();
          }}
          className="relative flex items-center justify-center h-10 w-10 rounded-lg border border-[#fc4f02]/30 bg-gradient-to-br from-white/[0.07] to-transparent hover:border-[#fc4f02]/50 hover:from-white/[0.1] transition-all duration-200"
          aria-label="Notifications"
        >
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          className="fixed z-[9999] w-80 sm:w-96 max-h-[min(24rem,70vh)] rounded-xl border border-[#fc4f02]/20 bg-[--color-surface-alt] shadow-2xl shadow-black/50 overflow-hidden flex flex-col bg-black shadow border-white z-[99999]"
          style={{ top: `${dropdownPosition.top}px`, right: `${dropdownPosition.right}px` }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 ">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-slate-400">{unreadCount} unread</span>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-400 text-center">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {notifications.map((n: any) => (
                  <li
                    key={n._id}
                    className={`px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-default ${n.read ? "bg-white/[0.02]" : ""}`}
                  >
                    <p className="text-sm font-medium text-white">{n.title || n.notification_type}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(n.created_at).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })},{" "}
                      {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
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
