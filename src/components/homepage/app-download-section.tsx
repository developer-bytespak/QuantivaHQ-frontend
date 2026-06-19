"use client";

// Replace with the live Play Store listing URL once published.
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.quantivahq.app";

export function AppDownloadSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background image: warm city financial skyline at golden hour */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=2000&q=80')",
          }}
        />
        {/* Overlay so the content stays readable and the image stays subtle */}
        <div className="absolute inset-0 bg-black/65" />
        {/* Warm primary tint to match the homepage palette */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(var(--primary-rgb),0.30)] via-transparent to-[rgba(var(--primary-light-rgb),0.20)]" />
      </div>

      {/* Wavy top edge — the black page background curves into the section,
          matching the background of the section above */}
      <div className="absolute top-0 left-0 right-0 -translate-y-px pointer-events-none z-10">
        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="w-full h-[80px] sm:h-[120px] md:h-[160px]"
          aria-hidden="true"
        >
          <path
            d="M0,0 L1440,0 L1440,70 C1200,180 980,30 720,90 C460,150 240,20 0,120 Z"
            fill="#000000"
          />
        </svg>
      </div>

      {/* Wavy bottom edge — curves back into the black page background */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-px pointer-events-none z-10">
        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="w-full h-[80px] sm:h-[120px] md:h-[160px]"
          aria-hidden="true"
        >
          <path
            d="M0,200 L1440,200 L1440,130 C1200,20 980,170 720,110 C460,50 240,180 0,80 Z"
            fill="#000000"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 sm:py-28 md:py-32 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--primary-rgb),0.4)] bg-[rgba(var(--primary-rgb),0.1)] px-4 py-1.5 text-xs sm:text-sm font-medium text-[var(--primary-light)] mb-6">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)]" />
          </span>
          Now Available
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
          The Quantiva HQ app is now
          <br />
          <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] bg-clip-text text-transparent">
            live on Google Play
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
          Trade smarter on the go. Take AI-powered insights, real-time alerts, and
          your full portfolio with you — anywhere, anytime. Download Quantiva HQ for
          Android today.
        </p>

        {/* Buttons */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {/* Google Play */}
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-6 py-3.5 text-white shadow-xl shadow-[rgba(var(--primary-rgb),0.3)] transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl w-full sm:w-auto justify-center"
          >
            <svg className="h-7 w-7 shrink-0" viewBox="0 0 512 512" aria-hidden="true">
              <path fill="#ffffff" d="M48 59.49v393a14 14 0 0 0 23.29 10.52L297 256 71.29 48.97A14 14 0 0 0 48 59.49z" opacity="0.9" />
              <path fill="#ffffff" d="M345.8 304L92.1 477.6a14 14 0 0 0 4.6 1.9L345.8 304z" opacity="0.7" />
              <path fill="#ffffff" d="M412.3 226.2l-66.5-37.7L297 256l48.8 67.5 66.5-37.7a30 30 0 0 0 0-59.6z" opacity="0.95" />
              <path fill="#ffffff" d="M96.7 32.5a14 14 0 0 0-4.6 1.9L345.8 208 297 256z" opacity="0.6" />
            </svg>
            <span className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-medium opacity-90">GET IT ON</span>
              <span className="text-base font-semibold">Google Play</span>
            </span>
          </a>

          {/* App Store — coming soon */}
          <div className="inline-flex items-center gap-3 rounded-full border-2 border-slate-600 bg-slate-900/40 backdrop-blur px-6 py-3.5 text-slate-300 w-full sm:w-auto justify-center cursor-default">
            <svg className="h-7 w-7 shrink-0" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            <span className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-medium opacity-90">COMING SOON TO</span>
              <span className="text-base font-semibold">App Store</span>
            </span>
          </div>
        </div>

        <p className="mt-5 text-sm font-medium text-slate-200">
          iOS version arriving on the Apple App Store soon.
        </p>
      </div>
    </section>
  );
}
