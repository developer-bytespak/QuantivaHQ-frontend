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



