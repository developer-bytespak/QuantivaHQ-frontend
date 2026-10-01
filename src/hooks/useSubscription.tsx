// Subscription mutations (Stripe checkout, cancel at period end, resume)
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import React, { useContext, createContext, ReactNode } from "react";
import { logger } from "@/lib/utils/logger";

export interface CreateCheckoutBody {
    /** Premium billing period; the backend defaults to MONTHLY when omitted. */
    billing_period?: "MONTHLY" | "QUARTERLY" | "YEARLY";
    success_url: string;
    cancel_url: string;
}

export interface CreateCheckoutResponse {
    url: string;
    sessionId: string;
    trial: boolean;
    trial_days: number;
}

export interface CancelSubscriptionResponse {
    subscription_id: string;
    status: string;
    current_period_end: string | null;
    expires_at: string | null;
    auto_renew: boolean;
    access_until: string | null;
    is_trialing: boolean;
    already_scheduled: boolean;
}

export interface ResumeSubscriptionResponse {
    subscription_id: string;
    status: string;
    auto_renew: true;
    current_period_end: string | null;
}

interface UserContextType {
    createCheckout: UseMutationResult<CreateCheckoutResponse, unknown, CreateCheckoutBody, unknown>;
    cancelSubscription: UseMutationResult<CancelSubscriptionResponse, unknown, Record<string, never> | undefined, unknown>;
    resumeSubscription: UseMutationResult<ResumeSubscriptionResponse, unknown, Record<string, never> | undefined, unknown>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);


export const SubsProvider = ({ children }: { children: ReactNode }) => {

    const createCheckout = useMutation({
        mutationFn: async (data: CreateCheckoutBody) => {
            const response = await apiRequest<CreateCheckoutBody, CreateCheckoutResponse>({
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
        mutationFn: async (_data?: Record<string, never>) => {
            return apiRequest<Record<string, never>, CancelSubscriptionResponse>({
                path: "/stripe/subscription/cancel",
                method: "POST",
                body: {},
            });
        },
    })

    const resumeSubscription = useMutation({
        mutationFn: async (_data?: Record<string, never>) => {
            return apiRequest<Record<string, never>, ResumeSubscriptionResponse>({
                path: "/stripe/subscription/resume",
                method: "POST",
                body: {},
            });
        },
    })

    return (
        <UserContext.Provider value={{ createCheckout, cancelSubscription, resumeSubscription }}>
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
