// UserContext.tsx
import { useMutation, UseMutationResult, useQuery } from "@tanstack/react-query";
import axios from "axios";
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
            const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/update`, data, {
                withCredentials: true,              
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('quantivahq_access_token')}`,
                },
            });

            logger.info("updateSubscription response", response);
            return response.data;
        },
    })

    const createCheckout = useMutation({
        mutationFn: async (data: any) => {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/stripe/create-checkout-session`,
                data,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("quantivahq_access_token")}`,
                    },
                }
            );

            logger.info("createCheckout response", response);
            return response.data;
        },
        onError: (error: any) => {
            logger.error("createCheckout error (raw)", error);

            if (error?.response) {
                logger.error("createCheckout error status:", error.response.status);
                logger.error("createCheckout error data:", error.response.data);
                logger.error("createCheckout error headers:", error.response.headers);
            } else if (error?.request) {
                logger.error("createCheckout error request (no response):", error.request);
            } else {
                logger.error("createCheckout error message:", error?.message);
            }
        },
    })

    const cancelSubscription = useMutation({
        mutationFn: async (data: any) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/stripe/subscription/cancel`, data, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('quantivahq_access_token')}`,
                },
            });
            return response.data;
        },
    })

    const createSubs = useMutation({
        mutationFn: async (data: any) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/subscribe`, data, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('quantivahq_access_token')}`,
                },
            });
            return response.data;
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