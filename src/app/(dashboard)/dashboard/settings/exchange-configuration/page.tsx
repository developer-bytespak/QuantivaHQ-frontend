"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { SettingsBackButton } from "@/components/settings/settings-back-button";
import { useNotification, Notification } from "@/components/common/notification";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { exchangesService } from "@/lib/api/exchanges.service";

interface ExchangeConnection {
  connection_id: string;
  exchange_id: string;
  exchange_name: string;
  status: "active" | "pending" | "invalid";
  created_at: string;
  updated_at: string;
  account_type?: string;
  verified: boolean;
  exchange?: {
    exchange_id: string;
    name: string;
    type: "crypto" | "stocks";
    supports_oauth: boolean;
    created_at: string;
  };
}

const getExchangeIcon = (exchangeName: string) => {
  switch (exchangeName?.toLowerCase()) {
    case "binance":
      return "🔷";
    case "bybit":
      return "📊";
    default:
      return "💱";
  }
};

export default function ExchangeConfigurationPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<ExchangeConnection | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [exchangeType, setExchangeType] = useState<"crypto" | "stocks">("crypto");
  const [cryptoToggle, setCryptoToggle] = useState<"binance" | "bybit">("binance");
  const [hasActiveConnection, setHasActiveConnection] = useState(false);
  const [activeExchange, setActiveExchange] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    api_key: "",
    api_secret: "",
    password: "",
    passphrase: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; connectionId: string | null }>({
    isOpen: false,
    connectionId: null,
  });

  useEffect(() => {
    setMounted(true);
    loadConnections();
  }, []);

  useEffect(() => {
    // First priority: Check URL params for explicit type
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');
    
    if (typeParam === 'stocks' || typeParam === 'crypto') {
      setExchangeType(typeParam);
      
      // Find matching connection if exists
      if (connections.length > 0) {
        const matchingConn = connections.find(c => 
          c.status === 'active' && 
          c.exchange?.type === typeParam &&
          c.exchange_name
        );
        
        if (matchingConn) {
          const exchangeName = matchingConn.exchange_name.toLowerCase();
          setHasActiveConnection(true);
          setActiveExchange(exchangeName);
          
          if (typeParam === 'crypto' && (exchangeName === 'binance' || exchangeName === 'bybit')) {
            setCryptoToggle(exchangeName as 'binance' | 'bybit');
          }
        } else {
          setHasActiveConnection(false);
          setActiveExchange(null);
        }
      }
    } else if (connections.length > 0) {
      // Fallback: Detect from connections if no URL param
      const activeConn = connections.find(c => c.status === 'active');
      if (activeConn && activeConn.exchange_name) {
        const connType = activeConn.exchange?.type || 'crypto';
        const exchangeName = activeConn.exchange_name.toLowerCase();
        
        setExchangeType(connType);
        setHasActiveConnection(true);
        setActiveExchange(exchangeName);
        
        if (connType === 'crypto' && (exchangeName === 'binance' || exchangeName === 'bybit')) {
          setCryptoToggle(exchangeName as 'binance' | 'bybit');
        }
      }
    }
  }, [connections]);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const data = await exchangesService.getConnections();
      console.log('[loadConnections] Response:', data);
      
      // Handle both array and object responses
      let connectionsList: any[] = [];
      if (Array.isArray(data)) {
        connectionsList = data;
      } else if (data && typeof data === 'object' && 'data' in data) {
        const dataObj = data as any;
        if (Array.isArray(dataObj.data)) {
          connectionsList = dataObj.data;
        }
      }
      
      setConnections(connectionsList);
    } catch (error: any) {
      console.error("Failed to load connections:", error);
      showNotification("Failed to load exchange connections", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConnection = (connection: ExchangeConnection) => {
    setSelectedConnection(connection);
    setShowUpdateForm(true);
    setFormData({
      api_key: "",
      api_secret: "",
      password: "",
      passphrase: "",
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.api_key.trim()) {
      errors.api_key = "API Key is required";
    } else if (formData.api_key.length < 10) {
      errors.api_key = "API Key must be at least 10 characters";
    }

    if (!formData.api_secret.trim()) {
      errors.api_secret = "API Secret is required";
    } else if (formData.api_secret.length < 10) {
      errors.api_secret = "API Secret must be at least 10 characters";
    }

    if (!formData.password.trim()) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateConnection = async () => {
    if (!validateForm() || !selectedConnection) return;

    try {
      setIsSubmitting(true);
      await exchangesService.updateConnection(selectedConnection.connection_id, {
        api_key: formData.api_key,
        api_secret: formData.api_secret,
        password: formData.password,
        ...(formData.passphrase && { passphrase: formData.passphrase }),
      });

      showNotification("Exchange connection updated successfully", "success");
      setShowUpdateForm(false);
      setSelectedConnection(null);
      loadConnections();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update exchange connection";
      showNotification(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConnection = (connectionId: string) => {
    setDeleteConfirmation({ isOpen: true, connectionId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.connectionId) return;

    try {
      setIsSubmitting(true);
      await exchangesService.deleteConnection(deleteConfirmation.connectionId);
      showNotification("Exchange connection deleted successfully", "success");
      setDeleteConfirmation({ isOpen: false, connectionId: null });
      loadConnections();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete exchange connection";
      showNotification(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-900/30 border-green-500/30 text-green-400";
      case "pending":
        return "bg-yellow-900/30 border-yellow-500/30 text-yellow-400";
      case "invalid":
        return "bg-red-900/30 border-red-500/30 text-red-400";
      default:
        return "bg-slate-900/30 border-slate-500/30 text-slate-400";
    }
  };

  const handleExchangeSwitch = () => {
    if (exchangeType === "crypto") {
      const newExchange = cryptoToggle === "binance" ? "bybit" : "binance";
      setCryptoToggle(newExchange);
      localStorage.setItem("quantivahq_selected_exchange", newExchange);
      router.push("/onboarding/crypto-exchange");
    } else {
      // For stocks, always go to Alpaca
      localStorage.setItem("quantivahq_selected_stocks_exchange", "alpaca");
      router.push("/onboarding/stock-exchange");
    }
  };

  const handleSwitchPlatform = () => {
    if (exchangeType === "crypto") {
      const newExchange = activeExchange === "binance" ? "bybit" : "binance";
      localStorage.setItem("quantivahq_selected_exchange", newExchange);
      router.push("/onboarding/crypto-exchange");
    } else {
      // For stocks, always go to Alpaca (only platform)
      localStorage.setItem("quantivahq_selected_stocks_exchange", "alpaca");
      router.push("/onboarding/stock-exchange");
    }
  };

  const getActiveCryptoConnection = () => {
    return connections.find(c => 
      c.status === 'active' && 
      c.exchange?.type === 'crypto'
    );
  };

  const getActiveStocksConnection = () => {
    return connections.find(c => 
      c.status === 'active' && 
      c.exchange?.type === 'stocks'
    );
  };

  const getFilteredConnections = () => {
    return connections.filter(c => c.exchange?.type === exchangeType);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Exchange Connection?"
        message="Are you sure you want to delete this exchange connection? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, connectionId: null })}
        type="danger"
      />
      <SettingsBackButton />
      
      {/* Connection Details Overlay */}
      {selectedConnection && mounted && typeof window !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedConnection(null)}
        >
            <div
              className="relative mx-auto w-full max-w-2xl rounded-lg sm:rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 shadow-2xl shadow-black/50 backdrop-blur animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="border-b border-[--color-border]/30 bg-gradient-to-br from-[--color-surface-alt] to-[--color-surface-alt]/90 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold text-white truncate">{selectedConnection.exchange_name}</h2>
                  {selectedConnection.verified && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-[#fc4f02]/20 text-[#fc4f02] border border-[#fc4f02]/30">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedConnection(null)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white self-start sm:self-auto flex-shrink-0"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Status Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Status</p>
                  <p className="text-base sm:text-lg font-semibold text-white capitalize">{selectedConnection.status}</p>
                </div>
                <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Account Type</p>
                  <p className="text-base sm:text-lg font-semibold text-white">{selectedConnection.account_type || 'Standard'}</p>
                </div>
                <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Connected</p>
                  <p className="text-base sm:text-lg font-semibold text-white">{new Date(selectedConnection.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Connection ID</p>
                  <p className="text-base sm:text-lg font-semibold text-white font-mono text-xs truncate">{selectedConnection.connection_id.substring(0, 12)}...</p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">Exchange Connections</h1>
          </div>
        </div>

        {/* Exchange Switch Section */}
        <div className="bg-gradient-to-br from-[#fc4f02]/10 to-[#fc4f02]/5 border border-[#fc4f02]/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          {/* Exchange Type Header - Show current type */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#fc4f02]/20 border border-[#fc4f02]/30">
              <svg className="w-4 h-4 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-sm font-semibold text-[#fc4f02]">
                {exchangeType === 'crypto' ? 'Crypto Exchanges' : 'Stock Brokers'}
              </span>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {hasActiveConnection ? 'Connected Exchange' : 'Connect Exchange'}
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            {hasActiveConnection
              ? exchangeType === "crypto"
                ? `You're connected to ${activeExchange?.charAt(0).toUpperCase()}${activeExchange?.slice(1)}. Update credentials or switch to ${activeExchange === 'binance' ? 'Bybit' : 'Binance'}.`
                : "You're connected to Alpaca for stock trading."
              : exchangeType === "crypto" 
                ? "Toggle between Binance and Bybit to connect your preferred exchange"
                : "Connect your Alpaca account for stock trading"}
          </p>
          
          {hasActiveConnection ? (
            <div className="space-y-4">
              {/* Current Connection Display */}
              <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    exchangeType === "crypto"
                      ? activeExchange === "binance"
                        ? "bg-[#f7931a] text-white"
                        : "bg-[#f0b90b] text-white"
                      : "bg-[#fcda03] text-slate-900"
                  }`}>
                    <span className="text-xl font-bold">
                      {exchangeType === "crypto"
                        ? activeExchange === "binance" ? "B" : "₿"
                        : "A"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-bold text-lg capitalize">{activeExchange}</p>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-900/30 border border-green-500/30 text-green-400">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 capitalize">{exchangeType} Exchange</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const conn = exchangeType === 'crypto' ? getActiveCryptoConnection() : getActiveStocksConnection();
                    if (conn) handleSelectConnection(conn);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-[--color-surface] border border-[--color-border] text-white font-medium hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reconnect / Update Credentials
                </button>
                {exchangeType === "crypto" && (
                  <button
                    onClick={handleSwitchPlatform}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Switch to {activeExchange === "binance" ? "Bybit" : "Binance"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {exchangeType === "crypto" ? (
                  <>
                    <div className="flex items-center gap-3">
                      {/* Binance Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                        cryptoToggle === "binance" 
                          ? "bg-[#f7931a] text-white" 
                          : "bg-[#f7931a]/20 text-[#f7931a]"
                      }`}>
                        <span className="text-lg font-bold">B</span>
                      </div>
                      <span className="text-sm sm:text-base font-medium text-white">Binance</span>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => setCryptoToggle(cryptoToggle === "binance" ? "bybit" : "binance")}
                      className={`relative inline-flex h-7 w-14 sm:h-8 sm:w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 focus:ring-offset-2 focus:ring-offset-slate-900 flex-shrink-0 ${
                        cryptoToggle === "bybit"
                          ? "bg-gradient-to-r from-[#f0b90b] to-[#ffc53d]"
                          : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                          cryptoToggle === "bybit" ? "translate-x-7 sm:translate-x-9" : "translate-x-1"
                        }`}
                      />
                    </button>

                    {/* Bybit Icon */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm sm:text-base font-medium text-white">Bybit</span>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                        cryptoToggle === "bybit" 
                          ? "bg-[#f0b90b] text-white" 
                          : "bg-[#f0b90b]/20 text-[#f0b90b]"
                      }`}>
                        <span className="text-lg font-bold">₿</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* Alpaca Icon - Only option for stocks */}
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#fcda03] text-slate-900 flex-shrink-0">
                      <span className="text-lg font-bold">A</span>
                    </div>
                    <div>
                      <span className="text-sm sm:text-base font-medium text-white block">Alpaca</span>
                      <span className="text-xs text-slate-400">Stock Trading Platform</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Connect Button */}
              <button
                onClick={handleExchangeSwitch}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all duration-300"
              >
                Connect
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8 sm:py-12 bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl">
            <div className="animate-spin w-8 h-8 mx-auto mb-3">
              <svg className="w-full h-full text-[#fc4f02]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <p className="text-slate-400 text-base sm:text-lg">Loading connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl">
            <svg className="w-12 sm:w-16 h-12 sm:h-16 text-slate-500 mx-auto mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-slate-400 text-base sm:text-lg">No exchange connections yet</p>
            <p className="text-slate-500 text-xs sm:text-sm mt-2">Connect your exchange account to get started</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {getFilteredConnections().map((connection) => (
              <div
                key={connection.connection_id}
                onClick={() => {
                  setSelectedConnection(connection);
                  setShowUpdateForm(false);
                }}
                className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-[#fc4f02]/30 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-white truncate">{connection.exchange_name}</h3>
                      {connection.verified && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#fc4f02]/20 text-[#fc4f02] border border-[#fc4f02]/30 flex-shrink-0">
                          Verified
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 border ${getStatusColor(connection.status)}`}>
                        {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-3 sm:mt-4">
                      <p className="text-xs sm:text-sm text-slate-400 mb-1">Type</p>
                      <p className="text-sm sm:text-base text-white font-medium capitalize">{connection.exchange?.type || 'crypto'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <svg className="w-4 sm:w-5 h-4 sm:h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Form Modal */}
      {showUpdateForm && selectedConnection && mounted && typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-lg sm:rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="border-b border-[--color-border] bg-[--color-surface]/80 backdrop-blur-sm p-4 sm:p-6 flex items-start justify-between flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-white">Update Credentials</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 truncate">{selectedConnection.exchange_name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedConnection(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
                {/* Warning Box */}
                <div className="bg-[#fc4f02]/10 border border-[#fc4f02]/30 rounded-lg p-3 sm:p-4">
                  <p className="text-[#fc4f02] text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <span>⚠️</span> Security Notice
                  </p>
                  <p className="text-slate-300 text-xs sm:text-sm mt-2">
                    Credentials are AES-256 encrypted. Your password is required for verification.
                  </p>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => {
                      setFormData({ ...formData, api_key: e.target.value });
                      if (formErrors.api_key) setFormErrors({ ...formErrors, api_key: "" });
                    }}
                    placeholder="Enter new API key"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[--color-surface-alt] border ${
                      formErrors.api_key ? "border-red-500/50" : "border-[--color-border]"
                    } focus:border-[#fc4f02] text-white placeholder:text-slate-500 text-sm transition-colors focus:outline-none focus:ring-0`}
                  />
                  {formErrors.api_key && (
                    <p className="text-red-400 text-xs mt-1.5 font-medium">{formErrors.api_key}</p>
                  )}
                </div>

                {/* API Secret */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={formData.api_secret}
                    onChange={(e) => {
                      setFormData({ ...formData, api_secret: e.target.value });
                      if (formErrors.api_secret) setFormErrors({ ...formErrors, api_secret: "" });
                    }}
                    placeholder="Enter new API secret"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[--color-surface-alt] border ${
                      formErrors.api_secret ? "border-red-500/50" : "border-[--color-border]"
                    } focus:border-[#fc4f02] text-white placeholder:text-slate-500 text-sm transition-colors focus:outline-none focus:ring-0`}
                  />
                  {formErrors.api_secret && (
                    <p className="text-red-400 text-xs mt-1.5 font-medium">{formErrors.api_secret}</p>
                  )}
                </div>

                {/* Passphrase for Bybit */}
                {selectedConnection.exchange_name?.toLowerCase() === "bybit" && (
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                      Passphrase (Optional)
                    </label>
                    <input
                      type="password"
                      value={formData.passphrase}
                      onChange={(e) => setFormData({ ...formData, passphrase: e.target.value })}
                      placeholder="Bybit passphrase if required"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[--color-surface-alt] border border-[--color-border] focus:border-[#fc4f02] text-white placeholder:text-slate-500 text-sm transition-colors focus:outline-none focus:ring-0"
                    />
                  </div>
                )}

                {/* Password Verification Box */}
                <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg p-4">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                    Your Password (Required)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (formErrors.password) setFormErrors({ ...formErrors, password: "" });
                      }}
                      placeholder="Enter your password"
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-lg bg-[--color-surface-alt] border ${
                        formErrors.password ? "border-red-500/50" : "border-[--color-border]"
                      } focus:border-[#fc4f02] text-white placeholder:text-slate-500 text-sm transition-colors focus:outline-none focus:ring-0`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors flex-shrink-0"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-red-400 text-xs mt-1.5 font-medium">{formErrors.password}</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-[--color-border] bg-[--color-surface]/80 backdrop-blur-sm p-4 sm:p-6 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedConnection(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg border border-[--color-border] bg-[--color-surface] hover:bg-[--color-surface-alt] disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateConnection}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#FDA300] hover:shadow-lg hover:shadow-[#fc4f02]/50 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all duration-200"
                >
                  {isSubmitting ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Dialog */}
      {mounted && typeof window !== "undefined" && (
        <ConfirmationDialog
          isOpen={deleteConfirmation.isOpen}
          title="Delete Exchange Connection?"
          message="This will permanently remove your exchange connection. You can reconnect later if needed."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmation({ isOpen: false, connectionId: null })}
          type="danger"
        />
      )}

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
    </div>
  );
}
