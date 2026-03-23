"use client";

import { VCPoolSection } from "@/components/market/vc-pool-section";

export default function VCPoolPage() {
  return (
    <div className="min-h-screen bg-[--color-surface] p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <VCPoolSection />
      </div>
    </div>
  );
}

