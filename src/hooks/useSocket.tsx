'use client'

import axios from "axios";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";
import { getCurrentUser } from "@/lib/api/user";

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

    // Fetch the real authenticated userId on mount
    useEffect(() => {
        getCurrentUser()
            .then((user) => setUserId(user.user_id))
            .catch(() => setUserId(null));
    }, []);

    useEffect(() => {
        const getAllNotifications = async () => {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications/unread`);
            if(response.status === 200){
                setNotificationCount(response.data);
            }else{
                console.log("error",response);
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

        const _socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000", {
            query: { userId }
        });
        socketRef.current = _socket;
        setSocket(_socket);

            _socket.on("connection:status", (data) => {
                console.log("connection:status", data);
            });

            _socket.on("notification:count", (data: any) => {
                // Sirf tab counter update karo jab notification dropdown closed ho
                if (!isNotificationDropdownOpenRef.current) {
                    setNotificationCount((prev: number) => prev + data.count);
                }else{
                    console.log("data.payload",data.payload);
                    setNotifications(data.payload);
                }
            });

            _socket.on("notification:read", (payload: any) => {
                console.log("notification:read", payload);
            });

            _socket.on("mark_notification_read", (payload: any) => {
                console.log("mark_notification_read", payload);
            });

            return () => {
                _socket.disconnect();
                socketRef.current = null;
                setSocket(undefined);
            }
    }, [userId])

    const sendMessage:ISocketContext["sendMessage"] = useCallback((msg:string) => {
        if(socket) socket.emit("message", {message:msg})
    }, [socket])


    return (
        <SocketContext.Provider value={{ sendMessage, socket, onlineUsers, notificationCount, notifications, setNotifications, setNotificationDropdownOpen,setNotificationCount }}>
            { children }
        </SocketContext.Provider>
    )
};

export const useSocket = () => {
    const state = useContext(SocketContext);
    if(!state) throw new Error("State us undefined");
    return state;
}