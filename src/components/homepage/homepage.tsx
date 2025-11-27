"use client";

import { HomepageLayout } from "./homepage-layout";
import { HomepageHeader } from "./homepage-header";
import { HeroSection } from "./hero-section";
import { FeaturesSection } from "./features-section";
import { HowItWorksSection } from "./how-it-works-section";
import { TestimonialsSection } from "./testimonials-section";
import { PricingSection } from "./pricing-section";
import { ContactSection } from "./contact-section";
import { HomepageFooter } from "./homepage-footer";
import { useEffect } from "react";

export function Homepage() {
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;
      lastScrollY = currentScrollY;

      // Get all animated elements (sections, headings, and content)
      const animatedElements = document.querySelectorAll(
        'section, .animate-on-scroll, [data-animate]'
      );

      animatedElements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        const isInView = elementTop < window.innerHeight * 0.9 && elementBottom > 0;
        
        if (isInView) {
          if (isScrollingDown || currentScrollY < 100) {
            // When scrolling down or at top of page
            element.classList.add('animate-fade-in');
            element.classList.remove('animate-fade-out');
            
            // Add staggered animation for child elements
            const animatedChildren = element.querySelectorAll('.animate-child');
            animatedChildren.forEach((child, index) => {
              (child as HTMLElement).style.animationDelay = `${index * 0.1}s`;
              child.classList.add('animate-fade-in');
              child.classList.remove('animate-fade-out');
            });
          }
        } else if (elementTop > window.innerHeight * 0.2 && isScrollingDown) {
          // When element is scrolled past and we're scrolling down
          element.classList.remove('animate-fade-in');
          element.classList.add('animate-fade-out');
        }
      });
    };

    // Add initial animation to visible elements
    const initialCheck = () => {
      const animatedElements = document.querySelectorAll(
        'section, .animate-on-scroll, [data-animate]'
      );
      
      animatedElements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        if (elementTop < window.innerHeight * 0.9) {
          element.classList.add('animate-fade-in');
          
          // Animate children with delay
          const animatedChildren = element.querySelectorAll('.animate-child');
          animatedChildren.forEach((child, index) => {
            (child as HTMLElement).style.animationDelay = `${index * 0.1}s`;
            child.classList.add('animate-fade-in');
          });
        }
      });
    };

    // Run initial check after a small delay to ensure DOM is ready
    const timer = setTimeout(initialCheck, 100);
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <HomepageLayout>
      <HomepageHeader />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <ContactSection />
      <HomepageFooter />
    </HomepageLayout>
  );
}

