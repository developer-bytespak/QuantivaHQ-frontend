"use client";

import { useState } from "react";
import Image from "next/image";

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: string;
}

function StepCard({ number, title, description, icon, delay }: StepProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 12;
    const rotateY = (centerX - x) / 12;
    setMousePosition({ x: rotateY, y: rotateX });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div
      className={`relative group ${delay}`}
      style={{ perspective: "1000px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Connection Line (for desktop) */}
      {number < 4 && (
        <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-[#fc4f02]/30 to-transparent z-0" style={{ width: "calc(100% - 4rem)" }}>
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#fc4f02] transition-all duration-300 ${isHovered ? "scale-150" : ""}`} />
        </div>
      )}

      <div 
        className="relative rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 sm:p-8 backdrop-blur transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20"
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${mousePosition.y}deg) rotateY(${mousePosition.x}deg) translateZ(25px) scale(1.02)`
            : "perspective(1000px) rotateX(0) rotateY(0) translateZ(0) scale(1)",
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Step Number Badge with 3D effect */}
        <div 
          className="absolute -top-4 -left-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] text-xl font-bold text-white shadow-lg shadow-[#fc4f02]/30 transition-transform duration-300 group-hover:scale-110"
          style={{ transform: "translateZ(30px)" }}
        >
          {number}
        </div>

        {/* 3D Depth Shadow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ transform: "translateZ(-15px)" }} />

        {/* Icon */}
        <div 
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 transition-transform duration-300 group-hover:scale-110"
          style={{ transform: "translateZ(20px)" }}
        >
          {icon}
        </div>

        {/* Content */}
        <div style={{ transform: "translateZ(15px)" }}>
          <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-400">{description}</p>
        </div>
      </div>
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
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8">
            <Image src="/binance logo.png" alt="Binance" width={32} height={32} className="object-contain" />
          </div>
          <div className="relative h-6 w-6">
            <Image src="/bybit logo.png" alt="Bybit" width={24} height={24} className="object-contain" />
          </div>
          <div className="relative h-6 w-6">
            <Image src="/IBKR_logo.png" alt="IBKR" width={24} height={24} className="object-contain" />
          </div>
        </div>
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
    <section id="how-it-works" className="relative py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            How It
            <span className="bg-gradient-to-r from-[#fc4f02] to-[#fda300] bg-clip-text text-transparent"> Works</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Get started in minutes and start trading smarter today
          </p>
        </div>

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

