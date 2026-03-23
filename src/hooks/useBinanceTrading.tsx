// UserContext.tsx
import { useMutation, UseMutationResult, useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useContext, createContext, ReactNode, useMemo } from "react";

interface UserContextType {
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('quantivahq_access_token')}`,
});

const fetchTradingData = async (path: string) => {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        headers: authHeaders(),
    });
    return res.data;
};


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
        queryFn: async () => fetchTradingData('/binance-trading/dashboard')
    });
    return query;
};

export const useBinanceBalance = () => {
    const query = useQuery({
        queryKey: ['binanceBalance'],
        queryFn: async () => fetchTradingData('/binance-trading/balance')
    });
    return query;
}

export const useBinancePosition = () => {
    const query = useQuery({
        queryKey: ['binancePosition'],
        queryFn: async () => fetchTradingData('/binance-trading/positions')
    });
    return query;
}

export const useBinanceOrdersOpen = () => {
    const query = useQuery({
        queryKey: ['binanceOrdersOpen'],
        queryFn: async () => fetchTradingData('/binance-trading/orders/open')
    });
    return query;
}

export const useBinanceOrdersAll = () => {
    const query = useQuery({
        queryKey: ['binanceOrdersAll'],
        queryFn: async () => fetchTradingData('/binance-trading/orders/all')
    });
    return query;
}

export const useBinanceOrdersHistory = () => {
    const query = useQuery({
        queryKey: ['binanceOrdersHistory'],
        queryFn: async () => fetchTradingData('/binance-trading/trade-history')
    });
    return query;
}

