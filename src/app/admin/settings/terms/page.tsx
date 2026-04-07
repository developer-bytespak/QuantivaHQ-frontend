"use client";

import { TermsContent } from "@/components/legal/terms-content";
import { SettingsBackButton } from "@/components/settings/settings-back-button";

export default function AdminTermsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SettingsBackButton backHref="/admin/settings" />

      <TermsContent title="Admin Terms of Service" accentClassName="text-[#fc4f02]" />
    </div>
  );
}
