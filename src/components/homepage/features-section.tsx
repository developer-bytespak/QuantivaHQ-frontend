"use client";

import { useState } from "react";
import Image from "next/image";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: string;
}

function FeatureCard({ icon, title, description, gradient, delay }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 sm:p-8 backdrop-blur transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02] ${delay}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 ${
          isHovered ? "opacity-10" : ""
        }`}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      </div>

      {/* Shine effect */}
      <div
        className={`absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ${
          isHovered ? "translate-x-full" : ""
        }`}
      />
    </div>
  );
}

export function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="h-8 w-8 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "AI-Driven Trading Strategies",
      description: "Leverage advanced machine learning algorithms to optimize portfolios across crypto and stocks. Our AI continuously learns from market patterns to deliver superior trading strategies.",
      gradient: "from-[#fc4f02] to-[#fda300]",
      delay: "animate-fade-in",
    },
    {
      icon: (
        <svg className="h-8 w-8 text-[#1d4ed8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      title: "Real-Time Sentiment Analysis",
      description: "Harness the power of sentiment intelligence from news, social media, and market data. Make informed decisions backed by comprehensive real-time market analysis.",
      gradient: "from-[#1d4ed8] to-[#3b82f6]",
      delay: "animate-fade-in",
      style: { animationDelay: "0.1s" },
    },
    {
      icon: (
        <svg className="h-8 w-8 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Portfolio Optimization",
      description: "Automatically optimize risk and return across your entire portfolio. Our system continuously rebalances positions to maximize gains while minimizing exposure.",
      gradient: "from-[#10b981] to-[#34d399]",
      delay: "animate-fade-in",
      style: { animationDelay: "0.2s" },
    },
    {
      icon: (
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8">
            <Image src="/binance logo.png" alt="Binance" width={32} height={32} className="object-contain opacity-80" />
          </div>
          <div className="relative h-6 w-6">
            <Image src="/bybit logo.png" alt="Bybit" width={24} height={24} className="object-contain opacity-80" />
          </div>
          <div className="relative h-6 w-6">
            <Image src="/IBKR_logo.png" alt="IBKR" width={24} height={24} className="object-contain opacity-80" />
          </div>
        </div>
      ),
      title: "Multi-Exchange Connectivity",
      description: "Seamlessly connect and trade across Binance, Bybit, and Interactive Brokers. Manage all your accounts from one unified platform with real-time synchronization.",
      gradient: "from-[#f59e0b] to-[#d97706]",
      delay: "animate-fade-in",
      style: { animationDelay: "0.3s" },
    },
  ];

  return (
    <section id="features" className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Subtle trading chart background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-0 right-0 w-1/3 h-full">
          <svg viewBox="0 0 400 600" className="w-full h-full text-[#fc4f02]">
            <polyline
              points="20,500 60,450 100,480 140,420 180,440 220,400 260,380 300,360 340,340 380,320"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-1/4 h-1/2">
          <svg viewBox="0 0 300 300" className="w-full h-full text-[#fda300]">
            <polyline
              points="20,250 50,200 80,220 110,180 140,170 170,150 200,130 230,110 260,100 280,90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Powerful Features for
            <br />
            <span className="bg-gradient-to-r from-[#fc4f02] to-[#fda300] bg-clip-text text-transparent">
              Modern Traders
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Everything you need to trade smarter, faster, and more profitably
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

