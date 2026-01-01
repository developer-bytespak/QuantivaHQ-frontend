"use client";

import { useState, useEffect } from "react";
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
  const { notification, showNotification, hideNotification } = useNotification();
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<ExchangeConnection | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

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
            className="relative mx-4 w-full max-w-2xl rounded-lg sm:rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-4 sm:p-6 shadow-2xl shadow-black/50 backdrop-blur animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white">{selectedConnection.exchange_name}</h2>
                  {selectedConnection.verified && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-[#fc4f02]/20 text-[#fc4f02] border border-[#fc4f02]/30">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedConnection(null)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white self-start sm:self-auto"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 sm:space-y-6">
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

              {/* Actions */}
              <div className="pt-4 sm:pt-6 border-t border-[--color-border]/50 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    handleSelectConnection(selectedConnection);
                  }}
                  className="flex-1 px-4 py-2 sm:py-2.5 rounded-lg bg-[--color-surface] border border-[--color-border] text-white text-sm sm:text-base hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt] transition-all duration-200 font-medium"
                >
                  Update Credentials
                </button>
                <button
                  onClick={() => {
                    setShowUpdateForm(false);
                    handleDeleteConnection(selectedConnection.connection_id);
                  }}
                  className="flex-1 px-4 py-2 sm:py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm sm:text-base hover:bg-red-500/30 transition-all duration-200 font-medium"
                >
                  Delete Connection
                </button>
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
            {connections.map((connection) => (
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
                      <p className="text-xs sm:text-sm text-slate-400 mb-1">Status</p>
                      <p className="text-sm sm:text-base text-white font-medium capitalize">{connection.status}</p>
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
            <div className="w-full max-w-md rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="border-b border-[--color-border] bg-[--color-surface]/80 backdrop-blur-sm p-5 sm:p-6 flex items-start justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Update Credentials</h2>
                  <p className="text-sm text-slate-400 mt-1">{selectedConnection.exchange_name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedConnection(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
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
                    className={`w-full px-4 py-3 rounded-lg bg-[--color-surface-alt] border ${
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
                    className={`w-full px-4 py-3 rounded-lg bg-[--color-surface-alt] border ${
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
                      className="w-full px-4 py-3 rounded-lg bg-[--color-surface-alt] border border-[--color-border] focus:border-[#fc4f02] text-white placeholder:text-slate-500 text-sm transition-colors focus:outline-none focus:ring-0"
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
                      className={`w-full px-4 py-3 pr-10 rounded-lg bg-[--color-surface-alt] border ${
                        formErrors.password ? "border-red-500/50" : "border-[--color-border]"
                      } focus:border-[#fc4f02] text-white placeholder:text-slate-500 text-sm transition-colors focus:outline-none focus:ring-0`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
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
              <div className="border-t border-[--color-border] bg-[--color-surface]/80 backdrop-blur-sm p-5 sm:p-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedConnection(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-lg border border-[--color-border] bg-[--color-surface] hover:bg-[--color-surface-alt] disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateConnection}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#FDA300] hover:shadow-lg hover:shadow-[#fc4f02]/50 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all duration-200"
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
