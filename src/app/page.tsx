"use client";

import { useState, useEffect } from "react";
import { SplashScreen } from "@/components/common/splash-screen";
import { Homepage } from "@/components/homepage/homepage";

export default function Home() {
  const [showSplash, setShowSplash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if this is the first visit
    if (typeof window !== "undefined") {
      const firstVisit = localStorage.getItem("quantivahq_first_visit");
      
      if (!firstVisit) {
        // First visit - show splash screen
        setShowSplash(true);
        localStorage.setItem("quantivahq_first_visit", "true");
      } else {
        // Returning visitor - show homepage directly
        setShowSplash(false);
      }
      
      setIsLoading(false);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return <Homepage />;
}
