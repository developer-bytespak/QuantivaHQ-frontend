// UserContext.tsx
import { useMutation, UseMutationResult, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import React, { useContext, createContext, ReactNode, useMemo } from "react";

interface UserContextType {
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const fetchTradingData = async (path: string) => {
    return apiRequest({ path });
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



