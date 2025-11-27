"use client";

import { useState, useEffect, useRef } from "react";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating: number;
  metric: string;
}

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative rounded-3xl border-2 border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/90 via-[--color-surface-alt]/70 to-[--color-surface-alt]/90 p-6 sm:p-8 backdrop-blur-xl transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
      }`}
      style={{ transitionDelay: isVisible ? `${index * 100}ms` : "0ms" }}
    >
      {/* Quote Icon */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
        <svg className="h-6 w-6 text-[#fc4f02]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>

      {/* Quote */}
      <p className="mb-6 text-base sm:text-lg leading-relaxed text-slate-300 italic">
        "{testimonial.quote}"
      </p>

      {/* Rating */}
      <div className="mb-4 flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`h-5 w-5 ${i < testimonial.rating ? "text-[#fda300]" : "text-slate-600"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Author */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-white">{testimonial.name}</div>
          <div className="text-sm text-slate-400">{testimonial.role}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-[#fc4f02]">{testimonial.metric}</div>
          <div className="text-xs text-slate-500">Performance</div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const testimonials: Testimonial[] = [
    {
      name: "Alex Chen",
      role: "Professional Trader",
      quote: "QuantivaHQ's AI strategies have completely transformed my trading. The sentiment analysis is incredibly accurate, and I've seen a 35% increase in my portfolio returns since switching.",
      rating: 5,
      metric: "+35%",
    },
    {
      name: "Sarah Martinez",
      role: "Crypto Investor",
      quote: "The multi-exchange connectivity is a game-changer. Managing Binance and Bybit from one platform saves me hours every week. The automated strategies are exactly what I needed.",
      rating: 5,
      metric: "+28%",
    },
    {
      name: "Michael Thompson",
      role: "Stock Trader",
      quote: "The portfolio optimization feature is outstanding. It automatically rebalances my positions and I've reduced my risk exposure by 40% while maintaining strong returns.",
      rating: 5,
      metric: "+42%",
    },
    {
      name: "Emily Rodriguez",
      role: "Day Trader",
      quote: "Real-time sentiment analysis from news and social media gives me an edge I never had before. The AI recommendations are spot-on, and execution is seamless.",
      rating: 5,
      metric: "+31%",
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsHeaderVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} id="testimonials" className="relative pt-20 sm:pt-24 lg:pt-32 pb-20 sm:pb-24 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-12 sm:mb-16 transition-all duration-700 ${isHeaderVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Trusted by
            <span className="bg-gradient-to-r from-[#fc4f02] to-[#fda300] bg-clip-text text-transparent"> Traders</span>
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-slate-300">
            See what our users are saying about QuantivaHQ
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

