"use client";

import { useState, useEffect } from "react";
import { SplashScreen } from "@/components/common/splash-screen";
import { Homepage } from "@/components/homepage/homepage";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  // Reset splash screen state when component mounts (e.g., when navigating from other pages)
  useEffect(() => {
    setShowSplash(true);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return <Homepage />;
}
