"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { exchangesService } from "@/lib/api/exchanges.service";
import { ComingSoon } from "@/components/common/coming-soon";

export default function HoldingsPage() {
  const router = useRouter();
  const [connectionType, setConnectionType] = useState<"crypto" | "stocks" | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await exchangesService.getActiveConnection();
        const type = response.data?.exchange?.type || null;
        setConnectionType(type);
        
        // Redirect to stocks-dashboard/holdings if stocks (it has full implementation)
        if (type === "stocks") {
          router.replace("/stocks-dashboard/holdings");
        }
      } catch (error) {
        console.error("Failed to check connection type:", error);
      } finally {
        setIsCheckingConnection(false);
      }
    };
    checkConnection();
  }, [router]);

  if (isCheckingConnection) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
      </div>
    );
  }

  if (connectionType === "crypto") {
    return (
      <ComingSoon
        title="Holdings" 
        description="Detailed holdings view for crypto is coming soon! View your positions on the main dashboard for now."
        icon="default"
      />
    );
  }

  // For stocks, the redirect happens in useEffect
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
    </div>
  );
}
