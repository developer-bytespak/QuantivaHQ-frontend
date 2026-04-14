// UserContext.tsx
import { useMutation, UseMutationResult, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import React, { useContext, createContext, ReactNode, useMemo } from "react";
import { logger } from "@/lib/utils/logger";

interface UserContextType {
    updateSubscription: UseMutationResult<any, unknown, any, unknown>;
    createCheckout: UseMutationResult<any, unknown, any, unknown>;
    cancelSubscription: UseMutationResult<any, unknown, any, unknown>;
    createSubs: UseMutationResult<any, unknown, any, unknown>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);


export const SubsProvider = ({ children }: { children: ReactNode }) => {

    const updateSubscription = useMutation({
        
        mutationFn: async (data: any) => {
            const response = await apiRequest({
                path: "/subscriptions/update",
                method: "PUT",
                body: data,
            });

            logger.info("updateSubscription response", response);
            return response;
        },
    })

    const createCheckout = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiRequest({
                path: "/stripe/create-checkout-session",
                method: "POST",
                body: data,
            });

            logger.info("createCheckout response", response);
            return response;
        },
        onError: (error: any) => {
            logger.error("createCheckout error (raw)", error);
            logger.error("createCheckout error message:", error?.message);
        },
    })

    const cancelSubscription = useMutation({
        mutationFn: async (data: any) => {
            return apiRequest({
                path: "/stripe/subscription/cancel",
                method: "POST",
                body: data,
            });
        },
    })

    const createSubs = useMutation({
        mutationFn: async (data: any) => {
            return apiRequest({
                path: "/subscriptions/subscribe",
                method: "POST",
                body: data,
            });
        },
    })

    return (
        <UserContext.Provider value={{ updateSubscription, createCheckout , cancelSubscription, createSubs}}>
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