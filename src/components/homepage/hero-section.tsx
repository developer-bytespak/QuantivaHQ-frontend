"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { TradingChartBackground } from "./trading-chart-background";
import { PriceTicker } from "./price-ticker";
import { getCurrentUser } from "@/lib/api/user";
import { navigateToNextRoute } from "@/lib/auth/flow-router.service";

export function HeroSection() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [candlestickData, setCandlestickData] = useState<Array<{
    x: number;
    isGreen: boolean;
    open: number;
    close: number;
    high: number;
    low: number;
  }> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Generate candlestick data on client side only to avoid hydration mismatch
  useEffect(() => {
    const generateCandlestickData = () => {
      const data = [];
      for (let i = 0; i < 10; i++) {
        const x = 15 + i * 18;
        const isGreen = Math.random() > 0.4;
        const open = 40 + Math.random() * 20;
        const close = open + (isGreen ? Math.random() * 8 : -Math.random() * 8);
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;
        
        data.push({ x, isGreen, open, close, high, low });
      }
      return data;
    };

    setCandlestickData(generateCandlestickData());
  }, []);

  const scrollToFeatures = () => {
    const element = document.getElementById("features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleGetStarted = async () => {
    setIsCheckingAuth(true);
    try {
      // Check if user is already authenticated
      await getCurrentUser();
      // User is authenticated, redirect to appropriate page using flow router
      await navigateToNextRoute(router);
    } catch (error: any) {
      // User is not authenticated, redirect to sign-up page
      // Check if it's a 401/unauthorized error (expected for unauthenticated users)
      if (error?.status === 401 || error?.statusCode === 401 || 
          error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
        router.push("/onboarding/sign-up?tab=signup");
      } else {
        // Other error - still redirect to sign-up
        console.error("Error checking authentication:", error);
        router.push("/onboarding/sign-up?tab=signup");
      }
    } finally {
      setIsCheckingAuth(false);
    }
  };

  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-12 pb-8 sm:pt-20 sm:pb-12 md:min-h-screen">
      {/* Trading Chart Backgrounds */}
      <TradingChartBackground opacity={0.12} />
      
      {/* Additional Chart Elements with Parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large background chart (left side) with parallax - hidden on mobile */}
        <div 
          className="hidden lg:block absolute top-1/4 left-0 w-1/3 h-1/2 opacity-5"
          style={{
            transform: `translateY(${scrollY * 0.3}px) translateZ(-100px)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          <svg viewBox="0 0 400 200" className="w-full h-full text-[#fc4f02]">
            <defs>
              <linearGradient id="bgChart1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fc4f02" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#fc4f02" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={`grid-${i}`}
                x1="20"
                y1={20 + i * 40}
                x2="380"
                y2={20 + i * 40}
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.1"
              />
            ))}
            {/* Chart line */}
            <polyline
              points="20,150 60,120 100,140 140,100 180,110 220,80 260,90 300,70 340,60 380,50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            {/* Area fill */}
            <polygon
              points="20,150 60,120 100,140 140,100 180,110 220,80 260,90 300,70 340,60 380,50 380,200 20,200"
              fill="url(#bgChart1)"
            />
          </svg>
        </div>

        {/* Medium chart (right side) with parallax - hidden on mobile */}
        <div 
          className="hidden lg:block absolute bottom-1/4 right-0 w-1/4 h-1/3 opacity-5"
          style={{
            transform: `translateY(${scrollY * 0.2}px) translateZ(-80px)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          <svg viewBox="0 0 300 150" className="w-full h-full text-[#fda300]">
            <polyline
              points="20,130 50,100 80,110 110,90 140,85 170,75 200,65 230,55 260,50 280,45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Candlestick pattern (center-right) with parallax - hidden on mobile */}
        <div 
          className="hidden md:block absolute top-1/3 right-1/4 w-48 h-32 opacity-8"
          style={{
            transform: `translateY(${scrollY * 0.15}px) translateZ(-60px)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          <svg viewBox="0 0 200 100" className="w-full h-full">
            {candlestickData?.map((candle, i) => (
              <g key={i}>
                <line
                  x1={candle.x}
                  y1={100 - (candle.high / 60) * 80}
                  x2={candle.x}
                  y2={100 - (candle.low / 60) * 80}
                  stroke={candle.isGreen ? "#10b981" : "#ef4444"}
                  strokeWidth="1.5"
                />
                <rect
                  x={candle.x - 4}
                  y={100 - (Math.max(candle.open, candle.close) / 60) * 80}
                  width="8"
                  height={Math.abs((candle.close - candle.open) / 60) * 80 || 2}
                  fill={candle.isGreen ? "#10b981" : "#ef4444"}
                />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Price Ticker */}
      <PriceTicker />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center pt-20 sm:pt-24 md:pt-32 pb-4 sm:pb-6" style={{ perspective: "1000px" }}>
        <div className="space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
          {/* Headline with 3D effect */}
          <h1 
            className="text-2xl leading-snug sm:text-3xl sm:leading-tight md:text-4xl md:leading-tight lg:text-6xl lg:leading-tight font-bold tracking-tight text-white animate-fade-in"
            style={{
              textShadow: "0 10px 40px rgba(252, 79, 2, 0.3), 0 5px 20px rgba(252, 79, 2, 0.2)",
              transform: "translateZ(50px)",
            }}
          >
            Unlock Your Trading Potential
            <br />
            <span className="bg-gradient-to-r from-[#fc4f02] to-[#fda300] bg-clip-text text-transparent">
              with AI-Powered Insights
            </span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto max-w-3xl text-xs sm:text-xs md:text-sm lg:text-base text-slate-300 leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Automate your crypto and stock trading with powerful AI strategies. 
            Real-time sentiment analysis, portfolio optimization, and seamless multi-exchange connectivity.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 md:gap-4 pt-1 sm:pt-2 md:pt-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <button
              onClick={handleGetStarted}
              disabled={isCheckingAuth}
              className="group relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-xs sm:text-sm md:text-base font-semibold text-white shadow-xl shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#fc4f02]/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-1 sm:gap-2">
                {isCheckingAuth ? "Checking..." : "Get Started"}
                {!isCheckingAuth && (
                  <svg className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>

            <button
              onClick={scrollToFeatures}
              className="group rounded-lg sm:rounded-xl border-2 border-slate-600 bg-slate-900/40 backdrop-blur px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-xs sm:text-sm md:text-base font-semibold text-white transition-all duration-300 hover:border-[#fc4f02]/50 hover:bg-slate-800/60 cursor-pointer w-full sm:w-auto"
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                Learn More
                <svg className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 transition-transform duration-300 group-hover:translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </span>
            </button>
          </div>

          {/* Stats or Trust Indicators with 3D effect */}
          <div 
            className="pt-2 sm:pt-3 md:pt-6 lg:pt-12 grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 lg:gap-6 max-w-4xl mx-auto animate-fade-in" 
            style={{ animationDelay: "0.6s", transform: "translateZ(30px)" }}
          >
            <div 
              className="text-center group relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="relative inline-flex items-center justify-center">
                <div 
                  className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#fc4f02] mb-0.5 sm:mb-1 md:mb-2 transition-all duration-300 group-hover:scale-110"
                  style={{
                    textShadow: "0 5px 20px rgba(252, 79, 2, 0.4), 0 2px 10px rgba(252, 79, 2, 0.3)",
                    transform: "translateZ(20px)",
                  }}
                >
                  10K+
                </div>
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5 sm:mt-1" style={{ transform: "translateZ(10px)" }}>Active Traders</div>
            </div>
            <div 
              className="text-center group relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="relative inline-flex items-center justify-center">
                <div 
                  className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#fc4f02] mb-0.5 sm:mb-1 md:mb-2 transition-all duration-300 group-hover:scale-110"
                  style={{
                    textShadow: "0 5px 20px rgba(252, 79, 2, 0.4), 0 2px 10px rgba(252, 79, 2, 0.3)",
                    transform: "translateZ(20px)",
                  }}
                >
                  $500M+
                </div>
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5 sm:mt-1" style={{ transform: "translateZ(10px)" }}>Trading Volume</div>
            </div>
            <div 
              className="text-center group relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="relative inline-flex items-center justify-center">
                <div 
                  className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#fc4f02] mb-0.5 sm:mb-1 md:mb-2 transition-all duration-300 group-hover:scale-110"
                  style={{
                    textShadow: "0 5px 20px rgba(252, 79, 2, 0.4), 0 2px 10px rgba(252, 79, 2, 0.3)",
                    transform: "translateZ(20px)",
                  }}
                >
                  99.9%
                </div>
                <div 
                  className="absolute -top-1 -right-1 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#10b981] rounded-full animate-pulse"
                  style={{ transform: "translateZ(25px)", boxShadow: "0 0 10px rgba(16, 185, 129, 0.8)" }}
                ></div>
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5 sm:mt-1" style={{ transform: "translateZ(10px)" }}>Uptime</div>
            </div>
            <div 
              className="text-center group relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="relative inline-flex items-center justify-center">
                <div 
                  className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#fc4f02] mb-0.5 sm:mb-1 md:mb-2 transition-all duration-300 group-hover:scale-110"
                  style={{
                    textShadow: "0 5px 20px rgba(252, 79, 2, 0.4), 0 2px 10px rgba(252, 79, 2, 0.3)",
                    transform: "translateZ(20px)",
                  }}
                >
                  24/7
                </div>
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5 sm:mt-1" style={{ transform: "translateZ(10px)" }}>AI Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}

