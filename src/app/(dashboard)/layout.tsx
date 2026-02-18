"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
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
  const [isBootstrapping, setIsBootstrapping] = useState(true);
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
      } catch {
        // Active or Subscription failed: still allow dashboard to load (per plan)
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
