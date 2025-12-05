"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { personalInfoSchema } from "@/lib/validation/onboarding";
import { AUTH_STEPS } from "@/config/navigation";
import { updatePersonalInfo, getCurrentUser, hasPersonalInfo } from "@/lib/api/user";

interface Country {
  code: string;
  name: string;
  supported: boolean;
  region: string;
}

const COUNTRIES: Country[] = [
  { code: "US", name: "United States", supported: true, region: "North America" },
  { code: "CA", name: "Canada", supported: true, region: "North America" },
  { code: "GB", name: "United Kingdom", supported: true, region: "Europe" },
  { code: "DE", name: "Germany", supported: true, region: "Europe" },
  { code: "FR", name: "France", supported: true, region: "Europe" },
  { code: "IT", name: "Italy", supported: true, region: "Europe" },
  { code: "ES", name: "Spain", supported: true, region: "Europe" },
  { code: "NL", name: "Netherlands", supported: true, region: "Europe" },
  { code: "BE", name: "Belgium", supported: true, region: "Europe" },
  { code: "CH", name: "Switzerland", supported: true, region: "Europe" },
  { code: "AT", name: "Austria", supported: true, region: "Europe" },
  { code: "SE", name: "Sweden", supported: true, region: "Europe" },
  { code: "NO", name: "Norway", supported: true, region: "Europe" },
  { code: "DK", name: "Denmark", supported: true, region: "Europe" },
  { code: "FI", name: "Finland", supported: true, region: "Europe" },
  { code: "AU", name: "Australia", supported: true, region: "Oceania" },
  { code: "NZ", name: "New Zealand", supported: true, region: "Oceania" },
  { code: "SG", name: "Singapore", supported: true, region: "Asia" },
  { code: "JP", name: "Japan", supported: true, region: "Asia" },
  { code: "HK", name: "Hong Kong", supported: true, region: "Asia" },
  { code: "AE", name: "United Arab Emirates", supported: true, region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", supported: false, region: "Middle East" },
  { code: "BR", name: "Brazil", supported: false, region: "South America" },
  { code: "MX", name: "Mexico", supported: false, region: "North America" },
  { code: "IN", name: "India", supported: false, region: "Asia" },
  { code: "CN", name: "China", supported: false, region: "Asia" },
  { code: "RU", name: "Russia", supported: false, region: "Europe" },
  { code: "KR", name: "South Korea", supported: false, region: "Asia" },
];

export default function PersonalInfoPage() {
  const router = useRouter();
  const [fullLegalName, setFullLegalName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "prefer-not-to-say" | "">("");
  const [nationality, setNationality] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingInfo, setIsCheckingInfo] = useState(true);
  
  const [isNationalityDropdownOpen, setIsNationalityDropdownOpen] = useState(false);
  const [nationalityDropdownPosition, setNationalityDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const nationalityDropdownRef = useRef<HTMLDivElement>(null);

  // Calculate progress based on filled fields
  const calculateProgress = () => {
    const requiredFields = [
      fullLegalName,
      dateOfBirth,
      nationality,
    ];
    
    const filledFields = requiredFields.filter(field => field && field.trim() !== "").length;
    const totalFields = requiredFields.length;
    
    // When all required fields are filled, show 25%
    if (filledFields === totalFields) {
      return 25;
    }
    
    // Show partial progress based on filled fields (0% to 20%)
    return Math.round((filledFields / totalFields) * 20);
  };
  
  const progress = calculateProgress();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if personal info already exists in database
    const checkPersonalInfo = async () => {
      setIsCheckingInfo(true);
      try {
        const hasInfo = await hasPersonalInfo();
        if (hasInfo) {
          // Personal info already exists, use flow router to determine next step
          const { navigateToNextRoute } = await import("@/lib/auth/flow-router.service");
          await navigateToNextRoute(router);
          return;
        }

        // If not in DB, try to load from API
        try {
          const user = await getCurrentUser();
          if (user.full_name && user.dob && user.nationality) {
            // User has personal info, populate form but allow editing
            setFullLegalName(user.full_name || "");
            setDateOfBirth(user.dob ? new Date(user.dob).toISOString().split('T')[0] : "");
            setGender((user.gender as typeof gender) || "");
            setNationality(user.nationality || "");
            setPhoneNumber(user.phone_number || "");
            setIsCheckingInfo(false);
            return;
          }
        } catch (error) {
          // If API call fails, try localStorage as fallback
          console.log("Could not fetch user info, trying localStorage");
        }

        // Load saved data from localStorage if available
        const savedData = localStorage.getItem("quantivahq_personal_info");
        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            setFullLegalName(data.fullLegalName || "");
            setDateOfBirth(data.dateOfBirth || "");
            setGender(data.gender || "");
            setNationality(data.nationality || "");
            setPhoneNumber(data.phoneNumber || "");
          } catch (e) {
            console.error("Failed to load saved personal info", e);
          }
        }
      } catch (error) {
        console.error("Failed to check personal info:", error);
        // On error, still allow user to fill the form
      } finally {
        setIsCheckingInfo(false);
      }
    };

    checkPersonalInfo();
  }, [router]);

  // Calculate dropdown positions when they open
  useEffect(() => {
    if (isNationalityDropdownOpen && nationalityDropdownRef.current) {
      const rect = nationalityDropdownRef.current.getBoundingClientRect();
      setNationalityDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isNationalityDropdownOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const nationalityPortal = document.querySelector('[data-portal="nationality"]');
      
      if (isNationalityDropdownOpen) {
        if (nationalityDropdownRef.current && 
            !nationalityDropdownRef.current.contains(target) &&
            nationalityPortal &&
            !nationalityPortal.contains(target)) {
          setIsNationalityDropdownOpen(false);
        }
      }
    };

    if (isNationalityDropdownOpen) {
      // Use setTimeout to avoid immediate closure when opening
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isNationalityDropdownOpen]);

  const handleCountrySelect = (countryCode: string) => {
    setNationality(countryCode);
    setIsNationalityDropdownOpen(false);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Prepare form data
    const formData = {
      fullLegalName,
      dateOfBirth,
      gender: gender || undefined,
      nationality,
      phoneNumber: phoneNumber || undefined,
    };

    // Validate using schema
    const result = personalInfoSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as string;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Get user ID from localStorage or session
      // Note: In a real app, you'd get this from the authenticated session/token
      const userId = localStorage.getItem("quantivahq_user_id");
      
      if (!userId) {
        throw new Error("User not authenticated. Please sign in again.");
      }

      // Call backend API
      await updatePersonalInfo(userId, formData);
      
      // Store in localStorage for backup
      localStorage.setItem("quantivahq_personal_info", JSON.stringify(formData));
      
      setIsLoading(false);
      // Use flow router to determine next step
      const { navigateToNextRoute } = await import("@/lib/auth/flow-router.service");
      await navigateToNextRoute(router);
    } catch (error) {
      console.error("Failed to update personal info:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Failed to save personal information. Please try again.",
      });
      setIsLoading(false);
    }
  };

  const nationalityData = nationality ? COUNTRIES.find((c) => c.code === nationality) : null;

  // Show loading state while checking if personal info exists
  if (isCheckingInfo) {
    return (
      <div className="relative flex h-full w-full overflow-hidden items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
          <p className="text-sm text-slate-400">Checking your information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Background matching Figma design */}
      <div className="absolute inset-0 bg-black">
        {/* Subtle gradient orbs for depth */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6 lg:px-8">
        <div className="w-full max-w-6xl">
          {/* Header Section */}
          <div className="mb-2 sm:mb-3 text-center">
            <div className="mb-1.5 sm:mb-2 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14" />
            </div>
            <h1 className="mb-1 text-lg sm:text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
              Personal <span className="text-white">Information</span>
            </h1>
            <p className="mx-auto max-w-xl text-[10px] sm:text-xs text-slate-400 md:text-sm animate-text-enter" style={{ animationDelay: "0.4s" }}>
              Please provide your personal details as they appear on your official identification document.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-2 sm:mb-3 animate-text-enter" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1 sm:mb-1.5">
              <span className="text-slate-400 font-medium">Progress</span>
              <span className="font-bold text-white">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] transition-all duration-500 ease-out shadow-lg shadow-[#fc4f02]/50 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="animate-text-enter relative z-0" style={{ animationDelay: "0.6s" }}>
            <div className="group relative rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-3 sm:p-4 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/30 hover:shadow-[#fc4f02]/10 overflow-visible">
              <div className="absolute inset-0 bg-gradient-to-br from-[#fc4f02]/5 via-transparent to-[#fda300]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 z-0">
                {/* Left Column - 3 Fields */}
                <div className="space-y-2 sm:space-y-3">
                {/* Full Legal Name */}
                <div>
                  <label htmlFor="fullLegalName" className="mb-1 block text-xs font-semibold text-white flex items-center gap-2">
                    <span>Full Legal Name (as per ID)</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="fullLegalName"
                    type="text"
                    value={fullLegalName}
                    onChange={(e) => {
                      setFullLegalName(e.target.value);
                      setErrors({ ...errors, fullLegalName: "" });
                    }}
                    className={`w-full rounded-xl border-2 bg-[--color-surface] px-3 py-2 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20 ${
                      errors.fullLegalName
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                        : "border-[--color-border]"
                    }`}
                    placeholder="Enter your full legal name"
                    required
                  />
                  {errors.fullLegalName && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.fullLegalName}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="dateOfBirth" className="mb-1 block text-xs font-semibold text-white flex items-center gap-2">
                    <span>Date of Birth</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      setErrors({ ...errors, dateOfBirth: "" });
                    }}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className={`w-full rounded-xl border-2 bg-[--color-surface] px-3 py-2 text-sm text-white transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20 ${
                      errors.dateOfBirth
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                        : "border-[--color-border]"
                    }`}
                    required
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* Gender (Optional) */}
                <div>
                  <label htmlFor="gender" className="mb-1 block text-xs font-semibold text-white">
                    Gender <span className="text-slate-500 text-xs font-normal">(Optional)</span>
                  </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as typeof gender)}
                    className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-white transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
                  >
                    <option value="">Select gender (optional)</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                </div>

                {/* Right Column - 2 Fields */}
                <div className="space-y-2 sm:space-y-3 relative z-0">
                {/* Nationality / Country of Citizenship */}
                <div>
                  <label htmlFor="nationality" className="mb-1 block text-xs font-semibold text-white flex items-center gap-2">
                    <span>Nationality / Country of Citizenship</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative z-[100]" ref={nationalityDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNationalityDropdownOpen(!isNationalityDropdownOpen);
                      }}
                      className={`w-full text-left rounded-xl border-2 bg-[--color-surface] py-2.5 pr-12 text-white transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20 hover:border-[#fc4f02]/50 cursor-pointer ${
                        nationality ? "pl-12" : "pl-4"
                      } ${
                        errors.nationality
                          ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                          : nationality
                          ? "border-[#fc4f02] shadow-lg shadow-[#fc4f02]/20"
                          : "border-[--color-border]"
                      }`}
                    >
                      {nationality && nationalityData ? (
                        <span className="text-white">{nationalityData.name}</span>
                      ) : (
                        <span className="text-slate-400">Select your nationality</span>
                      )}
                    </button>
                    {nationality && (
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#10b981] shadow-lg shadow-[#10b981]/50" />
                      </div>
                    )}
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                      isNationalityDropdownOpen ? "rotate-180" : ""
                    } ${nationality ? "text-[#fc4f02]" : "text-slate-400"}`}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {isNationalityDropdownOpen && mounted && createPortal(
                      <div 
                        data-portal="nationality"
                        className="fixed rounded-xl border-2 border-[--color-border] bg-[#0f172a] shadow-2xl shadow-black/50 overflow-hidden z-[99999]"
                        style={{ 
                          top: `${nationalityDropdownPosition.top}px`,
                          left: `${nationalityDropdownPosition.left}px`,
                          width: `${nationalityDropdownPosition.width}px`
                        }}
                      >
                        <div className="overflow-y-auto bg-[#0f172a]" style={{ maxHeight: "180px" }}>
                          {COUNTRIES.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => handleCountrySelect(country.code)}
                              className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150 ${
                                nationality === country.code
                                  ? "bg-[#1e293b] text-white"
                                  : "text-white hover:bg-[#1e293b] bg-[#0f172a]"
                              }`}
                            >
                              {country.name}
                            </button>
                          ))}
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                  {errors.nationality && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.nationality}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="mb-1 block text-xs font-semibold text-white">
                    Phone Number <span className="text-slate-500 text-xs font-normal">(Optional)</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setErrors({ ...errors, phoneNumber: "" });
                    }}
                    className={`w-full rounded-xl border-2 bg-[--color-surface] px-3 py-2 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20 ${
                      errors.phoneNumber
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                        : "border-[--color-border]"
                    }`}
                    placeholder="+1234567890"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.phoneNumber}</p>
                  )}
                </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-3 sm:mt-4 text-center relative z-0">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Validating...
                    </>
                  ) : (
                    <>
                      Next
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
              {errors.submit && (
                <p className="mt-2 text-xs text-red-400">{errors.submit}</p>
              )}
              <p className="mt-3 text-xs text-slate-400">
                All information is encrypted and securely stored
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

