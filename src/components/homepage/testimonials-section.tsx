"use client";

import { Marquee } from "./motion/marquee";
import { Reveal } from "./motion/reveal";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating: number;
  metric: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Alex Chen",
    role: "Professional Trader",
    quote:
      "QuantivaHQ's AI strategies have completely transformed my trading. The sentiment analysis is incredibly accurate, and I've seen a 35% increase in my portfolio returns since switching.",
    rating: 5,
    metric: "+35%",
  },
  {
    name: "Sarah Martinez",
    role: "Crypto Investor",
    quote:
      "The multi-exchange connectivity is a game-changer. Managing Binance and Bybit from one platform saves me hours every week. The automated strategies are exactly what I needed.",
    rating: 5,
    metric: "+28%",
  },
  {
    name: "Emily Rodriguez",
    role: "Day Trader",
    quote:
      "Real-time sentiment analysis from news and social media gives me an edge I never had before. The AI recommendations are spot-on, and execution is seamless.",
    rating: 5,
    metric: "+31%",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex h-full w-[340px] max-w-[88vw] flex-col rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 sm:w-[400px]">
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`h-4 w-4 ${i < testimonial.rating ? "text-[var(--primary-light)]" : "text-slate-600"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-300">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-xs font-bold text-white">
            {initials(testimonial.name)}
          </span>
          <div>
            <div className="text-sm font-semibold text-white">{testimonial.name}</div>
            <div className="text-xs text-slate-500">{testimonial.role}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-[var(--primary-light)]">{testimonial.metric}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Performance</div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32">
      <div className="mx-auto mb-16 max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-slate-300 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
            Testimonials
          </span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Trusted by{" "}
            <span
              className="animate-gradient bg-gradient-to-r from-[var(--primary)] via-[var(--primary-light)] to-[var(--primary)] bg-clip-text text-transparent"
              style={{ backgroundSize: "200% 200%" }}
            >
              Traders
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mt-5 text-lg text-slate-400">See what our users are saying about QuantivaHQ</p>
        </Reveal>
      </div>

      {/* Full-bleed dual marquee */}
      <Reveal amount={0.1}>
        <div className="space-y-5">
          <Marquee duration={45}>
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} testimonial={t} />
            ))}
          </Marquee>
          <Marquee duration={45} reverse>
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} testimonial={t} />
            ))}
          </Marquee>
        </div>
      </Reveal>
    </section>
  );
}
