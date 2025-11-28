"use client";

import { useState, useEffect, useRef } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: string;
}

function StepCard({ number, title, description, icon, delay }: StepProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { ref: cardRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div
      ref={cardRef}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Line (for desktop) */}
      {number < 4 && (
        <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-[#fc4f02]/30 to-transparent z-0 pointer-events-none" style={{ width: "calc(100% - 4rem)" }}>
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#fc4f02] transition-transform duration-300 ${isHovered ? "scale-150" : "scale-100"}`} style={{ willChange: "transform" }} />
        </div>
      )}

      <div 
        className={`relative rounded-3xl border-2 border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/90 via-[--color-surface-alt]/70 to-[--color-surface-alt]/90 p-6 sm:p-8 backdrop-blur-xl transition-all duration-700 hover:border-[#fc4f02]/60 hover:shadow-2xl hover:shadow-[#fc4f02]/30 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ 
          willChange: "transform",
          transitionDelay: isVisible ? `${number * 100}ms` : "0ms"
        }}
      >
        {/* Gradient overlay on hover */}
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#fc4f02]/10 via-[#fda300]/5 to-[#fc4f02]/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-[#fc4f02]/15 to-transparent rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-[#fda300]/15 to-transparent rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Step Number Badge */}
        <div 
          className="absolute -top-5 -left-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] text-xl font-bold text-white shadow-xl shadow-[#fc4f02]/40 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-[#fc4f02]/50 z-20"
        >
          {number}
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
        </div>

        {/* Icon */}
        <div 
          className="mb-5 flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fc4f02]/30 via-[#fda300]/20 to-[#fc4f02]/30 backdrop-blur-sm border border-[#fc4f02]/20 transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-[#fc4f02]/40"
        >
          <div className="relative">
            {icon}
          </div>
          {/* Icon glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#fc4f02]/40 to-[#fda300]/40 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
        </div>

        {/* Content */}
        <div>
          <h3 
            className={`mb-3 text-xl font-bold text-white transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#fc4f02] group-hover:to-[#fda300] ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: isVisible ? `${(number * 100) + 100}ms` : "0ms" }}
          >
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ScrollAnimatedHeader({ title, titleHighlight, description }: { title: string; titleHighlight: string; description: string }) {
  const { ref: headerRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div
      ref={headerRef}
      className="text-center mb-16 sm:mb-20"
    >
      <h2 className={`text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}>
        {title}
        <span className="bg-gradient-to-r from-[#fc4f02] to-[#fda300] bg-clip-text text-transparent"> {titleHighlight}</span>
      </h2>
      <p className="mx-auto max-w-2xl text-xl text-slate-300">
        {description}
      </p>
    </div>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: "Sign Up & Connect Accounts",
      description: "Create your account and securely connect your exchange accounts. We support Binance, Bybit, and Interactive Brokers with industry-standard encryption.",
      icon: (
        <svg className="h-10 w-10 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {/* Central hub */}
          <circle cx="12" cy="12" r="3" strokeWidth="2" fill="currentColor" fillOpacity="0.2" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          
          {/* Connected platforms - Top */}
          <circle cx="12" cy="4" r="2" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3" />
          <line x1="12" y1="6" x2="12" y2="9" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Connected platforms - Bottom */}
          <circle cx="12" cy="20" r="2" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3" />
          <line x1="12" y1="18" x2="12" y2="15" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Connected platforms - Left */}
          <circle cx="4" cy="12" r="2" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3" />
          <line x1="6" y1="12" x2="9" y2="12" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Connected platforms - Right */}
          <circle cx="20" cy="12" r="2" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3" />
          <line x1="18" y1="12" x2="15" y2="12" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Diagonal connections */}
          <circle cx="6" cy="6" r="1.5" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
          <line x1="7.5" y1="7.5" x2="10" y2="10" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" opacity="0.5" />
          
          <circle cx="18" cy="6" r="1.5" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
          <line x1="16.5" y1="7.5" x2="14" y2="10" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" opacity="0.5" />
          
          <circle cx="6" cy="18" r="1.5" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
          <line x1="7.5" y1="16.5" x2="10" y2="14" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" opacity="0.5" />
          
          <circle cx="18" cy="18" r="1.5" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
          <line x1="16.5" y1="16.5" x2="14" y2="14" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" opacity="0.5" />
        </svg>
      ),
      delay: "animate-fade-in",
    },
    {
      number: 2,
      title: "AI Trading Strategies & Market Sentiment",
      description: "Our AI analyzes market data, news, and social sentiment in real-time to identify profitable trading opportunities across crypto and stocks.",
      icon: (
        <svg className="h-8 w-8 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      delay: "animate-fade-in",
      style: { animationDelay: "0.1s" },
    },
    {
      number: 3,
      title: "Receive Trade Recommendations",
      description: "Get personalized trade recommendations based on your risk profile, portfolio goals, and market conditions. Review detailed analysis before executing.",
      icon: (
        <svg className="h-8 w-8 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      delay: "animate-fade-in",
      style: { animationDelay: "0.2s" },
    },
    {
      number: 4,
      title: "Approve and Execute Trades",
      description: "Review recommendations and approve trades with one click. Our system handles execution, position sizing, and risk management automatically.",
      icon: (
        <svg className="h-8 w-8 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      delay: "animate-fade-in",
      style: { animationDelay: "0.3s" },
    },
  ];

  return (
    <section id="how-it-works" className="relative pt-0 pb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollAnimatedHeader
          title="How It"
          titleHighlight="Works"
          description="Get started in minutes and start trading smarter today"
        />

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
              delay={step.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

