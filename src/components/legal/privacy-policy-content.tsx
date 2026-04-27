type PrivacyPolicyContentProps = {
  title?: string;
  contactEmail?: string;
};

const sections = [
  {
    title: "1. Information We Collect",
    paragraphs: [
      "We may collect account information such as your name, email address, phone number, login credentials, profile details, and identifiers associated with your account and devices.",
      "We may also process KYC and compliance information, exchange connection metadata, subscription and billing records, transaction history, support communications, and technical usage information generated while you use QuantivaHQ.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    paragraphs: [
      "We use personal information to create and secure accounts, authenticate sessions, provide trading and subscription features, process billing, support KYC and fraud checks, maintain compliance, improve platform reliability, and respond to support or legal requests.",
    ],
  },
  {
    title: "3. KYC, Compliance, and Verification Data",
    paragraphs: [
      "Where identity verification is required, we may process documents, selfies, verification results, sanctions and AML screening outcomes, and related metadata through our internal systems and verification partners.",
    ],
  },
  {
    title: "4. Payments and Subscription Data",
    paragraphs: [
      "If you purchase a subscription or paid feature, we may process billing plan information, payment status, invoice and receipt metadata, subscription lifecycle data, and identifiers returned by our payment providers. We do not store full payment card details directly unless explicitly stated otherwise.",
    ],
  },
  {
    title: "5. Exchange and Trading Data",
    paragraphs: [
      "If you connect a third-party exchange or brokerage account, we may process connection identifiers, exchange names, permission status, portfolio data, balances, orders, and related trading metadata required to deliver the service.",
    ],
  },
  {
    title: "6. Cookies, Tokens, and Device Data",
    paragraphs: [
      "We may use cookies, local storage, session storage, device identifiers, and authentication tokens to maintain sessions, improve security, remember settings, and support fraud prevention and access control.",
    ],
  },
  {
    title: "7. Sharing with Third Parties",
    paragraphs: [
      "We may share data with service providers that help us operate the platform, including payment processors, identity verification providers, cloud storage vendors, AI providers, analytics or notification services, hosting providers, and infrastructure partners, but only to the extent reasonably necessary for the service or legal compliance.",
    ],
  },
  {
    title: "8. Data Retention",
    paragraphs: [
      "We retain your data only while your account is active. When you delete your account, all associated data is permanently removed from our systems, including your profile, billing information, trading history, notifications, signals, and support records.",
      "KYC and identity verification data will be retained as required by applicable laws and regulatory obligations.",
    ],
  },
  {
    title: "9. Security",
    paragraphs: [
      "We use administrative, technical, and organizational measures designed to protect personal data. However, no system can be guaranteed completely secure, and you remain responsible for protecting your credentials and devices.",
    ],
  },
  {
    title: "10. Your Rights",
    paragraphs: [
      "Depending on your jurisdiction, you may have rights to access, correct, delete, export, restrict, or object to certain processing of your personal data. You may also have the right to withdraw consent where processing is based on consent.",
    ],
  },
  {
    title: "11. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. When we do, we will post the updated version with a revised effective date.",
    ],
  },
  {
    title: "12. Contact",
    paragraphs: [
      "If you have privacy, data protection, or compliance questions, please contact us using the details below.",
    ],
  },
];

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 sm:p-4">
      <p className="mt-1 text-sm font-semibold text-white">{label}</p>
      <p className="mt-2 text-sm text-orange-100/90">{value}</p>
    </div>
  );
}

export function PrivacyPolicyContent({
  title = "Privacy Policy",
  contactEmail = "support@quantivahq.com",
}: PrivacyPolicyContentProps) {
  return (
    <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 sm:w-6 h-5 sm:h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">{title}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Privacy summary tailored to QuantivaHQ's account, KYC, exchange, and subscription flows.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <InfoBox label="Company legal name" value="QUANTIVA NEXUS LLC" />
        <InfoBox label="Registered business address" value="21825 Erwin St. #1020, Woodland Hills, CA 91367" />
        <InfoBox label="Retention schedule" value="When you delete your account, all your data is permanently removed from our systems — including profile, billing, trading history, notifications, signals, and support records. KYC and verification data will be retained as required by applicable laws." />
        <InfoBox label="Jurisdiction-specific rights" value="California residents have rights under the CCPA, including the right to know, delete, and opt out of the sale of personal information. We do not sell personal data. To exercise your rights, contact privacy@quantivahq.com." />
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
              {section.title === "12. Contact" && (
                <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg">
                  <p className="text-sm sm:text-base text-white font-medium">Email: {contactEmail}</p>
                  <p className="text-sm sm:text-base text-slate-400 mt-2">QUANTIVA NEXUS LLC · 21825 Erwin St. #1020, Woodland Hills, CA 91367</p>
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