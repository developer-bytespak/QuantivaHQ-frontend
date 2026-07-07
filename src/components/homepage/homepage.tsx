"use client";

import { useRef } from "react";
import { HomepageLayout } from "./homepage-layout";
import { HomepageHeader } from "./homepage-header";
import { HeroSection } from "./hero-section";
import { AboutSection } from "./about-section";
import { FeaturesSection } from "./features-section";
import { HowItWorksSection } from "./how-it-works-section";
import { TestimonialsSection } from "./testimonials-section";
import { PricingSection } from "./pricing-section";
import { AppDownloadSection } from "./app-download-section";
import { ContactSection } from "./contact-section";
import { HomepageFooter } from "./homepage-footer";
import { MotionProvider } from "./motion/lazy-motion-provider";
import { SmoothScroll } from "./motion/smooth-scroll";
import { ScrollSceneBackground } from "./scroll-scene-background";

export function Homepage() {
  // Hero + About + Features share one scroll-scrubbed background scene
  const sceneRef = useRef<HTMLDivElement>(null);

  return (
    <MotionProvider>
      <SmoothScroll>
        <HomepageLayout>
          <HomepageHeader />
          <div ref={sceneRef} className="relative">
            <ScrollSceneBackground targetRef={sceneRef} />
            <HeroSection />
            <AboutSection />
            <FeaturesSection />
          </div>
          <HowItWorksSection />
          <TestimonialsSection />
          <PricingSection />
          <AppDownloadSection />
          <ContactSection />
          <HomepageFooter />
        </HomepageLayout>
      </SmoothScroll>
    </MotionProvider>
  );
}
