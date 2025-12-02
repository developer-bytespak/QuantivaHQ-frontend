"use client";

import { SettingsBackButton } from "@/components/settings/settings-back-button";

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <SettingsBackButton />
      
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Terms and Conditions</h1>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="text-slate-300 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-300 leading-relaxed">
                By accessing and using QuantivaHQ, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Use License</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                Permission is granted to temporarily download one copy of the materials on QuantivaHQ's website for personal, 
                non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on QuantivaHQ's website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Trading and Investment Risks</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                Trading cryptocurrencies and stocks involves substantial risk of loss and is not suitable for every investor. 
                The valuation of cryptocurrencies and stocks may fluctuate, and as a result, clients may lose more than their original investment. 
                The high degree of leverage can work against you as well as for you.
              </p>
              <p className="text-slate-300 leading-relaxed">
                Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite. 
                The possibility exists that you could sustain a loss of some or all of your initial investment and therefore you should not invest 
                money that you cannot afford to lose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Account Registration</h2>
              <p className="text-slate-300 leading-relaxed">
                To access certain features of QuantivaHQ, you must register for an account. You agree to provide accurate, current, 
                and complete information during the registration process and to update such information to keep it accurate, current, and complete. 
                You are responsible for safeguarding your password and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Fees and Charges</h2>
              <p className="text-slate-300 leading-relaxed">
                QuantivaHQ charges fees for various services including trading, withdrawals, and premium features. 
                All fees are clearly disclosed before you complete a transaction. By using our services, you agree to pay all applicable fees. 
                We reserve the right to change our fee structure at any time, with notice provided to users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Privacy Policy</h2>
              <p className="text-slate-300 leading-relaxed">
                Your use of QuantivaHQ is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices 
                regarding the collection and use of your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Prohibited Activities</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300 ml-4">
                <li>Violating any applicable laws or regulations</li>
                <li>Infringing upon the rights of others</li>
                <li>Transmitting any malicious code or viruses</li>
                <li>Attempting to gain unauthorized access to our systems</li>
                <li>Using automated systems to access the service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
              <p className="text-slate-300 leading-relaxed">
                In no event shall QuantivaHQ or its suppliers be liable for any damages (including, without limitation, damages for loss of data 
                or profit, or due to business interruption) arising out of the use or inability to use the materials on QuantivaHQ's website, 
                even if QuantivaHQ or a QuantivaHQ authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to Terms</h2>
              <p className="text-slate-300 leading-relaxed">
                QuantivaHQ may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by 
                the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Information</h2>
              <p className="text-slate-300 leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg">
                <p className="text-white font-medium">Email: legal@quantivahq.com</p>
                <p className="text-white font-medium mt-2">Address: [Your Company Address]</p>
              </div>
            </section>

            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

