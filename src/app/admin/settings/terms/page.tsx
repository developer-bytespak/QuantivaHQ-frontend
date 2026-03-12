"use client";

import { SettingsBackButton } from "@/components/settings/settings-back-button";

export default function AdminTermsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SettingsBackButton backHref="/admin/settings" />

      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">Terms and Conditions</h1>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="text-slate-300 space-y-4 sm:space-y-6">
            <section>
              <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2 sm:mb-4">1. Acceptance of Terms</h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                By accessing and using QuantivaHQ, you accept and agree to be bound by the terms and provision of this agreement.
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>
            <section>
              <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2 sm:mb-4">2. Use License</h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-2 sm:mb-3">
                Permission is granted to temporarily download one copy of the materials on QuantivaHQ's website for personal,
                non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
              <ul className="list-disc list-inside space-y-1 sm:space-y-2 text-sm sm:text-base text-slate-300 ml-2 sm:ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on QuantivaHQ's website</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2 sm:mb-4">3. Trading and Investment Risks</h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Trading cryptocurrencies and stocks involves substantial risk of loss. The valuation may fluctuate and clients may lose more than their original investment.
              </p>
            </section>
            <section>
              <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2 sm:mb-4">4. Account Registration</h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                To access certain features you must register. You agree to provide accurate information and are responsible for safeguarding your password.
              </p>
            </section>
            <section>
              <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2 sm:mb-4">5. Fees and Charges</h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                QuantivaHQ charges fees for various services. All fees are disclosed before you complete a transaction. We may change our fee structure with notice.
              </p>
            </section>
            <section>
              <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2 sm:mb-4">6. Privacy Policy</h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Your use is also governed by our Privacy Policy. Please review it to understand our practices regarding your personal information.
              </p>
            </section>
            <section>
              <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2 sm:mb-4">7. Contact</h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Questions about these Terms: legal@quantivahq.com
              </p>
            </section>
            <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-300">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
