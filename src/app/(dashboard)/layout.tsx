"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { DashboardSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { DASHBOARD_NAV } from "@/config/navigation";
import { AuthGuard } from "@/components/common/auth-guard";
import { useExchange } from "@/context/ExchangeContext";
import useSubscriptionStore from "@/state/subscription-store";
import useKycStore from "@/state/kyc-store";
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
  const startKycPolling = useKycStore((s) => s.startPolling);
  const stopKycPolling = useKycStore((s) => s.stopPolling);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const bootstrap = async () => {
      try {
        await refetchConnection();
        if (cancelledRef.current) return;
        await fetchSubscriptionData();
      } catch {
        // Connection or subscription fetch failed: still allow dashboard.
        // The dashboard widget polls /onboarding/progress independently and
        // will surface any incomplete steps once the data loads.
      } finally {
        if (!cancelledRef.current) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();
    // Hydrate the KYC store so KycGate / useKycGuard see real status. Without
    // this, status stays null and every gated action ("trade", "deposit", …)
    // shows "Identity verification required" even for approved users.
    // startPolling auto-stops on terminal state, so approved users get a single
    // fetch and pending users keep polling until decision.
    startKycPolling();
    return () => {
      cancelledRef.current = true;
      stopKycPolling();
    };
  }, [refetchConnection, fetchSubscriptionData, startKycPolling, stopKycPolling]);

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
            <main className="relative flex-1 overflow-y-auto bg-[--color-surface-alt]/60 px-6 pb-16 pt-10">
              {/* Soft brand aura at the top of the workspace */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(var(--primary-rgb),0.07),transparent_70%)]"
              />
              <div className="relative mx-auto w-full max-w-7xl space-y-8">{children}</div>
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
