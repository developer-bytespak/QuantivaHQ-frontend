"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: number;
  index: number;
}

function FeatureCard({ icon, title, description, gradient, delay, index }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { ref: cardRef, isVisible } = useScrollAnimation({ threshold: 0.2 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = Math.max(-15, Math.min(15, (y - centerY) / 12));
    const rotateY = Math.max(-15, Math.min(15, (centerX - x) / 12));
    setMousePosition({ x: rotateY, y: rotateX });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      className="group relative"
      style={{ perspective: "1200px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`relative overflow-hidden rounded-3xl border-2 border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/90 via-[--color-surface-alt]/70 to-[--color-surface-alt]/90 p-8 sm:p-10 backdrop-blur-xl transition-all duration-300 ${
          isHovered ? "border-[#fc4f02]/60 shadow-2xl shadow-[#fc4f02]/30" : "shadow-xl shadow-black/20"
        } ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{
          transform: isVisible
            ? isHovered
              ? `perspective(1200px) rotateX(${mousePosition.y}deg) rotateY(${mousePosition.x}deg) translateZ(40px) scale(1.03)`
              : `perspective(1200px) rotateX(0) rotateY(0) translateZ(0) scale(1)`
            : "perspective(1200px) rotateX(0) rotateY(0) translateZ(0) scale(1)",
          transformStyle: "preserve-3d",
          transition: isVisible
            ? `transform 0.3s cubic-bezier(0.23, 1, 0.32, 1) ${delay * 0.1}s, opacity 0.6s ease-out ${delay * 0.1}s, border-color 0.3s ease 0s, box-shadow 0.3s ease 0s`
            : `transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0s, opacity 0.6s ease-out 0s`,
        }}
      >
        {/* Animated gradient border glow */}
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-500 ${
            isHovered ? "opacity-20" : ""
          }`}
          style={{ transform: "translateZ(-5px)" }}
        />

        {/* 3D Depth layers */}
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-black/40 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ transform: "translateZ(-15px)" }}
        />

        {/* Animated corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-[#fc4f02]/20 to-transparent rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-[#fda300]/20 to-transparent rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Content with 3D depth */}
        <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
          {/* Icon container with enhanced 3D effect */}
          <div
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fc4f02]/30 via-[#fda300]/20 to-[#fc4f02]/30 backdrop-blur-sm border border-[#fc4f02]/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-2xl group-hover:shadow-[#fc4f02]/40"
            style={{ transform: "translateZ(40px)" }}
          >
            <div className="relative" style={{ transform: "translateZ(10px)" }}>
              {icon}
            </div>
            {/* Icon glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#fc4f02]/40 to-[#fda300]/40 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
          </div>

          {/* Title with 3D text effect */}
          <h3
            className={`mb-4 text-2xl font-bold text-white transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#fc4f02] group-hover:to-[#fda300] ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
              textShadow: isHovered ? "0 5px 20px rgba(252, 79, 2, 0.4)" : "none",
              transform: "translateZ(25px)",
              transitionDelay: isVisible ? `${delay * 0.1}s` : "0s",
            }}
          >
            {title}
          </h3>

          {/* Description */}
          <p
            className="text-sm leading-relaxed text-slate-300 group-hover:text-slate-200 transition-colors duration-300"
            style={{ transform: "translateZ(20px)" }}
          >
            {description}
          </p>
        </div>

        {/* Animated shine effect */}
        <div
          className={`absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ${
            isHovered ? "translate-x-full" : ""
          }`}
          style={{ transform: "translateZ(10px)" }}
        />

        {/* Floating particles effect on hover */}
        {isHovered && (
          <>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-[#fc4f02] opacity-60 animate-pulse"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + (i % 3) * 30}%`,
                  transform: `translateZ(${20 + i * 5}px)`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "2s",
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function ScrollAnimatedHeader({ title, titleHighlight, description }: { title: string; titleHighlight: string; description: string }) {
  const { ref: headerRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div
      ref={headerRef}
      className="text-center mb-10 sm:mb-16 md:mb-20"
    >
      <h2
        className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{
          transform: "translateZ(50px)",
        }}
      >
        {title}
        <br />
        <span className="bg-gradient-to-r from-[#fc4f02] via-[#fda300] to-[#fc4f02] bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
          {titleHighlight}
        </span>
      </h2>
      <p
        className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl text-slate-300 px-4"
        style={{ transform: "translateZ(30px)" }}
      >
        {description}
      </p>
    </div>
  );
}

export function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="h-10 w-10 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "AI-Driven Trading Strategies",
      description: "Leverage advanced machine learning algorithms to optimize portfolios across crypto and stocks. Our AI continuously learns from market patterns to deliver superior trading strategies.",
      gradient: "from-[#fc4f02] to-[#fda300]",
    },
    {
      icon: (
        <svg className="h-10 w-10 text-[#1d4ed8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      title: "Real-Time Sentiment Analysis",
      description: "Harness the power of sentiment intelligence from news, social media, and market data. Make informed decisions backed by comprehensive real-time market analysis.",
      gradient: "from-[#1d4ed8] to-[#3b82f6]",
    },
    {
      icon: (
        <svg className="h-10 w-10 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Portfolio Optimization",
      description: "Automatically optimize risk and return across your entire portfolio. Our system continuously rebalances positions to maximize gains while minimizing exposure.",
      gradient: "from-[#10b981] to-[#34d399]",
    },
    {
      icon: (
        <svg className="h-10 w-10 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {/* Central hub */}
          <circle cx="12" cy="12" r="3" strokeWidth="2" fill="currentColor" opacity="0.3" />
          <circle cx="12" cy="12" r="1.5" strokeWidth="2" fill="currentColor" />
          {/* Connected nodes */}
          <circle cx="6" cy="8" r="2" strokeWidth="1.5" fill="currentColor" opacity="0.4" />
          <circle cx="18" cy="8" r="2" strokeWidth="1.5" fill="currentColor" opacity="0.4" />
          <circle cx="6" cy="16" r="2" strokeWidth="1.5" fill="currentColor" opacity="0.4" />
          <circle cx="18" cy="16" r="2" strokeWidth="1.5" fill="currentColor" opacity="0.4" />
          {/* Connection lines */}
          <line x1="8.5" y1="9" x2="10.5" y2="11" strokeWidth="1.5" opacity="0.6" />
          <line x1="15.5" y1="9" x2="13.5" y2="11" strokeWidth="1.5" opacity="0.6" />
          <line x1="8.5" y1="15" x2="10.5" y2="13" strokeWidth="1.5" opacity="0.6" />
          <line x1="15.5" y1="15" x2="13.5" y2="13" strokeWidth="1.5" opacity="0.6" />
        </svg>
      ),
      title: "Multi-Exchange Connectivity",
      description: "Seamlessly connect and trade across Binance, Bybit, and Interactive Brokers. Manage all your accounts from one unified platform with real-time synchronization.",
      gradient: "from-[#f59e0b] to-[#d97706]",
    },
  ];

  return (
    <section id="features" className="relative pt-20 sm:pt-24 lg:pt-32 pb-20 sm:pb-24 lg:pb-32 overflow-hidden" style={{ perspective: "2000px" }}>
      {/* Realistic 3D trading background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ transformStyle: "preserve-3d" }}>
        {/* Subtle gradient orbs for depth */}
        <div
          className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-[#fc4f02]/8 to-[#fda300]/4 blur-3xl"
          style={{ transform: "translateZ(-200px)" }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-[#1d4ed8]/8 to-[#3b82f6]/4 blur-3xl"
          style={{ transform: "translateZ(-150px)" }}
        />

        {/* Realistic Trading Chart - Large background chart */}
        <div
          className="absolute top-0 right-0 w-2/5 h-full opacity-[0.12]"
          style={{ transform: "translateZ(-100px)" }}
        >
          <svg viewBox="0 0 500 800" className="w-full h-full text-[#fc4f02]">
            <defs>
              <linearGradient id="realChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fc4f02" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#fc4f02" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#fc4f02" stopOpacity="0" />
              </linearGradient>
              <pattern id="gridPattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
                <line x1="0" y1="0" x2="50" y2="0" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
              </pattern>
            </defs>
            {/* Grid background */}
            <rect width="500" height="800" fill="url(#gridPattern)" />
            {/* Realistic price chart with multiple data points */}
            <polyline
              points="30,700 50,680 70,690 90,650 110,670 130,630 150,640 170,600 190,610 210,580 230,590 250,560 270,570 290,540 310,550 330,520 350,530 370,500 390,510 410,490 430,480 450,460 470,450"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Area fill under chart */}
            <polygon
              points="30,700 50,680 70,690 90,650 110,670 130,630 150,640 170,600 190,610 210,580 230,590 250,560 270,570 290,540 310,550 330,520 350,530 370,500 390,510 410,490 430,480 450,460 470,450 470,800 30,800"
              fill="url(#realChartGradient)"
            />
            {/* Volume bars below chart */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((i) => {
              const height = 20 + Math.random() * 60;
              const x = 30 + i * 22;
              return (
                <rect
                  key={i}
                  x={x}
                  y={750 - height}
                  width="18"
                  height={height}
                  fill="currentColor"
                  opacity="0.15"
                />
              );
            })}
          </svg>
        </div>

        {/* Realistic Candlestick Chart - Center */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-[0.15]"
          style={{ transform: "translateZ(-80px)" }}
        >
          <svg viewBox="0 0 600 300" className="w-full h-full">
            <defs>
              <pattern id="candleGrid" x="0" y="0" width="40" height="30" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="30" stroke="#fc4f02" strokeWidth="0.3" opacity="0.1" />
                <line x1="0" y1="0" x2="40" y2="0" stroke="#fc4f02" strokeWidth="0.3" opacity="0.1" />
              </pattern>
            </defs>
            <rect width="600" height="300" fill="url(#candleGrid)" />
            {/* Realistic candlesticks */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map((i) => {
              const x = 30 + i * 22;
              const isGreen = i % 3 !== 0;
              const basePrice = 120 + (i % 5) * 10;
              const open = basePrice + (Math.sin(i) * 15);
              const close = open + (isGreen ? 8 + Math.random() * 12 : -8 - Math.random() * 12);
              const high = Math.max(open, close) + 5 + Math.random() * 8;
              const low = Math.min(open, close) - 5 - Math.random() * 8;
              const candleHeight = Math.abs(close - open);
              const candleY = Math.min(open, close);
              
              return (
                <g key={i}>
                  {/* Wick */}
                  <line
                    x1={x}
                    y1={300 - (high / 150) * 250}
                    x2={x}
                    y2={300 - (low / 150) * 250}
                    stroke={isGreen ? "#10b981" : "#ef4444"}
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                  {/* Body */}
                  <rect
                    x={x - 7}
                    y={300 - (candleY / 150) * 250 - (candleHeight / 150) * 250}
                    width="14"
                    height={Math.max((candleHeight / 150) * 250, 3)}
                    fill={isGreen ? "#10b981" : "#ef4444"}
                    opacity="0.7"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Realistic Portfolio Allocation - Bottom Left */}
        <div
          className="absolute bottom-32 left-20 w-80 h-80 opacity-[0.14]"
          style={{ transform: "translateZ(-110px)" }}
        >
          <svg viewBox="0 0 400 400" className="w-full h-full text-[#10b981]">
            <defs>
              <linearGradient id="pieGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="pieGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="pieGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fc4f02" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fda300" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Realistic pie chart segments */}
            <path
              d="M 200,200 L 200,100 A 100,100 0 0,1 300,200 Z"
              fill="url(#pieGradient1)"
            />
            <path
              d="M 200,200 L 300,200 A 100,100 0 0,1 250,300 Z"
              fill="url(#pieGradient2)"
            />
            <path
              d="M 200,200 L 250,300 A 100,100 0 0,1 150,300 Z"
              fill="url(#pieGradient3)"
            />
            <path
              d="M 200,200 L 150,300 A 100,100 0 0,1 100,200 Z"
              fill="url(#pieGradient1)"
            />
            <path
              d="M 200,200 L 100,200 A 100,100 0 0,1 200,100 Z"
              fill="url(#pieGradient2)"
            />
            {/* Center circle */}
            <circle cx="200" cy="200" r="40" fill="rgba(0, 0, 0, 0.3)" />
          </svg>
        </div>

        {/* Realistic Exchange Connection Hub - Top Right */}
        <div
          className="absolute top-24 right-24 w-96 h-72 opacity-[0.16]"
          style={{ transform: "translateZ(-90px)" }}
        >
          <svg viewBox="0 0 500 400" className="w-full h-full text-[#f59e0b]">
            {/* Central processing hub with realistic design */}
            <rect x="200" y="150" width="100" height="100" rx="8" fill="currentColor" opacity="0.2" />
            <rect x="210" y="160" width="80" height="80" rx="4" fill="currentColor" opacity="0.3" />
            {/* Exchange platforms */}
            {[
              { x: 50, y: 80, size: 60 },
              { x: 450, y: 80, size: 60 },
              { x: 50, y: 320, size: 60 },
              { x: 450, y: 320, size: 60 },
            ].map((platform, i) => (
              <g key={i}>
                {/* Platform box */}
                <rect
                  x={platform.x - platform.size / 2}
                  y={platform.y - platform.size / 2}
                  width={platform.size}
                  height={platform.size}
                  rx="6"
                  fill="currentColor"
                  opacity="0.15"
                />
                <rect
                  x={platform.x - platform.size / 2 + 5}
                  y={platform.y - platform.size / 2 + 5}
                  width={platform.size - 10}
                  height={platform.size - 10}
                  rx="3"
                  fill="currentColor"
                  opacity="0.2"
                />
                {/* Connection lines with data flow */}
                <line
                  x1={platform.x}
                  y1={platform.y}
                  x2="250"
                  y2="200"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.3"
                />
                {/* Animated data packets */}
                <circle
                  cx={(platform.x + 250) / 2}
                  cy={(platform.y + 200) / 2}
                  r="4"
                  fill="currentColor"
                  opacity="0.5"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Realistic Data Analysis Streams - Top Left */}
        <div
          className="absolute top-16 left-16 w-96 h-64 opacity-[0.13]"
          style={{ transform: "translateZ(-120px)" }}
        >
          <svg viewBox="0 0 500 300" className="w-full h-full text-[#1d4ed8]">
            <defs>
              <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            {/* Multiple data streams */}
            {[0, 1, 2, 3, 4, 5].map((stream) => (
              <g key={stream}>
                <polyline
                  points={`20,${50 + stream * 40} 80,${45 + stream * 40} 140,${55 + stream * 40} 200,${48 + stream * 40} 260,${52 + stream * 40} 320,${50 + stream * 40} 380,${53 + stream * 40} 440,${51 + stream * 40} 480,${52 + stream * 40}`}
                  fill="none"
                  stroke="url(#streamGradient)"
                  strokeWidth="2"
                  opacity="0.6"
                />
                {/* Data points */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((point) => (
                  <circle
                    key={point}
                    cx={20 + point * 57}
                    cy={50 + stream * 40 + (point % 2 === 0 ? -3 : 3)}
                    r="3.5"
                    fill="currentColor"
                    opacity="0.7"
                  />
                ))}
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pb-8">
        {/* Enhanced Section Header with 3D effect */}
        <ScrollAnimatedHeader
          title="Powerful Features for"
          titleHighlight="Modern Traders"
          description="Everything you need to trade smarter, faster, and more profitably"
        />

        {/* Features Grid with enhanced spacing and mobile-responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 pb-4" style={{ transformStyle: "preserve-3d" }}>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
              delay={0}
              index={index}
            />
          ))}
        </div>

        {/* Mobile Ticker - After Features */}
        <div className="md:hidden mt-8 bg-gradient-to-r from-[#fc4f02]/10 to-[#fda300]/10 rounded-2xl border border-slate-700/50 py-3 overflow-hidden">
          <div className="flex gap-4 text-xs font-mono text-slate-400">
            <div className="flex gap-8 animate-scroll-right whitespace-nowrap">
              {[
                { symbol: "NVDA", price: "485.20", change: "+2.64%" },
                { symbol: "MSFT", price: "378.90", change: "+0.87%" },
                { symbol: "SPY", price: "452.30", change: "+0.40%" },
                { symbol: "QQQ", price: "385.60", change: "-0.54%" },
              ].map((item, index) => (
                <div key={`bottom-mobile-${index}`} className="flex items-center gap-2 whitespace-nowrap">
                  <span>{item.symbol}</span>
                  <span className="text-white font-medium">${item.price}</span>
                  <span className={item.change.startsWith("+") ? "text-[#10b981]" : "text-[#ef4444]"}>
                    {item.change}
                  </span>
                </div>
              ))}
              {[
                { symbol: "NVDA", price: "485.20", change: "+2.64%" },
                { symbol: "MSFT", price: "378.90", change: "+0.87%" },
                { symbol: "SPY", price: "452.30", change: "+0.40%" },
                { symbol: "QQQ", price: "385.60", change: "-0.54%" },
              ].map((item, index) => (
                <div key={`bottom-mobile-dup-${index}`} className="flex items-center gap-2 whitespace-nowrap">
                  <span>{item.symbol}</span>
                  <span className="text-white font-medium">${item.price}</span>
                  <span className={item.change.startsWith("+") ? "text-[#10b981]" : "text-[#ef4444]"}>
                    {item.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
