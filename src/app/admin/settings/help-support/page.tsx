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

const faqs: FAQ[] = [
  { id: "1", question: "How do I create a VC pool?", answer: "Go to Pools and click Create pool. Set name, default fees, and payment window. Share the pool link with participants." },
  { id: "2", question: "How do I receive payments?", answer: "Set your deposit wallet in Settings > Exchange Configuration or Binance UID. Users send USDT (BSC) to that address. Approve payments in pool details." },
  { id: "3", question: "What are default fees for?", answer: "Default pool fee, admin profit fee, and cancellation fee apply to new pools. You can edit them when creating or in pool settings." },
  { id: "4", question: "How do I approve or reject a payment?", answer: "Open the pool from Pools, go to Payments, and use Approve or Reject for each pending payment." },
  { id: "5", question: "Who do I contact for admin support?", answer: "Email support@quantivahq.com for admin panel and VC pool support." },
];

export default function AdminHelpSupportPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedFAQ ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedFAQ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={hideNotification} />
      )}
      <SettingsBackButton backHref="/admin/settings" />

      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">Help and Support</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
          <a
            href="mailto:support@quantivahq.com"
            className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-[#fc4f02]/30 transition-all group"
          >
            <svg className="w-6 sm:w-8 h-6 sm:h-8 text-[#fc4f02] mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Email Support</h3>
            <p className="text-xs sm:text-sm text-slate-400">support@quantivahq.com</p>
          </a>
          <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <svg className="w-6 sm:w-8 h-6 sm:h-8 text-[#fc4f02] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Admin support</h3>
            <p className="text-xs sm:text-sm text-slate-400">VC pools and payments</p>
          </div>
        </div>

        <h2 className="text-lg sm:text-2xl font-bold text-white mb-4">FAQ</h2>
        <div className="space-y-2 mb-8">
          {faqs.map((faq) => (
            <button
              key={faq.id}
              onClick={() => setSelectedFAQ(faq)}
              className="w-full bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-[#fc4f02]/30 transition-all text-left group"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold text-white group-hover:text-[#fc4f02] transition-colors">{faq.question}</span>
                <svg className="w-4 h-4 text-[#fc4f02] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedFAQ && mounted && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedFAQ(null)}>
          <div className="relative w-full max-w-2xl rounded-xl border border-[--color-border] bg-[--color-surface] p-4 sm:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-2xl font-bold text-white">{selectedFAQ.question}</h2>
              <button onClick={() => setSelectedFAQ(null)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-slate-300 text-sm sm:text-base">{selectedFAQ.answer}</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
