"use client";

import { VCPoolSection } from "@/components/market/vc-pool-section";

export default function VCPoolPage() {
  return (
    <div className="min-h-screen bg-[--color-surface] p-6">
      <div className="max-w-7xl mx-auto">
        <VCPoolSection />
      </div>
    </div>
  );
}

