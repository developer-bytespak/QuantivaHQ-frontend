"use client";

import { useState } from "react";
import { submitContactForm } from "@/lib/api/contact";
import { Reveal } from "./motion/reveal";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Name must not exceed 100 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    // Company validation (optional but if provided, validate)
    if (formData.company.trim() && formData.company.trim().length > 100) {
      newErrors.company = "Company name must not exceed 100 characters";
    }

    // Phone validation (optional but if provided, validate)
    if (formData.phone.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = "Please enter a valid phone number";
      } else if (formData.phone.trim().length > 20) {
        newErrors.phone = "Phone number must not exceed 20 characters";
      }
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = "Please select a subject";
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (formData.message.trim().length > 5000) {
      newErrors.message = "Message must not exceed 5000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof typeof formData]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof formData];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      await submitContactForm({
        name: formData.name.trim(),
        email: formData.email.trim(),
        company: formData.company.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        subject: formData.subject,
        message: formData.message.trim(),
        source: "homepage",
      });
      setSubmitStatus("success");
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        subject: "",
        message: "",
      });
      setErrors({});
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared field styling
  const fieldBase =
    "w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border text-white placeholder-slate-500/60 text-sm focus:outline-none focus:ring-2 transition-all duration-200 hover:border-white/20";
  const fieldState = (hasError?: string) =>
    hasError
      ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
      : "border-white/10 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]/60 focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]";

  const contactMethods = [
    {
      title: "Email Support",
      value: "support@quantivahq.com",
      hint: "We respond within 24 hours",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      ),
    },
    {
      title: "Phone Support",
      value: "+1 (747) 800-7952",
      hint: "Available during business hours",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      ),
    },
    {
      title: "Business Hours",
      value: "Monday – Friday",
      hint: "9:00 AM – 6:00 PM EST",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
  ];

  return (
    <section
      id="contact"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      {/* Decorative "rising moon" background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* The moon: a large sphere rising into the section. Its top edge sits
            ~30% below the section top; it's far wider than the viewport so only
            the top of the dome shows, arcing cleanly across — the rest stays
            black to match the sections above. */}
        <div
          className="absolute left-1/2 top-[30%] -translate-x-1/2 aspect-square w-[220%] sm:w-[170%] lg:w-[135%] max-w-[1700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(var(--primary-rgb),0.10) 0%, transparent 32%)",
            boxShadow: "inset 0 70px 110px -60px rgba(var(--primary-light-rgb),0.40)",
            borderTop: "1px solid rgba(var(--primary-light-rgb),0.30)",
          }}
        />

        {/* Soft bloom along the moon's crest */}
        <div className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 h-44 w-[85%] max-w-[1000px] rounded-[100%] bg-[radial-gradient(ellipse,rgba(var(--primary-light-rgb),0.16),transparent_70%)] blur-2xl" />

        {/* Fine grid texture, faded toward the edges */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 75%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          {/* ── Left: value + contact methods ─────────────────────────── */}
          <Reveal className="lg:col-span-2 lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--primary-rgb),0.4)] bg-[rgba(var(--primary-rgb),0.1)] px-4 py-1.5 text-xs sm:text-sm font-medium text-[var(--primary-light)] mb-5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)]" />
              </span>
              We&apos;re here to help
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Get in{" "}
              <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] bg-clip-text text-transparent">
                Touch
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md mb-8">
              Have questions about Quantiva HQ? Our team is ready to help with
              sales, support, and partnership inquiries. Reach out and we&apos;ll get
              back to you as soon as possible.
            </p>

            {/* Contact methods */}
            <div className="space-y-3">
              {contactMethods.map((m) => (
                <div
                  key={m.title}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 transition-all duration-300 hover:border-[var(--primary)]/40 hover:bg-white/[0.06]"
                >
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 border border-[var(--primary)]/20 transition-transform duration-300 group-hover:scale-110">
                    <svg className="h-6 w-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {m.icon}
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">{m.title}</h3>
                    <p className="text-sm text-slate-300 font-medium truncate">{m.value}</p>
                    <p className="text-xs text-slate-500">{m.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* ── Right: glassmorphic form ──────────────────────────────── */}
          <Reveal delay={0.12} className="lg:col-span-3">
          <form
            onSubmit={handleSubmit}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:rounded-3xl sm:p-8 md:p-10"
          >
            {/* Glass highlight along the top edge */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            {/* Form Header */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5">Send us a message</h3>
              <p className="text-xs sm:text-sm text-slate-400">Fill out the form and we&apos;ll get back to you promptly.</p>
            </div>

            {/* Success/Error Messages */}
            {submitStatus === "success" && (
              <div className="mb-6 p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs sm:text-sm flex items-center gap-3">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Thank you for your message! We&apos;ll get back to you within 24 hours.</span>
              </div>
            )}
            {submitStatus === "error" && Object.keys(errors).length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold mb-2">Please fix the following errors:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                    Full Name <span className="text-[var(--primary)] ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`${fieldBase} ${fieldState(errors.name)}`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email Address <span className="text-[var(--primary)] ml-1">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`${fieldBase} ${fieldState(errors.email)}`}
                    placeholder="your.email@company.com"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
                </div>
              </div>

              {/* Company + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-white mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className={`${fieldBase} ${fieldState(errors.company)}`}
                    placeholder="Your company name"
                  />
                  {errors.company && <p className="text-red-400 text-xs mt-1.5">{errors.company}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`${fieldBase} ${fieldState(errors.phone)}`}
                    placeholder="+1 (747) 800-7952"
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1.5">{errors.phone}</p>}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                  Subject <span className="text-[var(--primary)] ml-1">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={`${fieldBase} ${fieldState(errors.subject)} appearance-none cursor-pointer`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="" className="bg-[--color-surface] text-white">Select a subject</option>
                  <option value="general" className="bg-[--color-surface] text-white">General Inquiry</option>
                  <option value="sales" className="bg-[--color-surface] text-white">Sales & Pricing</option>
                  <option value="support" className="bg-[--color-surface] text-white">Technical Support</option>
                  <option value="partnership" className="bg-[--color-surface] text-white">Partnership Opportunities</option>
                  <option value="other" className="bg-[--color-surface] text-white">Other</option>
                </select>
                {errors.subject && <p className="text-red-400 text-xs mt-1.5">{errors.subject}</p>}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                  Message <span className="text-[var(--primary)] ml-1">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className={`${fieldBase} ${fieldState(errors.message)} resize-none`}
                  placeholder="Please provide a detailed description of your inquiry. Include any relevant information that will help us assist you better."
                />
                <div className="flex justify-between items-start mt-2">
                  {errors.message && <p className="text-red-400 text-xs">{errors.message}</p>}
                  <p className="text-slate-400 text-xs ml-auto">{formData.message.length}/5000</p>
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="mt-7 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-400 sm:max-w-[55%]">
                <span className="text-[var(--primary)] mr-1">*</span>
                <span>Required fields. Your information will be kept confidential.</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.25)] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.35)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 sm:min-w-[180px]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Send Message
                      <svg
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </div>
          </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

