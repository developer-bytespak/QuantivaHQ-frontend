"use client";

export default function VCPoolPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center pb-8">
      <div className="group cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-12 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02]">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
            <svg
              className="h-10 w-10 text-[#fc4f02]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="mb-3 text-3xl font-bold text-white">VC Pool</h2>

          {/* Coming Soon Text */}
          <p className="mb-2 text-lg font-semibold text-[#fc4f02]">Coming Soon</p>
          <p className="max-w-md text-sm text-slate-400">
            We're working on something exciting! The VC Pool feature will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}

