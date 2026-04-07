import Link from "next/link";
import { TermsContent } from "@/components/legal/terms-content";

export default function PublicTermsPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-24 left-10 h-72 w-72 rounded-full bg-[var(--primary)]/10 blur-3xl" />
        <div className="absolute bottom-16 right-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Legal</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-4xl">QuantivaHQ Terms</h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[--color-border] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
          >
            Back home
          </Link>
        </div>

        <TermsContent />
      </div>
    </div>
  );
}