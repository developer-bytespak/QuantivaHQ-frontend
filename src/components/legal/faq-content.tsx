"use client";

import { useState } from "react";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "What is QuantivaHQ?",
        answer:
          "QuantivaHQ is a smart trading platform that combines AI-powered market insights, automated trading strategies, portfolio management, and exchange connectivity into one unified dashboard. Whether you trade stocks or crypto, QuantivaHQ gives you the tools to trade with intelligence and automate with confidence.",
      },
      {
        question: "How do I create an account?",
        answer:
          "Click the 'Get Started' button on the homepage, fill in your details (name, email, password), and verify your email address. Once verified, you can complete your profile setup and start exploring the platform.",
      },
      {
        question: "Is QuantivaHQ free to use?",
        answer:
          "QuantivaHQ offers multiple subscription tiers. You can explore the platform with a free plan that includes basic features. For advanced tools like AI signals, automated strategies, and priority support, check out our Pro and Enterprise plans on the Pricing page.",
      },
      {
        question: "What devices and browsers are supported?",
        answer:
          "QuantivaHQ works on all modern browsers including Chrome, Firefox, Safari, and Edge. The platform is fully responsive and works on desktop, tablet, and mobile devices.",
      },
    ],
  },
  {
    category: "Account & Security",
    questions: [
      {
        question: "How do I reset my password?",
        answer:
          "On the sign-in page, click 'Forgot Password?' and enter your registered email. You'll receive a password reset link. Follow the instructions in the email to set a new password.",
      },
      {
        question: "What is KYC verification and why is it required?",
        answer:
          "KYC (Know Your Customer) verification is required to comply with financial regulations. It involves submitting identity documents and a selfie for verification. This helps prevent fraud, money laundering, and ensures the security of all users on the platform.",
      },
      {
        question: "How is my data protected?",
        answer:
          "We use industry-standard encryption, secure authentication, and follow SOC 2 and ISO 27001 compliance practices. Your data is encrypted both in transit and at rest. We never share your personal information with third parties without your explicit consent, except as required by law.",
      },
      {
        question: "Is my account protected with two-factor authentication (2FA)?",
        answer:
          "Yes! Every QuantivaHQ account comes with 2FA enabled by default from the moment you sign up. You don't need to set it up separately — your account is automatically protected with an extra layer of security right from the start.",
      },
    ],
  },
  {
    category: "Trading & Exchange",
    questions: [
      {
        question: "Which exchanges does QuantivaHQ support?",
        answer:
          "QuantivaHQ supports major cryptocurrency exchanges and stock brokerages. You can connect your accounts via API keys to view portfolios, execute trades, and manage positions across multiple exchanges from a single dashboard.",
      },
      {
        question: "How do I connect my exchange account?",
        answer:
          "Navigate to the Exchange Connections section in your dashboard. Select your exchange, enter your API key and secret (with the required permissions), and save. QuantivaHQ will securely store your credentials and sync your portfolio data.",
      },
      {
        question: "Does QuantivaHQ have access to withdraw my funds?",
        answer:
          "No. We recommend creating API keys with trading permissions only and disabling withdrawal permissions. QuantivaHQ never requires withdrawal access and cannot move funds out of your exchange accounts.",
      },
      {
        question: "What are AI trading signals?",
        answer:
          "Think of AI trading signals as your smart assistant that watches the markets for you. Our engines scan thousands of data points — price movements, market trends, and overall sentiment — to spot potential opportunities and alert you in real time. It's like having an experienced analyst working around the clock so you never miss a promising move.",
      },
    ],
  },
  {
    category: "VC Pools",
    questions: [
      {
        question: "What are VC Pools?",
        answer:
          "VC Pools allow users to participate in curated venture capital investment opportunities. These are pooled investment vehicles where multiple users can contribute to fund promising projects and startups, with transparent tracking and management through the platform.",
      },
      {
        question: "How do I participate in a VC Pool?",
        answer:
          "Once your account is verified (KYC completed), you can browse available VC Pools in the dashboard. Select a pool, review the terms and investment details, and submit your participation request along with your investment amount.",
      },
      {
        question: "What should I know before joining a VC Pool?",
        answer:
          "VC Pools are an exciting way to get early access to promising projects and startups. Like all early-stage investments, they are designed for long-term growth, so your capital may be committed for a period of time. Every pool is carefully curated with full transparency on terms and progress. We recommend reviewing each pool's details and investing an amount that fits comfortably within your overall portfolio strategy.",
      },
    ],
  },
  {
    category: "Billing & Subscriptions",
    questions: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept major credit and debit cards (Visa, Mastercard, American Express), and select digital payment methods. All payments are processed securely through our payment partners.",
      },
      {
        question: "How do I upgrade or downgrade my plan?",
        answer:
          "Go to your account settings and navigate to the Subscription section. You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades apply at the end of your current billing cycle.",
      },
      {
        question: "Can I cancel my subscription?",
        answer:
          "Yes, you can cancel your subscription at any time from your account settings. Your access to premium features will continue until the end of your current billing period. No refunds are issued for partial billing periods.",
      },
    ],
  },
  {
    category: "Support & Contact",
    questions: [
      {
        question: "How can I contact support?",
        answer:
          "You can reach our support team by emailing support@quantivahq.com. For faster resolution, include your account email, a description of the issue, and any relevant screenshots.",
      },
      {
        question: "How quickly will I get a response from support?",
        answer:
          "Our support team is always available and ready to help. You can expect a response within 24 hours or less — we're committed to resolving your questions as quickly as possible.",
      },
      {
        question: "How can I share feedback or suggest a new feature?",
        answer:
          "We love hearing from our users! If you have an idea for a new feature or any feedback to help us improve, simply email support@quantivahq.com. Your input plays a big role in shaping the future of QuantivaHQ and we appreciate every suggestion.",
      },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[--color-border] rounded-lg overflow-hidden transition-colors hover:border-[var(--primary)]/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left cursor-pointer"
      >
        <span className="text-sm sm:text-base font-medium text-white">{question}</span>
        <svg
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQContent() {
  return (
    <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 sm:w-6 h-5 sm:h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">Frequently Asked Questions</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Find answers to common questions about QuantivaHQ.
          </p>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {faqs.map((category) => (
          <section key={category.category}>
            <h2 className="text-lg sm:text-2xl font-semibold text-white mb-3 sm:mb-4">
              {category.category}
            </h2>
            <div className="space-y-2 sm:space-y-3">
              {category.questions.map((item) => (
                <FAQItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg text-center">
        <p className="text-sm sm:text-base text-slate-300">
          Still have questions? Reach out to us at{" "}
          <a href="mailto:support@quantivahq.com" className="text-[var(--primary)] hover:text-[var(--primary-light)] font-medium transition-colors">
            support@quantivahq.com
          </a>
        </p>
      </div>
    </div>
  );
}
