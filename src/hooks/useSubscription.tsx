// UserContext.tsx
import { useMutation, UseMutationResult, useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useContext, createContext, ReactNode, useMemo } from "react";

interface UserContextType {
    updateSubscription: UseMutationResult<any, unknown, any, unknown>;
    createCheckout: UseMutationResult<any, unknown, any, unknown>;
    cancelSubscription: UseMutationResult<any, unknown, any, unknown>;
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

            console.log("updateSubscription response", response);
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

            console.log("createCheckout response", response);
            return response.data;
        },
        onError: (error: any) => {
            console.log("createCheckout error (raw)", error);

            if (error?.response) {
                console.log("createCheckout error status:", error.response.status);
                console.log("createCheckout error data:", error.response.data);
                console.log("createCheckout error headers:", error.response.headers);
            } else if (error?.request) {
                console.log("createCheckout error request (no response):", error.request);
            } else {
                console.log("createCheckout error message:", error?.message);
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

    return (
        <UserContext.Provider value={{ updateSubscription, createCheckout , cancelSubscription}}>
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