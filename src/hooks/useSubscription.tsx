// UserContext.tsx
import { useMutation, UseMutationResult, useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useContext, createContext, ReactNode, useMemo } from "react";

interface UserContextType {
    updateSubscription: UseMutationResult<any, unknown, any, unknown>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);


export const SubsProvider = ({ children }: { children: ReactNode }) => {

    const updateSubscription = useMutation({
        
        mutationFn: async (data: any) => {
            const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/update`, data, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('quantivahq_access_token')}`,
                },
            });
            return response.data;
        },
    })

    return (
        <UserContext.Provider value={{ updateSubscription }}>
            {children}
        </UserContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useSubscription must be used within a SubsProvider");
    }
    return context;
};