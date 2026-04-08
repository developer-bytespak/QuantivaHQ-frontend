type TermsContentProps = {
  title?: string;
  accentClassName?: string;
  contactEmail?: string;
};

const sections = [
  {
    title: "1. Scope of Service",
    paragraphs: [
      "QuantivaHQ provides software tools for market data, AI-assisted insights, strategy workflows, subscription-based features, exchange connectivity, and participation features such as VC pools. QuantivaHQ is a technology platform and does not represent that it is your broker, custodian, exchange, fiduciary, or regulated investment adviser unless expressly stated otherwise in a separate written agreement.",
    ],
  },
  {
    title: "2. Eligibility and Account Responsibilities",
    paragraphs: [
      "You must provide accurate, current, and complete information when creating or maintaining your account. You are responsible for keeping your login credentials, devices, verification codes, and connected exchange permissions secure, and you remain responsible for all activity carried out through your account.",
      "We may suspend, restrict, or terminate access if account information appears inaccurate, misleading, fraudulent, or inconsistent with our compliance requirements.",
    ],
  },
  {
    title: "3. Identity Verification and Compliance",
    paragraphs: [
      "Certain features require identity verification, document review, selfie or liveness checks, payment verification, or other compliance screening. By using those features, you authorize QuantivaHQ and its service providers to process the submitted information for fraud prevention, KYC, AML, sanctions screening, security, and compliance purposes.",
      "We may request additional documents, reject submissions, pause transactions, or block access where verification is incomplete, inconclusive, expired, or prohibited by law or policy.",
    ],
  },
  {
    title: "4. Exchange Connections and API Keys",
    paragraphs: [
      "If you connect Binance, Binance.US, Bybit, Alpaca, or any other third-party account, you authorize QuantivaHQ to use the API credentials and permissions you provide to retrieve account data, verify permissions, and, where enabled by you, transmit order instructions. API keys, trading permissions, IP whitelist settings, and exchange account restrictions remain your responsibility.",
      "QuantivaHQ is not responsible for rejected connections, invalid credentials, exchange-side restrictions, rate limits, maintenance windows, IP whitelist failures, partial permissions, third-party outages, or exchange policy changes.",
    ],
  },
  {
    title: "5. Trading, Signals, and Execution Risk",
    paragraphs: [
      "Trading in cryptocurrencies, stocks, and related assets involves substantial risk, including the risk of losing all or part of your capital. Any signal, ranking, score, top trade, AI summary, watchlist, or pool-related information made available through the platform is provided for informational and operational use only and does not guarantee any result.",
      "Order routing and execution depend on third-party exchanges, market conditions, liquidity, latency, and external systems. Prices may move, orders may be rejected, partially filled, delayed, or executed at prices different from what is displayed on the platform. You are solely responsible for reviewing whether any action is appropriate for your objectives and risk tolerance.",
    ],
  },
  {
    title: "6. AI Insights Disclaimer",
    paragraphs: [
      "AI-generated summaries, sentiment analysis, risk ratings, explanations, or recommendations may be inaccurate, incomplete, delayed, or unsuitable for your situation. You should independently verify all important information before relying on it for trading, investment, or operational decisions.",
    ],
  },
  {
    title: "7. Subscriptions, Billing, and Fees",
    paragraphs: [
      "Some features are available only through paid subscriptions or tier-based access. By purchasing a plan, you authorize the applicable billing provider to charge the subscription price, applicable taxes, and any disclosed additional charges according to the billing cycle selected by you.",
      "Subscriptions may auto-renew unless cancelled. Feature access, plan limits, pricing, and included functionality may change over time. Where your account has outstanding platform trade fees, those fees may remain payable or be processed at cancellation in accordance with the fee logic disclosed in the product flow.",
    ],
  },
  {
    title: "8. VC Pool Participation",
    paragraphs: [
      "VC pool features are subject to eligibility rules, seat limits, payment windows, verification checks, admin review, and tier restrictions. Reserving or joining a pool does not guarantee continued eligibility, final acceptance, profit, payout timing, or capital preservation.",
      "Pool fees, cancellation fees, admin profit-sharing fees, payment proof requirements, transaction ID submission requirements, refund handling, and payout calculations may apply as described in the relevant product flow. If a payment window expires, a submission fails verification, or suspicious activity is detected, your seat or participation may be cancelled or adjusted.",
    ],
  },
  {
    title: "9. Geographic and Regulatory Restrictions",
    paragraphs: [
      "Certain features, exchanges, assets, or workflows may not be available in specific jurisdictions, for specific nationalities, or under applicable sanctions and compliance rules. QuantivaHQ may block, redirect, or limit access where required for regulatory, contractual, or risk reasons.",
    ],
  },
  {
    title: "10. Prohibited Conduct",
    paragraphs: [
      "You may not misuse the platform, reverse engineer protected systems, bypass feature controls, submit forged documents or payment proofs, attempt unauthorized access, interfere with platform security, manipulate markets, violate sanctions or export rules, or use the service in a way that exposes QuantivaHQ or its providers to legal or operational risk.",
    ],
  },
  {
    title: "11. Third-Party Services",
    paragraphs: [
      "QuantivaHQ relies on third-party providers for exchange connectivity, payment processing, AI generation, compliance tooling, storage, notifications, and market data. We are not liable for the acts, omissions, downtime, errors, or changing policies of those third parties.",
    ],
  },
  {
    title: "12. Suspension and Termination",
    paragraphs: [
      "We may suspend, restrict, or terminate access to any account or feature at any time where reasonably necessary for security, maintenance, fraud prevention, non-payment, abuse prevention, legal compliance, or suspected breach of these terms.",
    ],
  },
  {
    title: "13. Intellectual Property",
    paragraphs: [
      "The platform, software, designs, scoring systems, workflows, strategy logic, content formatting, and related materials remain the property of QuantivaHQ or its licensors. Subject to these terms, you receive a limited, revocable, non-exclusive, non-transferable right to use the service for its intended purpose.",
    ],
  },
  {
    title: "14. Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, QuantivaHQ and its affiliates, officers, employees, contractors, and providers will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, trading losses, lost opportunities, loss of data, or business interruption arising from or related to the service.",
      "Where liability cannot be excluded, QuantivaHQ's aggregate liability will be limited to the amount you paid directly to QuantivaHQ for the relevant service during the 12 months preceding the event giving rise to the claim.",
    ],
  },
  {
    title: "15. Changes to These Terms",
    paragraphs: [
      "We may update these terms from time to time. Continued use of the service after updated terms become effective constitutes acceptance of the revised terms.",
    ],
  },
  {
    title: "16. Contact",
    paragraphs: [
      "If you have legal or compliance questions about these terms, please contact us using the email address below.",
    ],
  },
];

export function TermsContent({
  title = "Terms of Service",
  accentClassName = "text-[var(--primary)]",
  contactEmail = "support@quantivahq.com",
}: TermsContentProps) {
  return (
    <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-current/20 to-current/10 border border-current/20 flex items-center justify-center flex-shrink-0 text-[var(--primary)]">
          <svg className={`w-5 sm:w-6 h-5 sm:h-6 ${accentClassName}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">{title}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Terms tailored to QuantivaHQ's subscription, trading, AI, exchange integration, and VC pool features.
          </p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 text-slate-300">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2 sm:mb-4">{section.title}</h2>
            <div className="space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.title === "16. Contact" && (
                <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg">
                  <p className="text-sm sm:text-base text-white font-medium">Email: {contactEmail}</p>
                  <p className="text-sm sm:text-base text-slate-400 mt-2">Company address: 24236 W. Stone Bend Ln, West Hills, CA 91304</p>
                </div>
              )}
            </div>
          </section>
        ))}

        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-300">
            <strong>Last Updated:</strong> April 6, 2026
          </p>
        </div>
      </div>
    </div>
  );
}