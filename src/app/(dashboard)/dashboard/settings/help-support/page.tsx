"use client";

import { useState } from "react";
import { SettingsBackButton } from "@/components/settings/settings-back-button";
import { useNotification, Notification } from "@/components/common/notification";

const faqs = [
  {
    category: "Account & Security",
    questions: [
      {
        question: "How do I reset my password?",
        answer:
          "Go to Settings > Password and follow the steps to update your password. If you're logged out, click 'Forgot Password?' on the sign-in page and enter your registered email to receive a reset link.",
      },
      {
        question: "How is my data protected?",
        answer:
          "We use industry-standard encryption, secure authentication, and follow SOC 2 and ISO 27001 compliance practices. Your data is encrypted both in transit and at rest. We never share your personal information with third parties without your explicit consent, except as required by law.",
      },
    ],
  },
  {
    category: "Trading & Exchange",
    questions: [
      {
        question: "What are the trading fees?",
        answer:
          "Our trading fees vary based on your account tier. Standard accounts have a 0.5% trading fee, while premium accounts enjoy reduced fees starting at 0.25%. Check your account settings for your specific fee structure.",
      },
      {
        question: "Can I trade cryptocurrencies and stocks on the same account?",
        answer:
          "Yes! QuantivaHQ supports both cryptocurrency and stock trading from a single account. You can switch between the two dashboards using the navigation menu and your portfolio will show holdings from both markets in one place.",
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
    <div className="border border-[--color-border]/50 rounded-lg overflow-hidden transition-colors hover:border-[var(--primary)]/30">
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

export default function HelpSupportPage() {
  const { notification, hideNotification } = useNotification();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Name must not exceed 100 characters";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }
    if (formData.company.trim() && formData.company.trim().length > 100) {
      newErrors.company = "Company name must not exceed 100 characters";
    }
    if (formData.phone.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = "Please enter a valid phone number";
      } else if (formData.phone.trim().length > 20) {
        newErrors.phone = "Phone number must not exceed 20 characters";
      }
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Please select a subject";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (formData.message.trim().length > 5000) {
      newErrors.message = "Message must not exceed 5000 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof formData]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof formData];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      setSubmitStatus("error");
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus("idle");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitStatus("success");
      setFormData({ name: "", email: "", company: "", phone: "", subject: "", message: "" });
      setErrors({});
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      <SettingsBackButton />

      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">Help and Support</h1>
          </div>

          {/* Contact Cards - matching homepage style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <a
              href="mailto:support@quantivahq.com"
              className="group text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[--color-surface-alt]/60 to-[--color-surface-alt]/40 border border-[--color-border]/50 backdrop-blur-sm hover:border-[var(--primary)]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[rgba(var(--primary-rgb),0.3)]/10"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 border border-[var(--primary)]/20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="h-7 w-7 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-2.5">Email Support</h3>
              <p className="text-sm text-slate-400 font-medium">support@quantivahq.com</p>
              <p className="text-xs text-slate-500 mt-1">We respond within 24 hours</p>
            </a>

            <div className="group text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[--color-surface-alt]/60 to-[--color-surface-alt]/40 border border-[--color-border]/50 backdrop-blur-sm hover:border-[var(--primary)]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[rgba(var(--primary-rgb),0.3)]/10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 border border-[var(--primary)]/20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="h-7 w-7 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-2.5">Phone Support</h3>
              <p className="text-sm text-slate-400 font-medium">+1 (747) 800-7952</p>
              <p className="text-xs text-slate-500 mt-1">Available during business hours</p>
            </div>

            <div className="group text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[--color-surface-alt]/60 to-[--color-surface-alt]/40 border border-[--color-border]/50 backdrop-blur-sm hover:border-[var(--primary)]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[rgba(var(--primary-rgb),0.3)]/10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 border border-[var(--primary)]/20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="h-7 w-7 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-2.5">Business Hours</h3>
              <p className="text-sm text-slate-400 font-medium">Monday - Friday</p>
              <p className="text-xs text-slate-500 mt-1">9:00 AM - 6:00 PM EST</p>
            </div>
          </div>
        </div>

        {/* FAQ Section - accordion style */}
        <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
          <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6 sm:space-y-8">
            {faqs.map((category) => (
              <section key={category.category}>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                  {category.category}
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {category.questions.map((item) => (
                    <FAQItem key={item.question} question={item.question} answer={item.answer} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
          <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-[--color-border]/30">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Contact Information</h3>
            <p className="text-xs sm:text-sm text-slate-400">Please fill out the form below and we'll get back to you promptly.</p>
          </div>

          {submitStatus === "success" && (
            <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs sm:text-sm flex items-center gap-3">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Thank you for your message! We'll get back to you within 24 hours.</span>
            </div>
          )}
          {submitStatus === "error" && Object.keys(errors).length > 0 && (
            <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <div className="flex items-start gap-3 mb-2">
                <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold mb-2">Please fix the following errors:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white mb-2.5">
                    Full Name <span className="text-[var(--primary)] ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3.5 rounded-xl bg-[--color-surface]/80 border text-white placeholder-slate-500/60 text-sm focus:outline-none focus:ring-2 transition-all duration-200 hover:border-[--color-border] ${
                      errors.name
                        ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
                        : "border-[--color-border]/60 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]/60"
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2.5">
                    Email Address <span className="text-[var(--primary)] ml-1">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3.5 rounded-xl bg-[--color-surface]/80 border text-white placeholder-slate-500/60 text-sm focus:outline-none focus:ring-2 transition-all duration-200 hover:border-[--color-border] ${
                      errors.email
                        ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
                        : "border-[--color-border]/60 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]/60"
                    }`}
                    placeholder="your.email@company.com"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-white mb-2.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 rounded-xl bg-[--color-surface]/80 border text-white placeholder-slate-500/60 text-sm focus:outline-none focus:ring-2 transition-all duration-200 hover:border-[--color-border] ${
                      errors.company
                        ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
                        : "border-[--color-border]/60 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]/60"
                    }`}
                    placeholder="Your company name"
                  />
                  {errors.company && <p className="text-red-400 text-xs mt-1.5">{errors.company}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white mb-2.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 rounded-xl bg-[--color-surface]/80 border text-white placeholder-slate-500/60 text-sm focus:outline-none focus:ring-2 transition-all duration-200 hover:border-[--color-border] ${
                      errors.phone
                        ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
                        : "border-[--color-border]/60 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]/60"
                    }`}
                    placeholder="+1 (747) 800-7952"
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1.5">{errors.phone}</p>}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Inquiry Details</h4>
              <div className="mb-5">
                <label htmlFor="subject" className="block text-sm font-medium text-white mb-2.5">
                  Subject <span className="text-[var(--primary)] ml-1">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3.5 rounded-xl bg-[--color-surface]/80 border text-white text-sm focus:outline-none focus:ring-2 transition-all duration-200 hover:border-[--color-border] appearance-none cursor-pointer ${
                    errors.subject
                      ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
                      : "border-[--color-border]/60 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]/60"
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="" className="bg-[--color-surface] text-white">Select a subject</option>
                  <option value="general" className="bg-[--color-surface] text-white">General Inquiry</option>
                  <option value="sales" className="bg-[--color-surface] text-white">Sales & Pricing</option>
                  <option value="support" className="bg-[--color-surface] text-white">Technical Support</option>
                  <option value="partnership" className="bg-[--color-surface] text-white">Partnership Opportunities</option>
                  <option value="other" className="bg-[--color-surface] text-white">Other</option>
                </select>
                {errors.subject && <p className="text-red-400 text-xs mt-1.5">{errors.subject}</p>}
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white mb-2.5">
                  Message <span className="text-[var(--primary)] ml-1">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className={`w-full px-4 py-3.5 rounded-xl bg-[--color-surface]/80 border text-white placeholder-slate-500/60 text-sm focus:outline-none focus:ring-2 transition-all duration-200 resize-none hover:border-[--color-border] ${
                    errors.message
                      ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
                      : "border-[--color-border]/60 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]/60"
                  }`}
                  placeholder="Please provide a detailed description of your inquiry. Include any relevant information that will help us assist you better."
                />
                <div className="flex justify-between items-start mt-2">
                  {errors.message && <p className="text-red-400 text-xs">{errors.message}</p>}
                  <p className="text-slate-400 text-xs ml-auto">{formData.message.length}/5000</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[--color-border]/30 my-8"></div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                <span className="text-[var(--primary)] mr-1">*</span>
                <span>Required fields. Your information will be kept confidential.</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-10 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.3)]/30 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Inquiry
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
