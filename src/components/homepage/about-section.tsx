"use client";

import { useState, useEffect, useRef } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

// Floating Coin component that moves in circular orbit
function FloatingCoin({ 
  coinType, 
  size, 
  orbitRadius, 
  orbitDuration, 
  startAngle, 
  delay,
  direction = 1,
  blur = false 
}: { 
  coinType: "btc" | "eth" | "usdt" | "bnb" | "xrp" | "sol";
  size: number;
  orbitRadius: number;
  orbitDuration: number;
  startAngle: number;
  delay: number;
  direction?: 1 | -1;
  blur?: boolean;
}) {
  const coinConfig = {
    btc: { color: "#F7931A", symbol: "₿", name: "BTC" },
    eth: { color: "#627EEA", symbol: "Ξ", name: "ETH" },
    usdt: { color: "#26A17B", symbol: "₮", name: "USDT" },
    bnb: { color: "#F3BA2F", symbol: "B", name: "BNB" },
    xrp: { color: "#23292F", symbol: "X", name: "XRP" },
    sol: { color: "#9945FF", symbol: "◎", name: "SOL" },
  };

  const config = coinConfig[coinType];

  return (
    <div
      className={`absolute pointer-events-none ${blur ? "blur-[1px]" : ""}`}
      style={{
        width: size,
        height: size,
        left: "50%",
        top: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
        animation: `orbit${direction === 1 ? "" : "Reverse"} ${orbitDuration}s linear infinite`,
        animationDelay: `${delay}s`,
        transformOrigin: "center center",
      }}
    >
      <div
        className="relative w-full h-full"
        style={{
          transform: `translateX(${orbitRadius}px) rotate(${startAngle}deg)`,
        }}
      >
        {/* Coin glow */}
        <div 
          className="absolute inset-0 rounded-full animate-pulse"
          style={{ 
            background: `radial-gradient(circle, ${config.color}40 0%, transparent 70%)`,
            transform: "scale(1.5)",
            animationDuration: "2s",
          }}
        />
        
        {/* Coin body */}
        <div 
          className="absolute inset-0 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${config.color}ee 0%, ${config.color}aa 50%, ${config.color}dd 100%)`,
            boxShadow: `0 0 20px ${config.color}60, 0 4px 15px rgba(0,0,0,0.3)`,
            animation: "coinSpin 3s linear infinite",
            animationDelay: `${delay * 0.5}s`,
          }}
        >
          {/* Coin symbol */}
          <span 
            className="font-bold text-white drop-shadow-lg select-none"
            style={{ fontSize: size * 0.4 }}
          >
            {config.symbol}
          </span>
          
          {/* Shine effect */}
          <div 
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)",
            }}
          />
        </div>

        {/* Trail effect */}
        <div 
          className="absolute rounded-full opacity-30"
          style={{
            width: size * 0.8,
            height: size * 0.8,
            left: -size * 0.3,
            top: size * 0.1,
            background: `radial-gradient(ellipse, ${config.color}50 0%, transparent 70%)`,
            filter: "blur(4px)",
          }}
        />
      </div>
    </div>
  );
}

