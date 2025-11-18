"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

type ErrorType = 
  | "invalid_api_key"
  | "incorrect_permissions"
  | "ip_whitelist_required"
  | "exchange_outage"
  | "network_error"
  | null;

export default function ConnectingPage() {
  const router = useRouter();
  const [selectedExchange, setSelectedExchange] = useState<"binance" | "bybit" | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "success" | "error">("connecting");
  const [errorType, setErrorType] = useState<ErrorType>(null);

  useEffect(() => {
    // Get selected exchange from localStorage
    const exchange = localStorage.getItem("quantivahq_selected_exchange");
    if (exchange === "binance" || exchange === "bybit") {
      setSelectedExchange(exchange);
    } else {
      setSelectedExchange("binance");
    }

    // Simulate API connection verification
    const timer = setTimeout(() => {
      // In a real app, this would be an actual API call to verify the keys
      // For demo purposes, you can simulate failure by uncommenting the error simulation below
      
      // Simulate success (default)
      setConnectionStatus("success");
      
      // Uncomment below to simulate different error types for testing:
      // const shouldFail = Math.random() > 0.7; // 30% chance of failure
      // if (shouldFail) {
      //   const errorTypes: ErrorType[] = [
      //     "invalid_api_key",
      //     "incorrect_permissions",
      //     "ip_whitelist_required",
      //     "exchange_outage",
      //     "network_error"
      //   ];
      //   setErrorType(errorTypes[Math.floor(Math.random() * errorTypes.length)]);
      //   setConnectionStatus("error");
      // } else {
      //   setConnectionStatus("success");
      // }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const exchangeInfo = {
    binance: {
      name: "Binance",
      logo: (
        <Image
          src="/binance logo.png"
          alt="Binance"
          width={64}
          height={64}
          className="h-16 w-16 object-contain"
        />
      ),
    },
    bybit: {
      name: "Bybit",
      logo: (
        <Image
          src="/bybit logo.png"
          alt="Bybit"
          width={64}
          height={64}
          className="h-16 w-16 object-contain"
        />
      ),
    },
  };

  const currentExchange = selectedExchange ? exchangeInfo[selectedExchange] : exchangeInfo.binance;
  const exchangeName = selectedExchange ? exchangeInfo[selectedExchange].name : "Binance";

  const getErrorDetails = () => {
    switch (errorType) {
      case "invalid_api_key":
        return {
          title: "Invalid API Key",
          description: "The API key you provided is not valid. Please check that you copied it correctly.",
        };
      case "incorrect_permissions":
        return {
          title: "Incorrect Permissions",
          description: "Your API key doesn't have the required permissions. Please enable 'Read' and 'Enable Trading' permissions.",
        };
      case "ip_whitelist_required":
        return {
          title: "IP Whitelist Required",
          description: "Your exchange account requires IP whitelisting. Please add our server IP to your API key's whitelist.",
        };
      case "exchange_outage":
        return {
          title: "Exchange Outage",
          description: "The exchange is currently experiencing issues. Please try again in a few minutes.",
        };
      case "network_error":
        return {
          title: "Network Error",
          description: "Unable to reach the exchange servers. Please check your internet connection and try again.",
        };
      default:
        return {
          title: "Connection Failed",
          description: "Your API Keys could not be verified. Please check your credentials and try again.",
        };
    }
  };

  const handleTryAgain = () => {
    router.push("/onboarding/api-keys");
  };

  const handleBackToInstructions = () => {
    router.push("/onboarding/api-key-tutorial");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

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
      <div className="relative z-10 flex h-full w-full items-center justify-center overflow-y-auto">
        <div className="mx-auto w-full max-w-lg px-4 py-6 text-center">
          {/* Exchange Logo */}
          <div className="mb-6 flex justify-center">
            {currentExchange.logo}
          </div>

          {/* Connecting State */}
          {connectionStatus === "connecting" && (
            <>
              {/* Spinner Animation */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  {/* Outer rotating ring */}
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02] border-r-[#fda300]"></div>
                  {/* Inner pulsing circle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Status Text */}
              <div className="space-y-2 mb-6">
                <h2 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                  Connecting to <span className="text-[#fc4f02]">{exchangeName}</span>...
                </h2>
                <p className="mx-auto max-w-md text-sm text-slate-400 sm:text-base">
                  Please wait while we verify your API permissions.
                </p>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#fc4f02] animate-pulse" style={{ animationDelay: "0s" }}></div>
                <div className="h-2 w-2 rounded-full bg-[#fc4f02] animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="h-2 w-2 rounded-full bg-[#fc4f02] animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </>
          )}

          {/* Success State */}
          {connectionStatus === "success" && (
            <>
              {/* Success Checkmark */}
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 shadow-lg shadow-green-500/20">
                  <svg className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Success Text */}
              <div className="space-y-3 mb-8">
                <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                  Your <span className="text-green-400">{exchangeName}</span> Account is Successfully Connected!
                </h2>
                <p className="mx-auto max-w-md text-sm text-slate-400 sm:text-base">
                  You can now start trading with QuantivaHQ. Your account is ready to use.
                </p>
              </div>

              {/* Success Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleGoToDashboard}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#fc4f02]/40"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Go to Dashboard
                    <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              </div>
            </>
          )}

          {/* Error State */}
          {connectionStatus === "error" && (
            <>
              {/* Error Icon */}
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-rose-500/20 border-2 border-red-500/50 shadow-lg shadow-red-500/20">
                  <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>

              {/* Error Text */}
              <div className="space-y-3 mb-6">
                <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                  Connection Failed
                </h2>
                <p className="mx-auto max-w-md text-base text-slate-300">
                  Your API Keys could not be verified.
                </p>
              </div>

              {/* Error Details */}
              {errorType && (
                <div className="mb-6 rounded-lg border-l-4 border-red-500/50 bg-red-500/10 p-4 text-left">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-400 mb-1">
                        {getErrorDetails().title}
                      </h3>
                      <p className="text-xs text-red-200 leading-relaxed">
                        {getErrorDetails().description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleTryAgain}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#fc4f02]/40"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Try Again
                    <svg className="h-5 w-5 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>

                <button
                  onClick={handleBackToInstructions}
                  className="rounded-xl border-2 border-slate-700/50 bg-slate-800/40 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition-all duration-300 hover:border-[#fc4f02]/50 hover:bg-slate-700/60"
                >
                  Back to Instructions
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

