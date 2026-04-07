import Link from "next/link";
import { TermsContent } from "@/components/legal/terms-content";

export default function PublicTermsPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[--color-border] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back home
          </Link>
        </div>

        <TermsContent title="Terms and Conditions" />
      </div>
    </div>
  );
}