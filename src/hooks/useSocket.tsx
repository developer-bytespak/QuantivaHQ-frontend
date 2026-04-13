'use client'

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";
import { getCurrentUser } from "@/lib/api/user";
import { apiRequest } from "@/lib/api/client";
import { logger } from "@/lib/utils/logger";

interface ISocketContext {
    sendMessage: (msg: string) => any;
    socket: Socket | undefined;
    onlineUsers: string[];
    notificationCount: number;
    notifications: any[];
    setNotifications: (notifications: any[]) => void;
    setNotificationDropdownOpen: (open: boolean) => void;
    setNotificationCount: (count: number) => void;
}

const SocketContext = createContext<ISocketContext | null>(null);

export const SocketProvider = ( {children} : {children: ReactNode} ) => {
    const [socket, setSocket] = useState<Socket>();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const isNotificationDropdownOpenRef = useRef(false);
    // Guard against React StrictMode double-mount creating two simultaneous connections
    const socketRef = useRef<Socket | null>(null);

    const setNotificationDropdownOpen = useCallback((open: boolean) => {
        isNotificationDropdownOpenRef.current = open;
    }, []);

    // Fetch the real authenticated userId on mount (skip on admin-only pages)
    useEffect(() => {
        if (typeof window === "undefined") return;
        const path = window.location.pathname;
        // Skip on admin pages and auth/onboarding pages (no valid session)
        if (path.startsWith("/admin") || path.startsWith("/vc-pool/admin") || path.startsWith("/super/admin") || path.startsWith("/onboarding")) {
            return;
        }
        // Skip if no access token (user is logged out)
        const token = localStorage.getItem("quantivahq_access_token");
        if (!token) return;
        getCurrentUser()
            .then((user) => setUserId(user.user_id))
            .catch(() => setUserId(null));
    }, []);

    useEffect(() => {
        if (!userId) return; // Only fetch notifications for authenticated users
        if (typeof window !== "undefined" && (window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/vc-pool/admin") || window.location.pathname.startsWith("/super/admin"))) {
            return; // Admin pages don't use user auth — skip to avoid 401 errors
        }
        const getAllNotifications = async () => {
            const accessToken = localStorage.getItem("quantivahq_access_token");
            if (!accessToken) return;
            try {
                const count = await apiRequest<void, number>({ path: '/notifications/unread' });
                setNotificationCount(count);
            } catch (error) {
                logger.error("error", error);
                toast.error("Error fetching notifications");
            }
        }
        getAllNotifications();
    }, [userId])

    useEffect(() => {
        if (!userId) return;
        // Prevent StrictMode double-mount from creating a second connection
        // while the first one is still being established or is already live
        if (socketRef.current) return;

        const socketUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!socketUrl) {
            logger.error("NEXT_PUBLIC_API_URL is not set — cannot connect to socket.");
            return;
        }
        const accessToken = localStorage.getItem("quantivahq_access_token");
        const _socket = io(socketUrl, {
            auth: { token: accessToken },
            query: { userId }
        });
        socketRef.current = _socket;
        setSocket(_socket);

            _socket.on("connection:status", (data) => {
                logger.info("connection:status", data);
            });

            _socket.on("notification:count", (data: any) => {
                // Sirf tab counter update karo jab notification dropdown closed ho
                if (!isNotificationDropdownOpenRef.current) {
                    setNotificationCount((prev: number) => prev + data.count);
                }else{
                    logger.info("data.payload",data.payload);
                    setNotifications(data.payload);
                }
            });

            _socket.on("notification:read", (payload: any) => {
                logger.info("notification:read", payload);
            });

            _socket.on("mark_notification_read", (payload: any) => {
                logger.info("mark_notification_read", payload);
            });

            return () => {
                _socket.off('connection:status');
                _socket.off('notification:count');
                _socket.off('notification:read');
                _socket.off('mark_notification_read');
                _socket.disconnect();
                socketRef.current = null;
                setSocket(undefined);
            }
    }, [userId])

    const sendMessage:ISocketContext["sendMessage"] = useCallback((msg:string) => {
        if(socket) socket.emit("message", {message:msg})
    }, [socket])


    const value = useMemo<ISocketContext>(() => ({
        sendMessage, socket, onlineUsers, notificationCount,
        notifications, setNotifications, setNotificationDropdownOpen, setNotificationCount,
    }), [sendMessage, socket, onlineUsers, notificationCount, notifications, setNotifications, setNotificationDropdownOpen, setNotificationCount]);

    return (
        <SocketContext.Provider value={value}>
            { children }
        </SocketContext.Provider>
    )
};

export const useSocket = () => {
    const state = useContext(SocketContext);
    if(!state) throw new Error("State us undefined");
    return state;
}