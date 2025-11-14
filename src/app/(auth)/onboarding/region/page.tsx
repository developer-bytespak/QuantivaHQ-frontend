"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { BackButton } from "@/components/common/back-button";
import { useState, useEffect, useRef } from "react";

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

export default function RegionPage() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved region from localStorage if available
    const savedRegion = localStorage.getItem("quantivahq_region");
    if (savedRegion) {
      setSelectedCountry(savedRegion);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setError("");
    setIsDropdownOpen(false);

    if (countryCode) {
      const country = COUNTRIES.find((c) => c.code === countryCode);
      if (country && !country.supported) {
        setShowDisclaimer(true);
      } else {
        setShowDisclaimer(false);
      }
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleContinue = () => {
    if (!selectedCountry) {
      setError("Please select your country or region");
      return;
    }

    const country = COUNTRIES.find((c) => c.code === selectedCountry);
    if (!country) {
      setError("Invalid selection");
      return;
    }

    if (!country.supported) {
      setError("This region is not currently supported. Please select a supported region.");
      return;
    }

    // Store in localStorage
    localStorage.setItem("quantivahq_region", selectedCountry);
    localStorage.setItem("quantivahq_region_name", country.name);

    // Navigate to next step
    router.push("/onboarding/risk-disclosure");
  };

  const selectedCountryData = selectedCountry
    ? COUNTRIES.find((c) => c.code === selectedCountry)
    : null;

    return (
      <div className="relative flex h-full w-full overflow-hidden">
        <BackButton />
        {/* Background matching Figma design */}
      <div className="absolute inset-0 bg-black">
        {/* Subtle gradient orbs for depth */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8 lg:px-8">
        <div className="w-full max-w-2xl" style={{ position: "relative", zIndex: 1 }}>
          {/* Header Section */}
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-12 w-12 md:h-14 md:w-14" />
            </div>
            <h1 className="mb-2 text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
              Select Your <span className="text-white">Region</span>
            </h1>
            <p className="mx-auto max-w-xl text-xs text-slate-400 md:text-sm animate-text-enter" style={{ animationDelay: "0.4s" }}>
              We need to know your location to ensure compliance with local trading regulations and provide you with the appropriate services.
            </p>
          </div>

          {/* Region Selection Form */}
          <div className="mb-4 animate-text-enter" style={{ animationDelay: "0.6s", position: "relative", zIndex: 100 }}>
              <div className="group relative rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/30 hover:shadow-[#fc4f02]/10">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#fc4f02]/5 via-transparent to-[#fda300]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10">
                  {/* Label with icon */}
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
                      <svg className="h-4 w-4 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <label htmlFor="country" className="text-sm font-semibold text-white">
                      Country or Region
                    </label>
                  </div>
                  
                  {/* Custom Dropdown */}
                  <div className="relative mb-3" ref={dropdownRef} style={{ zIndex: 9999 }}>
                    {/* Dropdown Button */}
                    <button
                      type="button"
                      onClick={toggleDropdown}
                      className={`w-full text-left rounded-xl border-2 bg-[--color-surface] py-3 pr-12 text-white transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20 hover:border-[#fc4f02]/50 cursor-pointer ${
                        selectedCountry ? "pl-12" : "pl-5"
                      } ${
                        error
                          ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                          : selectedCountry
                          ? "border-[#fc4f02] shadow-lg shadow-[#fc4f02]/20"
                          : "border-[--color-border]"
                      }`}
                    >
                      <span className={selectedCountry ? "text-white" : "text-slate-400"}>
                        {selectedCountry && selectedCountryData
                          ? selectedCountryData.name
                          : "Select your country or region"}
                      </span>
                    </button>

                    {/* Selected country indicator */}
                    {selectedCountry && selectedCountryData && (
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#10b981] shadow-lg shadow-[#10b981]/50 animate-pulse" />
                      </div>
                    )}

                    {/* Dropdown arrow */}
                    <div
                      className={`absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200 z-10 ${
                        isDropdownOpen ? "rotate-180" : ""
                      } ${selectedCountry ? "text-[#fc4f02]" : "text-slate-400"}`}
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div 
                        className="absolute top-full left-0 right-0 mt-2 rounded-xl border-2 border-[--color-border] bg-[#0f172a] shadow-2xl shadow-black/50 overflow-hidden"
                        style={{ zIndex: 10000, isolation: "isolate" }}
                      >
                        <div className="overflow-y-auto bg-[#0f172a]" style={{ maxHeight: "264px", scrollbarWidth: "thin", backgroundColor: "#0f172a" }}>
                          {COUNTRIES.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => handleCountrySelect(country.code)}
                              disabled={!country.supported}
                              className={`w-full text-left px-5 py-3 text-sm transition-colors duration-150 ${
                                selectedCountry === country.code
                                  ? "bg-[#1e293b] text-white"
                                  : country.supported
                                  ? "text-white hover:bg-[#1e293b] bg-[#0f172a]"
                                  : "text-slate-500 cursor-not-allowed bg-[#1e293b]"
                              }`}
                              style={{ backgroundColor: selectedCountry === country.code ? "#1e293b" : country.supported ? "#0f172a" : "#1e293b" }}
                            >
                              {country.name} {!country.supported && "(Not Supported)"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-500/5 px-4 py-3 backdrop-blur">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/20">
                        <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Disclaimer for unsupported regions */}
                  {showDisclaimer && selectedCountryData && !selectedCountryData.supported && (
                    <div className="mt-4 rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4 backdrop-blur">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                          <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-amber-400 mb-1">
                            Region Not Currently Supported
                          </p>
                          <p className="text-[11px] text-amber-300/90 leading-relaxed">
                            {selectedCountryData.name} is not currently supported for trading services. Please select a supported region to continue. We're working to expand our services to more regions.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Legal Disclaimer - Enhanced */}
                  <div className="mt-3 rounded-xl border border-[#10b981]/30 bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5 p-3 backdrop-blur">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#10b981]/20">
                        <svg className="h-4 w-4 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[#10b981] mb-1">
                          Legal Compliance Notice
                        </p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          By selecting your region, you confirm that you are legally permitted to trade in your jurisdiction. QuantivaHQ complies with all applicable regulations including GDPR, MiFID II, and local trading laws. Your region selection helps us provide compliant services and appropriate risk disclosures.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section - Positioned at bottom */}
            <div className="w-full mt-4">
              <div className="text-center animate-text-enter" style={{ animationDelay: "0.8s" }}>
                <button
                  onClick={handleContinue}
                  disabled={!selectedCountry || !selectedCountryData?.supported}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Continue
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  {/* Shine effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
                <p className="mt-3 text-xs text-slate-400">
                  Your selection will be saved for compliance purposes
                </p>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

