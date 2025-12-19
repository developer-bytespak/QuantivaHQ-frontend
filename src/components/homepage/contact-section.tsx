"use client";

import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

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
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

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

    // Simulate form submission (replace with actual API call)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
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
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative pb-16 sm:pb-20 md:pb-24 lg:pb-32 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2
            className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Get in{" "}
            <span className="bg-gradient-to-r from-[#fc4f02] to-[#fda300] bg-clip-text text-transparent">
              Touch
            </span>
          </h2>
          <p
            className={`mx-auto max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl text-slate-300 transition-all duration-700 px-4 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "100ms" }}
          >
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Contact Form */}
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className={`bg-gradient-to-br from-[--color-surface-alt]/95 via-[--color-surface-alt]/85 to-[--color-surface-alt]/95 backdrop-blur-xl border border-[--color-border]/50 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/20 p-6 sm:p-8 md:p-10 lg:p-12 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            {/* Form Header */}
            <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-[--color-border]/30">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Contact Information</h3>
              <p className="text-xs sm:text-sm text-slate-400">Please fill out the form below and we'll get back to you promptly.</p>
            </div>

            {/* Success/Error Messages */}
            {submitStatus === "success" && (
              <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs sm:text-sm flex items-center gap-3">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Thank you for your message! We'll get back to you within 24 hours.</span>
              </div>
            )}
            {submitStatus === "error" && Object.keys(errors).length > 0 && (
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <div className="flex items-start gap-3 mb-2">
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

            {/* Personal Information Section */}
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white mb-2.5">
                    Full Name <span className="text-[#fc4f02] ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3.5 rounded-xl bg-[--color-surface]/80 border text-white placeholder-slate-500/60 text-sm focus:outline-none focus:ring-2 transition-all duration-200 hover:border-[--color-border] ${
                      errors.name
                        ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
                        : "border-[--color-border]/60 focus:ring-[#fc4f02]/40 focus:border-[#fc4f02]/60"
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2.5">
                    Email Address <span className="text-[#fc4f02] ml-1">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3.5 rounded-xl bg-[--color-surface]/80 border text-white placeholder-slate-500/60 text-sm focus:outline-none focus:ring-2 transition-all duration-200 hover:border-[--color-border] ${
                      errors.email
                        ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
                        : "border-[--color-border]/60 focus:ring-[#fc4f02]/40 focus:border-[#fc4f02]/60"
                    }`}
                    placeholder="your.email@company.com"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
                </div>

                {/* Company Field */}
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-white mb-2.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 rounded-xl bg-[--color-surface]/80 border text-white placeholder-slate-500/60 text-sm focus:outline-none focus:ring-2 transition-all duration-200 hover:border-[--color-border] ${
                      errors.company
                        ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
                        : "border-[--color-border]/60 focus:ring-[#fc4f02]/40 focus:border-[#fc4f02]/60"
                    }`}
                    placeholder="Your company name"
                  />
                  {errors.company && <p className="text-red-400 text-xs mt-1.5">{errors.company}</p>}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white mb-2.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3.5 rounded-xl bg-[--color-surface]/80 border text-white placeholder-slate-500/60 text-sm focus:outline-none focus:ring-2 transition-all duration-200 hover:border-[--color-border] ${
                      errors.phone
                        ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
                        : "border-[--color-border]/60 focus:ring-[#fc4f02]/40 focus:border-[#fc4f02]/60"
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1.5">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Inquiry Details Section */}
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Inquiry Details</h4>
              
              {/* Subject Field */}
              <div className="mb-5">
                <label htmlFor="subject" className="block text-sm font-medium text-white mb-2.5">
                  Subject <span className="text-[#fc4f02] ml-1">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3.5 rounded-xl bg-[--color-surface]/80 border text-white text-sm focus:outline-none focus:ring-2 transition-all duration-200 hover:border-[--color-border] appearance-none cursor-pointer ${
                    errors.subject
                      ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
                      : "border-[--color-border]/60 focus:ring-[#fc4f02]/40 focus:border-[#fc4f02]/60"
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23fc4f02'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
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

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white mb-2.5">
                  Message <span className="text-[#fc4f02] ml-1">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className={`w-full px-4 py-3.5 rounded-xl bg-[--color-surface]/80 border text-white placeholder-slate-500/60 text-sm focus:outline-none focus:ring-2 transition-all duration-200 resize-none hover:border-[--color-border] ${
                    errors.message
                      ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/60"
                      : "border-[--color-border]/60 focus:ring-[#fc4f02]/40 focus:border-[#fc4f02]/60"
                  }`}
                  placeholder="Please provide a detailed description of your inquiry. Include any relevant information that will help us assist you better."
                />
                <div className="flex justify-between items-start mt-2">
                  {errors.message && <p className="text-red-400 text-xs">{errors.message}</p>}
                  <p className="text-slate-400 text-xs ml-auto">{formData.message.length}/5000</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[--color-border]/30 my-8"></div>

            {/* Submit Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                <span className="text-[#fc4f02] mr-1">*</span>
                <span>Required fields. Your information will be kept confidential.</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-10 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#fc4f02]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg min-w-[160px]"
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
                      Submit Inquiry
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

          {/* Contact Information */}
          <div
            className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-[--color-surface-alt]/60 to-[--color-surface-alt]/40 border border-[--color-border]/50 backdrop-blur-sm hover:border-[#fc4f02]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#fc4f02]/10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="h-7 w-7 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-2.5">Email Support</h3>
              <p className="text-sm text-slate-400 font-medium">support@quantivahq.com</p>
              <p className="text-xs text-slate-500 mt-1">We respond within 24 hours</p>
            </div>

            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-[--color-surface-alt]/60 to-[--color-surface-alt]/40 border border-[--color-border]/50 backdrop-blur-sm hover:border-[#fc4f02]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#fc4f02]/10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="h-7 w-7 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-2.5">Phone Support</h3>
              <p className="text-sm text-slate-400 font-medium">+1 (555) 123-4567</p>
              <p className="text-xs text-slate-500 mt-1">Available during business hours</p>
            </div>

            <div className="group text-center p-8 rounded-2xl bg-gradient-to-br from-[--color-surface-alt]/60 to-[--color-surface-alt]/40 border border-[--color-border]/50 backdrop-blur-sm hover:border-[#fc4f02]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#fc4f02]/10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="h-7 w-7 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-2.5">Business Hours</h3>
              <p className="text-sm text-slate-400 font-medium">Monday - Friday</p>
              <p className="text-xs text-slate-500 mt-1">9:00 AM - 6:00 PM EST</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