// Animated orbit container for multiple coins
function CoinOrbitSystem() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Center point reference */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Orbit rings visualization */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[var(--primary)]/10 rounded-full animate-spin" style={{ animationDuration: "60s" }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-[var(--primary)]/10 rounded-full animate-spin" style={{ animationDuration: "45s", animationDirection: "reverse" }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-[var(--primary-light)]/10 rounded-full animate-spin" style={{ animationDuration: "30s" }} />
      </div>
      
      {/* Large outer orbit coins */}
      <FloatingCoin coinType="btc" size={56} orbitRadius={280} orbitDuration={25} startAngle={0} delay={0} />
      <FloatingCoin coinType="eth" size={48} orbitRadius={280} orbitDuration={25} startAngle={120} delay={0.5} />
      <FloatingCoin coinType="bnb" size={44} orbitRadius={280} orbitDuration={25} startAngle={240} delay={1} />
      
      {/* Medium orbit coins - reverse direction */}
      <FloatingCoin coinType="sol" size={40} orbitRadius={180} orbitDuration={18} startAngle={60} delay={0.3} direction={-1} />
      <FloatingCoin coinType="usdt" size={36} orbitRadius={180} orbitDuration={18} startAngle={180} delay={0.8} direction={-1} />
      <FloatingCoin coinType="xrp" size={32} orbitRadius={180} orbitDuration={18} startAngle={300} delay={1.3} direction={-1} />
      
      {/* Inner orbit coins */}
      <FloatingCoin coinType="eth" size={28} orbitRadius={90} orbitDuration={12} startAngle={45} delay={0.2} blur />
      <FloatingCoin coinType="btc" size={24} orbitRadius={90} orbitDuration={12} startAngle={225} delay={0.7} blur />
      
      {/* Scattered floating coins at edges */}
      <div className="absolute top-[10%] left-[5%]">
        <FloatingCoin coinType="btc" size={32} orbitRadius={30} orbitDuration={8} startAngle={0} delay={0.5} />
      </div>
      <div className="absolute top-[20%] right-[8%]">
        <FloatingCoin coinType="eth" size={28} orbitRadius={25} orbitDuration={6} startAngle={90} delay={1} direction={-1} />
      </div>
      <div className="absolute bottom-[25%] left-[10%]">
        <FloatingCoin coinType="sol" size={24} orbitRadius={20} orbitDuration={7} startAngle={180} delay={0.3} />
      </div>
      <div className="absolute bottom-[15%] right-[5%]">
        <FloatingCoin coinType="bnb" size={30} orbitRadius={35} orbitDuration={9} startAngle={270} delay={0.8} direction={-1} />
      </div>
      <div className="absolute top-[60%] left-[3%]">
        <FloatingCoin coinType="usdt" size={22} orbitRadius={18} orbitDuration={5} startAngle={45} delay={1.2} />
      </div>
      <div className="absolute top-[40%] right-[3%]">
        <FloatingCoin coinType="xrp" size={26} orbitRadius={22} orbitDuration={6} startAngle={135} delay={0.6} direction={-1} />
      </div>
    </div>
  );
}

// Wave animation background
function WaveBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <svg className="absolute w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="var(--primary-light)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary-light)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary-light)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        
        {/* Animated wave 1 */}
        <path
          fill="url(#waveGrad1)"
          d="M0,400 C360,300 720,500 1080,400 C1260,350 1380,380 1440,400 L1440,800 L0,800 Z"
          style={{
            animation: "waveMove1 8s ease-in-out infinite",
          }}
        />
        
        {/* Animated wave 2 */}
        <path
          fill="url(#waveGrad2)"
          d="M0,500 C240,400 480,600 720,500 C960,400 1200,550 1440,500 L1440,800 L0,800 Z"
          style={{
            animation: "waveMove2 10s ease-in-out infinite",
            animationDelay: "1s",
          }}
        />
      </svg>
    </div>
  );
}

// Animated connection lines between elements
function ConnectionLines({ isVisible }: { isVisible: boolean }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Animated dashed lines */}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={`${20 + i * 20}%`}
          y1="10%"
          x2={`${30 + i * 15}%`}
          y2="90%"
          stroke="url(#lineGrad)"
          strokeWidth="1"
          strokeDasharray="8,8"
          className={`transition-all duration-1000 ${isVisible ? "opacity-30" : "opacity-0"}`}
          style={{
            animation: isVisible ? `dashMove ${5 + i}s linear infinite` : "none",
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </svg>
  );
}

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, start: number = 0, isVisible: boolean = false) {
  const [count, setCount] = useState(start);
  const countRef = useRef(start);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      countRef.current = Math.floor(start + (end - start) * easeOutQuart);
      setCount(countRef.current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, start, isVisible]);

  return count;
}

