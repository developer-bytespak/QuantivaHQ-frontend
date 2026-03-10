'use client'

import axios from "axios";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";
// import { useUser } from "./userContext";

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
    const isNotificationDropdownOpenRef = useRef(false);
    const userId = "f96b2562-ff2b-4f22-a5c7-fc3fe56491f1"

    const setNotificationDropdownOpen = useCallback((open: boolean) => {
        isNotificationDropdownOpenRef.current = open;
    }, []);

    useEffect(() => {
        const getAllNotifications = async () => {
            const accessToken = localStorage.getItem("quantivahq_access_token");
            if (!accessToken) return;
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications/unread`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
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
        if(!userId) return;
            const _socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000", {
                query:{    
                    userId: userId
                }}
            );
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
                setSocket(undefined);
            }
    }, [userId])
    // console.log(onlineUsers)

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