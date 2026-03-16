"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { DASHBOARD_NAV } from "@/config/navigation";
import { AuthGuard } from "@/components/common/auth-guard";
import { useExchange } from "@/context/ExchangeContext";
import useSubscriptionStore from "@/state/subscription-store";
import {
  UpgradeModal,
  CancelSubscriptionModal,
  PaymentModal,
} from "@/components/common/subscription-modals";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [shouldRedirectToPlan, setShouldRedirectToPlan] = useState(false);
  const { refetch: refetchConnection } = useExchange();
  const {
    showUpgradeModal,
    setShowUpgradeModal,
    showCancelModal,
    setShowCancelModal,
    showPaymentModal,
    setShowPaymentModal,
    fetchSubscriptionData,
  } = useSubscriptionStore();
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const bootstrap = async () => {
      try {
        await refetchConnection();
        if (cancelledRef.current) return;
        await fetchSubscriptionData();
        if (cancelledRef.current) return;
        const { hasPlan } = useSubscriptionStore.getState();
        // API hasPlan false = user has no plan → show choose-plan
        if (hasPlan === false) {
          setShouldRedirectToPlan(true);
          return;
        }
      } catch {
        // Connection or subscription failed: still allow dashboard (e.g. free tier)
      } finally {
        if (!cancelledRef.current) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();
    return () => {
      cancelledRef.current = true;
    };
  }, [refetchConnection, fetchSubscriptionData]);

  useEffect(() => {
    if (!shouldRedirectToPlan || isBootstrapping) return;
    router.replace("/onboarding/choose-plan");
  }, [shouldRedirectToPlan, isBootstrapping, router]);

  if (shouldRedirectToPlan) {
    return (
      <AuthGuard>
        <div className="flex h-screen items-center justify-center bg-[--color-background]">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[--color-primary] border-t-transparent mx-auto" />
            <p className="text-sm text-[--color-foreground]/60">Redirecting to plan selection...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      {isBootstrapping ? (
        <div className="flex h-screen items-center justify-center bg-[--color-background]">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[--color-primary] border-t-transparent mx-auto" />
            <p className="text-sm text-[--color-foreground]/60">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden bg-[--color-background] text-[--color-foreground]">
          <DashboardSidebar sections={DASHBOARD_NAV} />
          <div className="flex h-screen flex-1 flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto bg-[--color-surface-alt]/60 px-6 pb-16 pt-10">
              <div className="mx-auto w-full max-w-7xl space-y-8">{children}</div>
            </main>
          </div>

          {/* Subscription Modals */}
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
          />
          <CancelSubscriptionModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
          />
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
          />
        </div>
      )}
    </AuthGuard>
  );
}
