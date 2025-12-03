"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SettingsBackButton } from "@/components/settings/settings-back-button";
import { useNotification, Notification } from "@/components/common/notification";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function HelpSupportPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [mounted, setMounted] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });

  const faqs: FAQ[] = [
    {
      id: "1",
      question: "How do I deposit funds into my account?",
      answer: "You can deposit funds by going to your portfolio page and clicking on 'Deposit'. You can use bank transfer, credit card, or cryptocurrency. All deposits are processed securely and typically complete within 1-3 business days.",
    },
    {
      id: "2",
      question: "What are the trading fees?",
      answer: "Our trading fees vary based on your account tier. Standard accounts have a 0.5% trading fee, while premium accounts enjoy reduced fees starting at 0.25%. Check your account settings for your specific fee structure.",
    },
    {
      id: "3",
      question: "How do I enable two-factor authentication?",
      answer: "Go to Settings > Security and toggle on Two-Factor Authentication. You'll be guided through the setup process which includes scanning a QR code with an authenticator app.",
    },
    {
      id: "4",
      question: "Can I trade cryptocurrencies and stocks on the same account?",
      answer: "Yes! QuantivaHQ supports both cryptocurrency and stock trading. You can switch between the two dashboards using the navigation menu. Your portfolio will show holdings from both markets.",
    },
    {
      id: "5",
      question: "How do I withdraw my funds?",
      answer: "Navigate to your portfolio page and click 'Withdraw'. Select your withdrawal method (bank transfer or cryptocurrency) and enter the amount. Withdrawals typically process within 1-5 business days depending on the method.",
    },
    {
      id: "6",
      question: "What is the VC Pool?",
      answer: "The VC Pool is our exclusive investment opportunity where qualified investors can participate in venture capital investments. Access is granted based on account tier and investment history.",
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedFAQ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedFAQ]);

  const handleSubmitContact = () => {
    if (!contactForm.subject || !contactForm.message) {
      showNotification("Please fill in all fields", "error");
      return;
    }
    // Here you would typically send this to your support system
    showNotification("Your message has been sent! We'll get back to you within 24 hours.", "success");
    setContactForm({ subject: "", message: "" });
  };

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      <SettingsBackButton />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">Help and Support</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="mailto:support@quantivahq.com"
              className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-xl p-6 hover:border-[#fc4f02]/30 transition-all duration-200 group"
            >
              <svg className="w-8 h-8 text-[#fc4f02] mb-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-1">Email Support</h3>
              <p className="text-sm text-slate-400">support@quantivahq.com</p>
            </a>
            <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-xl p-6">
              <svg className="w-8 h-8 text-[#fc4f02] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-1">Live Chat</h3>
              <p className="text-sm text-slate-400">Available 24/7</p>
            </div>
            <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-xl p-6">
              <svg className="w-8 h-8 text-[#fc4f02] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-1">Phone Support</h3>
              <p className="text-sm text-slate-400">+1 (555) 123-4567</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <button
                key={faq.id}
                onClick={() => setSelectedFAQ(faq)}
                className="w-full bg-[--color-surface]/50 border border-[--color-border]/50 rounded-xl p-6 hover:border-[#fc4f02]/30 transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white pr-4 group-hover:text-[#fc4f02] transition-colors">{faq.question}</span>
                  <svg
                    className="w-5 h-5 text-[#fc4f02] flex-shrink-0 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Overlay */}
        {selectedFAQ && mounted && typeof window !== "undefined" && createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedFAQ(null)}
          >
            <div
              className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedFAQ.question}</h2>
                </div>
                <button
                  onClick={() => setSelectedFAQ(null)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Answer Content */}
              <div className="space-y-4">
                <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-xl p-6">
                  <p className="text-slate-300 leading-relaxed text-base">{selectedFAQ.answer}</p>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Contact Form */}
        <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
              <input
                type="text"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[--color-surface] border border-[--color-border] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50"
                placeholder="What can we help you with?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 rounded-lg bg-[--color-surface] border border-[--color-border] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 resize-none"
                placeholder="Please describe your issue or question in detail..."
              />
            </div>
            <button
              onClick={handleSubmitContact}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fd6a00] text-white font-medium hover:from-[#fd6a00] hover:to-[#fd8a00] transition-all duration-200"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

