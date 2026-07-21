"use client";

import Image from "next/image";
import { Reveal } from "./motion/reveal";
import { Parallax } from "./motion/parallax";
import { GradientText } from "./motion/gradient-text";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.quantivahq.app";
const APP_STORE_URL = "https://apps.apple.com/app/quantiva-hq/id6762023500";

/** CSS-built phone mockup — no external assets. */
function PhoneMockup() {
  return (
    <div className="hp-float relative mx-auto w-56 sm:w-60">
      {/* Glow */}
      <div className="absolute -inset-8 rounded-[4rem] bg-[radial-gradient(circle,rgba(var(--primary-rgb),0.22),transparent_70%)] blur-2xl" />
      {/* Frame */}
      <div className="relative aspect-[9/17] overflow-hidden rounded-[2.4rem] border-[6px] border-[#1c1c1c] bg-black shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        {/* Notch */}
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#1c1c1c]" />
        {/* Screen */}
        <div className="flex h-full flex-col gap-2.5 bg-gradient-to-b from-[#0c0c0c] to-black px-4 pb-4 pt-9">
          {/* App header */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">QuantivaHQ</span>
            <span className="h-5 w-5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)]" />
          </div>
          {/* Portfolio value */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-3">
            <p className="text-[9px] uppercase tracking-wide text-slate-500">Portfolio Value</p>
            <p className="mt-0.5 text-lg font-bold text-white">$128,540.22</p>
            <p className="text-[10px] font-medium text-[#34d399]">+4.8% today</p>
          </div>
          {/* Chart */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
            <svg viewBox="0 0 200 70" className="w-full">
              <defs>
                <linearGradient id="hpPhoneChart" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M2,58 C25,52 38,40 58,44 C78,48 90,28 112,30 C134,32 148,16 172,14 C186,12 194,8 198,6"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M2,58 C25,52 38,40 58,44 C78,48 90,28 112,30 C134,32 148,16 172,14 C186,12 194,8 198,6 L198,70 L2,70 Z"
                fill="url(#hpPhoneChart)"
              />
            </svg>
          </div>
          {/* QHQ balance chip */}
          <div className="flex items-center gap-2.5 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/[0.08] px-3.5 py-2.5">
            <Image src="/qhq_token.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
            <div>
              <p className="text-[9px] uppercase tracking-wide text-slate-400">QHQ Balance</p>
              <p className="text-xs font-bold text-white">1,240 QHQ</p>
            </div>
          </div>
          {/* Signal row */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-white">BUY · ETH/USDT</span>
              <span className="text-[9px] text-[var(--primary-light)]">AI Signal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppDownloadSection() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Inset panel */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#111] to-black px-5 py-12 sm:rounded-[2.5rem] sm:px-12 sm:py-20 lg:px-16">
          {/* Panel ambience */}
          <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-[var(--primary)]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-[var(--primary-light)]/10 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Copy + buttons */}
            <div className="text-center lg:text-left">
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--primary-rgb),0.4)] bg-[rgba(var(--primary-rgb),0.1)] px-4 py-1.5 text-xs font-medium text-[var(--primary-light)] sm:text-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)]" />
                  </span>
                  Now Available
                </div>
              </Reveal>

              <Reveal delay={0.08}>
                {/* Fluid size + nowrap keeps each line whole on every viewport */}
                <h2 className="mt-6 text-[clamp(1.05rem,4.2vw,2.4rem)] font-bold leading-tight tracking-tight text-white">
                  <span className="whitespace-nowrap">The Quantiva HQ app is now</span>
                  <br />
                  <span className="whitespace-nowrap">
                    <GradientText>live on iOS &amp; Android</GradientText>
                  </span>
                </h2>
              </Reveal>

              <Reveal delay={0.16}>
                <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base lg:mx-0">
                  Trade smarter on the go. Take AI-powered insights, real-time alerts, and your full
                  portfolio with you — anywhere, anytime. Download Quantiva HQ on the App Store or
                  Google Play today.
                </p>
              </Reveal>

              <Reveal delay={0.24}>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start">
                  {/* Google Play */}
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-6 py-3.5 text-white shadow-xl shadow-[rgba(var(--primary-rgb),0.3)] transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl sm:w-auto"
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

                  {/* App Store */}
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3.5 text-white backdrop-blur transition-all duration-300 hover:scale-[1.03] hover:bg-white/[0.1] sm:w-auto"
                  >
                    <svg className="h-7 w-7 shrink-0" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                    </svg>
                    <span className="flex flex-col items-start leading-none">
                      <span className="text-[10px] font-medium opacity-90">DOWNLOAD ON THE</span>
                      <span className="text-base font-semibold">App Store</span>
                    </span>
                  </a>
                </div>
              </Reveal>

              <Reveal delay={0.3}>
                <p className="mt-5 text-sm font-medium text-slate-400">
                  Now available on both the Apple App Store and Google Play.
                </p>
              </Reveal>
            </div>

            {/* Phone mockup */}
            <Reveal y={48} amount={0.3}>
              <Parallax speed={0.1}>
                <PhoneMockup />
              </Parallax>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
