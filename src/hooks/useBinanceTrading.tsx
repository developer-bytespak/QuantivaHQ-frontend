// UserContext.tsx
import { useMutation, UseMutationResult, useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useContext, createContext, ReactNode, useMemo } from "react";

interface UserContextType {
};

const UserContext = createContext<UserContextType | undefined>(undefined);


export const SubsProvider = ({ children }: { children: ReactNode }) => {

    
    
    

    return (
        <UserContext.Provider value={{ }}>
            {children}
        </UserContext.Provider>
    );
};

export const useBinanceTrading = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useBinanceTrading must be used within a SubsProvider");
    }
    return context;
};

export const useBinanceDashboard = () => {
    const query = useQuery({
        queryKey: ['binanceDashboard'],
        queryFn: async () => {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/binance-trading/dashboard`,{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('quantivahq_access_token')}`,
                }
            })
            return res.data;
        }
    });
    return query;
};

export const useBinanceBalance = () => {
    const query = useQuery({
        queryKey: ['binanceBalance'],
        queryFn: async () => {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/binance-trading/balance`,{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('quantivahq_access_token')}`,
                }
            })
            return res.data;
        }
    });
    return query;
}

export const useBinancePosition = () => {
    const query = useQuery({
        queryKey: ['binancePosition'],
        queryFn: async () => {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/binance-trading/positions`,{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('quantivahq_access_token')}`,
                }
            })
            return res.data;
        }
    });
    return query;
}

export const useBinanceOrdersOpen = () => {
    const query = useQuery({
        queryKey: ['binanceOrdersOpen'],
        queryFn: async () => {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/binance-trading/orders/open`,{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('quantivahq_access_token')}`,
                }
            })
            return res.data;
        }
    });
    return query;
}

export const useBinanceOrdersAll = () => {
    const query = useQuery({
        queryKey: ['binanceOrdersAll'],
        queryFn: async () => {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/binance-trading/orders/all`,{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('quantivahq_access_token')}`,
                }
            })
            return res.data;
        }
    });
    return query;
}

export const useBinanceOrdersHistory = () => {
    const query = useQuery({
        queryKey: ['binanceOrdersHistory'],
        queryFn: async () => {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/binance-trading/trade-history`,{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('quantivahq_access_token')}`,
                }
            })
            return res.data;
        }
    });
    return query;
}

