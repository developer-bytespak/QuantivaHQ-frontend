"use client";

import { TermsContent } from "@/components/legal/terms-content";
import { SettingsBackButton } from "@/components/settings/settings-back-button";

export default function TermsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SettingsBackButton />

      <TermsContent />
    </div>
  );
}

