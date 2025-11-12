import type { Metadata } from "next";
import { OnboardingSidebar } from "@/components/common/onboarding-sidebar";

export const metadata: Metadata = {
  title: "QuantivaHQ Onboarding",
  description: "Intelligent onboarding flow for QuantivaHQ traders.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen overflow-hidden bg-[--color-background] text-[--color-foreground]">
      <OnboardingSidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
