"use client";

import { CustomStrategiesSection } from "@/components/trading/custom-strategies-section";

export default function StrategiesPage() {
  return (
    <div className="min-h-screen bg-[--color-surface] p-6">
      <div className="max-w-7xl mx-auto">
        <CustomStrategiesSection />
      </div>
    </div>
  );
}
