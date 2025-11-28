"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { BackButton } from "@/components/common/back-button";
import { useState, useEffect } from "react";
import { exchangesService } from "@/lib/api/exchanges.service";

export default function ApiKeysPage() {
  const router = useRouter();
  const [selectedExchange, setSelectedExchange] = useState<"binance" | "bybit" | "ibkr" | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [enableTrading, setEnableTrading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeId, setExchangeId] = useState<string | null>(null);

  useEffect(() => {
    // Get selected exchange from localStorage
    const exchange = localStorage.getItem("quantivahq_selected_exchange");
    if (exchange === "binance" || exchange === "bybit" || exchange === "ibkr") {
      setSelectedExchange(exchange);
    } else {
      // Default to Binance if not set
      setSelectedExchange("binance");
    }

    // Fetch or create exchange ID from backend
    const fetchExchangeId = async () => {
      try {
        const exchangeName = exchange === "binance" ? "Binance" : 
                           exchange === "bybit" ? "Bybit" : 
                           "Interactive Brokers";
        const exchangeType = exchange === "ibkr" ? "stocks" : "crypto";
        
        // Ensure exchange exists in database (creates if doesn't exist)
        const exchangeData = await exchangesService.ensureExchange(exchangeName, exchangeType);
        
        if (exchangeData) {
          setExchangeId(exchangeData.exchange_id);
          localStorage.setItem(`quantivahq_${exchange}_exchange_id`, exchangeData.exchange_id);
        }
      } catch (error) {
        console.error("Failed to fetch/create exchange:", error);
        // Fallback: try to get from localStorage
        const savedId = localStorage.getItem(`quantivahq_${exchange}_exchange_id`);
        if (savedId) {
          setExchangeId(savedId);
        }
      }
    };

    fetchExchangeId();
  }, []);

  const exchangeInfo = {
    binance: {
      name: "Binance",
      logo: (
        <Image
          src="/binance logo.png"
          alt="Binance"
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
        />
      ),
      requiresPassphrase: false,
    },
    bybit: {
      name: "Bybit",
      logo: (
        <Image
          src="/bybit logo.png"
          alt="Bybit"
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
        />
      ),
      requiresPassphrase: false,
    },
    ibkr: {
      name: "Interactive Brokers",
      logo: (
        <div className="flex h-12 w-12 items-center justify-center p-2">
          <Image
            src="/IBKR_logo.png"
            alt="Interactive Brokers"
            width={48}
            height={48}
            className="h-full w-full object-contain"
          />
        </div>
      ),
      requiresPassphrase: false,
    },
  };

  const currentExchange = selectedExchange ? exchangeInfo[selectedExchange] : exchangeInfo.binance;
  const exchangeName = selectedExchange ? exchangeInfo[selectedExchange].name : "Binance";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!apiKey.trim()) {
      newErrors.apiKey = "API Key is required";
    } else if (apiKey.trim().length < 10) {
      newErrors.apiKey = "API Key appears to be invalid";
    }

    if (!secretKey.trim()) {
      newErrors.secretKey = "Secret Key is required";
    } else if (secretKey.trim().length < 10) {
      newErrors.secretKey = "Secret Key appears to be invalid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!exchangeId) {
      setErrors({ general: "Exchange information not loaded. Please refresh the page." });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Create connection via backend
      const response = await exchangesService.createConnection({
        exchange_id: exchangeId,
        api_key: apiKey.trim(),
        api_secret: secretKey.trim(),
        enable_trading: enableTrading,
      });

      // Store connection ID temporarily in sessionStorage for verification step
      // sessionStorage is cleared when browser closes, more secure than localStorage
      sessionStorage.setItem("quantivahq_connection_id", response.data.connection_id);
      localStorage.setItem("quantivahq_enable_trading", enableTrading.toString());
      localStorage.setItem("quantivahq_exchange_connected", selectedExchange || "binance");

      // Navigate to connecting page
      router.push("/onboarding/connecting");
    } catch (error: any) {
      console.error("Failed to create connection:", error);
      setErrors({
        general: error.message || "Failed to create connection. Please check your API keys and try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden" >
      <BackButton />
      {/* Background matching Figma design */}
      <div className="absolute inset-0 bg-black" >
        {/* Subtle gradient orbs for depth */}
        < div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div >

      {/* Content */}
      < div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden" >
        <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-4 text-center">
            <div className="mb-2 flex justify-center">
              {currentExchange.logo}
            </div>
            <h1 className="mb-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
              Enter Your <span className="text-white">API Keys</span>
            </h1>
            <p className="mx-auto max-w-xl text-xs text-slate-400 sm:text-sm">
              Connect your {exchangeName} account by entering your API credentials securely.
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* General Error Display */}
            {errors.general && (
              <div className="rounded-lg border-l-4 border-red-500/50 bg-red-500/10 p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-red-200">{errors.general}</p>
                </div>
              </div>
            )}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm p-3.5 shadow-xl">
              {/* API Key Input */}
              <div className="mb-3">
                <label htmlFor="apiKey" className="mb-2 block text-sm font-semibold text-white">
                  API Key <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      if (errors.apiKey) {
                        setErrors({ ...errors, apiKey: "" });
                      }
                    }}
                    className={`w-full rounded-lg border-2 bg-slate-800/60 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/20 ${errors.apiKey
                      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-700/50"
                      }`}
                    placeholder={`Enter your ${exchangeName} API Key`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showApiKey ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.apiKey && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.apiKey}</p>
                )}
              </div>

              {/* Secret Key Input */}
              <div className="mb-3">
                <label htmlFor="secretKey" className="mb-2 block text-sm font-semibold text-white">
                  Secret Key <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="secretKey"
                    type={showSecretKey ? "text" : "password"}
                    value={secretKey}
                    onChange={(e) => {
                      setSecretKey(e.target.value);
                      if (errors.secretKey) {
                        setErrors({ ...errors, secretKey: "" });
                      }
                    }}
                    className={`w-full rounded-lg border-2 bg-slate-800/60 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/20 ${errors.secretKey
                      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-700/50"
                      }`}
                    placeholder={`Enter your ${exchangeName} Secret Key`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showSecretKey ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.secretKey && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.secretKey}</p>
                )}
              </div>

              {/* Passphrase Input (Optional) */}
              {currentExchange.requiresPassphrase && (
                <div className="mb-3">
                  <label htmlFor="passphrase" className="mb-2 block text-sm font-semibold text-white">
                    Passphrase <span className="text-xs text-slate-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="passphrase"
                      type={showPassphrase ? "text" : "password"}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-700/50 bg-slate-800/60 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/20"
                      placeholder="Enter passphrase (if required)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showPassphrase ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Enable Trading Toggle */}
              <div className="mb-3 rounded-lg border border-slate-700/50 bg-slate-800/40 p-3">
                <label className="flex cursor-pointer items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white">Enable Trading</span>
                      <span className="rounded bg-green-500/20 border border-green-500/30 px-2 py-0.5 text-xs font-medium text-green-400">Recommended</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Allow QuantivaHQ to execute trades and manage your trading strategies automatically.
                    </p>
                  </div>
                  <div className="ml-3">
                    <button
                      type="button"
                      onClick={() => setEnableTrading(!enableTrading)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${enableTrading ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]" : "bg-slate-700"
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableTrading ? "translate-x-6" : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>
                </label>
              </div>

              {/* Security Notice */}
              <div className="rounded-lg border-l-4 border-green-500/50 bg-green-500/10 p-2.5">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 shrink-0 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-[10px] text-green-200 leading-relaxed">
                    <span className="font-semibold">We do NOT store or share your keys.</span> All keys are encrypted using industry-standard AES-256 encryption and stored securely. Your keys are only used to connect to your exchange account.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center mt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Connect Account
                    <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </div>
          </form>
        </div>
      </div >
    </div >
  );
}