// Animated text reveal component
function AnimatedText({ text, className, delay = 0, isVisible }: { text: string; className?: string; delay?: number; isVisible: boolean }) {
  return (
    <span 
      className={`inline-block overflow-hidden ${className}`}
      style={{ perspective: "1000px" }}
    >
      {text.split("").map((char, i) => (
        <span
          key={i}
          className={`inline-block transition-all duration-500 ${
            isVisible ? "opacity-100 translate-y-0 rotate-0" : "opacity-0 translate-y-8 rotate-12"
          }`}
          style={{
            transitionDelay: isVisible ? `${delay + i * 30}ms` : "0ms",
            transformOrigin: "bottom left",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

// Floating particle component
function FloatingParticle({ delay, size, left, top, duration }: { delay: number; size: number; left: string; top: string; duration: number }) {
  return (
    <div
      className="absolute rounded-full bg-gradient-to-br from-[var(--primary)]/30 to-[var(--primary-light)]/20 blur-sm pointer-events-none"
      style={{
        width: size,
        height: size,
        left,
        top,
        animation: `float ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

// Stats card with counter animation
function StatCard({ value, suffix, label, icon, index, isVisible }: { 
  value: number; 
  suffix: string; 
  label: string; 
  icon: React.ReactNode;
  index: number;
  isVisible: boolean;
}) {
  const count = useCountUp(value, 2500, 0, isVisible);
  
  return (
    <div
      className={`relative group transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
      }`}
      style={{ transitionDelay: isVisible ? `${400 + index * 150}ms` : "0ms" }}
    >
      <div className="relative rounded-2xl border border-[--color-border]/50 bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-sm p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:border-[var(--primary)]/50 hover:shadow-lg hover:shadow-[rgba(var(--primary-rgb),0.15)]">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Icon */}
        <div className="relative mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-light)]/10 text-[var(--primary)] transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        
        {/* Counter */}
        <div className="relative">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {count}
            </span>
            <span className="text-lg sm:text-xl font-bold text-[var(--primary)]">{suffix}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{label}</p>
        </div>
        
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-[var(--primary)]/50 via-[var(--primary-light)]/50 to-[var(--primary)]/50 blur-sm animate-pulse" style={{ animationDuration: "2s" }} />
        </div>
      </div>
    </div>
  );
}

// Pillar card with staggered animation
function PillarCard({ title, description, icon, index, isVisible }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
  isVisible: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative group transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
      }`}
      style={{ 
        transitionDelay: isVisible ? `${600 + index * 200}ms` : "0ms",
        perspective: "1000px"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="relative rounded-3xl border-2 border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/90 via-[--color-surface-alt]/70 to-[--color-surface-alt]/90 backdrop-blur-xl p-6 sm:p-8 h-full transition-all duration-500 hover:border-[var(--primary)]/60 hover:shadow-2xl hover:shadow-[rgba(var(--primary-rgb),0.2)]"
        style={{
          transform: isHovered ? "translateZ(20px) rotateX(2deg)" : "translateZ(0) rotateX(0)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div 
            className={`absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--primary-light)]/10 transition-opacity duration-500 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          />
          {/* Moving shine effect */}
          <div 
            className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ${
              isHovered ? "translate-x-full" : "-translate-x-full"
            }`}
          />
        </div>

        {/* Corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--primary)]/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />

        {/* Icon with animation */}
        <div 
          className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)]/30 via-[var(--primary-light)]/20 to-[var(--primary)]/30 backdrop-blur-sm border border-[var(--primary)]/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{ transform: "translateZ(30px)" }}
        >
          <div className="relative z-10 text-[var(--primary)]">
            {icon}
          </div>
          {/* Icon glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--primary)]/40 to-[var(--primary-light)]/40 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
        </div>

        {/* Content */}
        <div className="relative" style={{ transform: "translateZ(20px)" }}>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3 transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--primary)] group-hover:to-[var(--primary-light)]">
            {title}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
            {description}
          </p>
        </div>

        {/* Animated dots */}
        {isHovered && (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-[var(--primary)] opacity-60"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${85 + (i % 2) * 5}%`,
                  animation: `pulse 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Timeline item with line animation
function TimelineItem({ year, title, description, index, isVisible, isLast }: {
  year: string;
  title: string;
  description: string;
  index: number;
  isVisible: boolean;
  isLast: boolean;
}) {
  return (
    <div 
      className={`relative pl-8 sm:pl-12 pb-8 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
      }`}
      style={{ transitionDelay: isVisible ? `${800 + index * 200}ms` : "0ms" }}
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] sm:left-[15px] top-8 w-0.5 h-full">
          <div 
            className={`h-full bg-gradient-to-b from-[var(--primary)] to-[var(--primary-light)]/30 transition-all duration-1000 origin-top ${
              isVisible ? "scale-y-100" : "scale-y-0"
            }`}
            style={{ transitionDelay: isVisible ? `${1000 + index * 200}ms` : "0ms" }}
          />
        </div>
      )}
      
      {/* Timeline dot */}
      <div 
        className={`absolute left-0 top-1 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] shadow-lg shadow-[rgba(var(--primary-rgb),0.4)] transition-all duration-500 ${
          isVisible ? "scale-100" : "scale-0"
        }`}
        style={{ transitionDelay: isVisible ? `${700 + index * 200}ms` : "0ms" }}
      >
        <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-white" />
      </div>

      {/* Content */}
      <div className="pt-0.5">
        <span className="inline-block px-2 py-0.5 text-xs font-semibold text-[var(--primary)] bg-[var(--primary)]/10 rounded-full mb-2">
          {year}
        </span>
        <h4 className="text-base sm:text-lg font-bold text-white mb-1">{title}</h4>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}

// Main About Section
export function AboutSection() {
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: pillarsRef, isVisible: pillarsVisible } = useScrollAnimation({ threshold: 0.15 });
  const { ref: timelineRef, isVisible: timelineVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation({ threshold: 0.3 });

  const stats = [
    { value: 50, suffix: "K+", label: "Active Traders", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { value: 99, suffix: ".9%", label: "Platform Uptime", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    { value: 3, suffix: "+", label: "Exchanges Connected", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
    { value: 24, suffix: "/7", label: "AI Monitoring", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
  ];

  const pillars = [
    {
      title: "AI-Native Intelligence",
      description: "Our machine learning models continuously analyze market patterns, news sentiment, and social signals to deliver trading insights that evolve with the market.",
      icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    },
    {
      title: "Human-in-the-Loop",
      description: "You stay in control. Our AI recommends, you decide. Review detailed analysis before every trade execution for complete transparency and peace of mind.",
      icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    },
    {
      title: "Unified Platform",
      description: "Manage crypto and stocks across Binance, Bybit, and Interactive Brokers from one dashboard. Real-time sync, unified analytics, seamless execution.",
      icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
    },
    {
      title: "Security First",
      description: "Bank-grade encryption, secure API connections, and no direct access to your funds. Your keys, your crypto — we only read and execute with your approval.",
      icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    },
  ];

  const timeline = [
    { year: "Vision", title: "Smart Trading for Everyone", description: "We believe AI should work for traders, not replace them. Our platform puts powerful intelligence in your hands." },
    { year: "Mission", title: "Democratize Intelligent Trading", description: "Bridge the gap between institutional-grade tools and individual traders with accessible, AI-powered workflows." },
    { year: "Future", title: "Continuous Evolution", description: "Our AI learns and improves with every market cycle. Stay ahead with strategies that adapt to changing conditions." },
  ];

  return (
    <section 
      id="about" 
      ref={sectionRef}
      className="relative pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-16 sm:pb-20 md:pb-24 lg:pb-32 overflow-hidden"
    >
      {/* ===== BACKGROUND LAYER (z-0) ===== */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Wave background animation */}
        <WaveBackground />
        
        {/* Connection lines */}
        <ConnectionLines isVisible={sectionVisible} />
        
        {/* Floating coins orbit system - reduced opacity for subtle effect */}
        <div className="opacity-40">
          <CoinOrbitSystem />
        </div>

        {/* Floating particles */}
        <FloatingParticle delay={0} size={8} left="10%" top="20%" duration={6} />
        <FloatingParticle delay={1} size={12} left="85%" top="15%" duration={8} />
        <FloatingParticle delay={2} size={6} left="70%" top="60%" duration={7} />
        <FloatingParticle delay={0.5} size={10} left="20%" top="70%" duration={9} />
        <FloatingParticle delay={1.5} size={14} left="90%" top="80%" duration={5} />
        <FloatingParticle delay={3} size={8} left="5%" top="50%" duration={6} />
        
        {/* Gradient orbs */}
        <div 
          className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[var(--primary)]/5 blur-3xl transition-all duration-1000 ${
            sectionVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`} 
        />
        <div 
          className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[var(--primary-light)]/5 blur-3xl transition-all duration-1000 delay-300 ${
            sectionVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        />
        
        {/* Pulsing glow centers for coins */}
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-4 h-4 rounded-full bg-[var(--primary)] animate-ping opacity-20" />
        <div className="absolute left-1/4 top-2/3 w-3 h-3 rounded-full bg-[var(--primary-light)] animate-ping opacity-15" style={{ animationDelay: "1s" }} />
        <div className="absolute right-1/4 top-1/2 w-3 h-3 rounded-full bg-[var(--primary)] animate-ping opacity-15" style={{ animationDelay: "2s" }} />
      </div>

      {/* ===== CONTENT LAYER (z-10) ===== */}

      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Section Header with animated text */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <div className="mb-4">
            <span 
              className={`inline-block px-4 py-1.5 text-xs sm:text-sm font-semibold text-[var(--primary)] bg-[var(--primary)]/10 rounded-full border border-[var(--primary)]/20 transition-all duration-700 ${
                sectionVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              }`}
            >
              About QuantivaHQ
            </span>
          </div>
          
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
            <AnimatedText 
              text="Trade Smarter. " 
              className="block sm:inline"
              isVisible={sectionVisible} 
              delay={200}
            />
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] bg-clip-text text-transparent">
              <AnimatedText 
                text="Not Harder." 
                isVisible={sectionVisible} 
                delay={600}
              />
            </span>
          </h2>
          
          <p 
            className={`mx-auto max-w-3xl text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed px-4 transition-all duration-700 ${
              sectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "800ms" }}
          >
            We build AI-native trading workflows for modern crypto and stock traders. 
            From market sentiment analysis to execution support, everything unified in one intelligent platform.
          </p>
        </div>

        {/* Stats Grid */}
        <div 
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-16 sm:mb-20 md:mb-24"
        >
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              icon={stat.icon}
              index={index}
              isVisible={statsVisible}
            />
          ))}
        </div>

        {/* Pillars Grid */}
        <div 
          ref={pillarsRef}
          className="mb-16 sm:mb-20 md:mb-24"
        >
          <div className="text-center mb-10 sm:mb-12">
            <h3 
              className={`text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 transition-all duration-700 ${
                pillarsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              What Sets Us <span className="text-[var(--primary)]">Apart</span>
            </h3>
            <p 
              className={`text-sm sm:text-base text-slate-400 max-w-2xl mx-auto transition-all duration-700 ${
                pillarsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: "150ms" }}
            >
              Four core principles that guide everything we build
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {pillars.map((pillar, index) => (
              <PillarCard
                key={index}
                title={pillar.title}
                description={pillar.description}
                icon={pillar.icon}
                index={index}
                isVisible={pillarsVisible}
              />
            ))}
          </div>
        </div>

        {/* Timeline / Vision Section */}
        <div 
          ref={timelineRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16 sm:mb-20 md:mb-24"
        >
          {/* Left: Timeline */}
          <div>
            <h3 
              className={`text-xl sm:text-2xl md:text-3xl font-bold text-white mb-8 transition-all duration-700 ${
                timelineVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              Our <span className="text-[var(--primary)]">Journey</span>
            </h3>
            
            <div className="space-y-0">
              {timeline.map((item, index) => (
                <TimelineItem
                  key={index}
                  year={item.year}
                  title={item.title}
                  description={item.description}
                  index={index}
                  isVisible={timelineVisible}
                  isLast={index === timeline.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Right: Visual */}
          <div 
            className={`relative transition-all duration-1000 ${
              timelineVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-16"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            <div className="relative rounded-3xl overflow-hidden border border-[--color-border]/50 bg-gradient-to-br from-[--color-surface-alt]/80 to-black/40 p-6 sm:p-8">
              {/* Animated grid background */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="aboutGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[var(--primary)]" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#aboutGrid)" />
                </svg>
              </div>

              {/* Central icon animation */}
              <div className="relative flex flex-col items-center justify-center py-8 sm:py-12">
                <div className="relative">
                  {/* Rotating rings */}
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: "20s" }}>
                    <svg className="w-32 h-32 sm:w-40 sm:h-40" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#ringGradient)" strokeWidth="1" strokeDasharray="10 5" opacity="0.3" />
                      <defs>
                        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--primary)" />
                          <stop offset="100%" stopColor="var(--primary-light)" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: "15s", animationDirection: "reverse" }}>
                    <svg className="w-32 h-32 sm:w-40 sm:h-40" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="35" fill="none" stroke="url(#ringGradient2)" strokeWidth="1" strokeDasharray="8 4" opacity="0.4" />
                      <defs>
                        <linearGradient id="ringGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--primary-light)" />
                          <stop offset="100%" stopColor="var(--primary)" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Center icon */}
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center shadow-2xl shadow-[rgba(var(--primary-rgb),0.4)]">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-lg sm:text-xl font-bold text-white mb-2">AI-Powered Trading</p>
                  <p className="text-sm text-slate-400">Intelligent. Unified. Secure.</p>
                </div>
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-[var(--primary)]/30 rounded-tl-3xl" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-[var(--primary-light)]/30 rounded-br-3xl" />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div 
          ref={ctaRef}
          className={`relative rounded-3xl overflow-hidden transition-all duration-1000 ${
            ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/20 via-[var(--primary-light)]/10 to-[var(--primary)]/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
          
          {/* Animated border */}
          <div className="absolute inset-0 rounded-3xl border-2 border-[var(--primary)]/30" />
          <div 
            className="absolute inset-0 rounded-3xl border-2 border-[var(--primary)] opacity-50"
            style={{
              animation: "pulse 3s ease-in-out infinite",
              animationDelay: "0.5s",
            }}
          />

          <div className="relative px-6 py-10 sm:px-10 sm:py-14 md:px-16 md:py-16 text-center">
            <h3 
              className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 transition-all duration-700 ${
                ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              Ready to Trade <span className="text-[var(--primary)]">Smarter</span>?
            </h3>
            <p 
              className={`text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 transition-all duration-700 ${
                ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              Join thousands of traders using AI-powered insights to make better decisions every day.
            </p>
            <div 
              className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 ${
                ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: "600ms" }}
            >
              <a
                href="/onboarding/sign-up?tab=signup"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-[rgba(var(--primary-rgb),0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Start Trading Now
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </a>
              <button
                onClick={() => {
                  const element = document.getElementById("contact");
                  if (element) element.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl border-2 border-white/30 bg-white/5 backdrop-blur-sm px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/50"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-5px);
          }
          75% {
            transform: translateY(-25px) translateX(5px);
          }
        }
        
        @keyframes orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes orbitReverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        
        @keyframes coinSpin {
          0% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(180deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
        
        @keyframes waveMove1 {
          0%, 100% {
            d: path('M0,400 C360,300 720,500 1080,400 C1260,350 1380,380 1440,400 L1440,800 L0,800 Z');
          }
          50% {
            d: path('M0,450 C360,350 720,450 1080,350 C1260,320 1380,400 1440,380 L1440,800 L0,800 Z');
          }
        }
        
        @keyframes waveMove2 {
          0%, 100% {
            d: path('M0,500 C240,400 480,600 720,500 C960,400 1200,550 1440,500 L1440,800 L0,800 Z');
          }
          50% {
            d: path('M0,480 C240,550 480,450 720,520 C960,480 1200,420 1440,480 L1440,800 L0,800 Z');
          }
        }
        
        @keyframes dashMove {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -100;
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        @keyframes pulse3d {
          0%, 100% {
            transform: scale(1) translateZ(0);
            box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.3);
          }
          50% {
            transform: scale(1.05) translateZ(10px);
            box-shadow: 0 0 40px rgba(var(--primary-rgb), 0.5);
          }
        }
        
        @keyframes rotate3d {
          from {
            transform: perspective(1000px) rotateY(0deg);
          }
          to {
            transform: perspective(1000px) rotateY(360deg);
          }
        }
      `}</style>
    </section>
  );
}
