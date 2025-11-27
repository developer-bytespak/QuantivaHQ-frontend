"use client";

import { useState } from "react";
import { SplashScreen } from "@/components/common/splash-screen";
import { Homepage } from "@/components/homepage/homepage";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return <Homepage />;
}
