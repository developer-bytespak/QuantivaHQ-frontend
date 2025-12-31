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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-2 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <SettingsBackButton />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Exchange Configuration
          </h1>
        </div>

        {/* Description */}
        <p className="text-slate-300 text-sm sm:text-base mb-6 sm:mb-8">
          Manage your exchange account connections. You can update your API credentials or add new exchange accounts.
        </p>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <svg className="w-8 h-8 text-[#fc4f02]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-slate-400 text-sm sm:text-base">
              No exchange connections found. Add one from your profile settings.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {connections.map((connection) => (
              <div
                key={connection.connection_id}
                className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                      {connection.exchange_name || "Unknown Exchange"}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(
                          connection.status
                        )}`}
                      >
                        {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                      </span>
                      {connection.account_type && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-900/30 border border-blue-500/30 text-blue-400">
                          {connection.account_type}
                        </span>
                      )}
                      {connection.verified && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-900/30 border border-green-500/30 text-green-400">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectConnection(connection)}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-[#fc4f02]/20 hover:bg-[#fc4f02]/30 border border-[#fc4f02]/30 text-[#fc4f02] text-xs sm:text-sm font-medium transition-all duration-200"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteConnection(connection.connection_id)}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 text-xs sm:text-sm font-medium transition-all duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Connection Info */}
                <div className="text-xs sm:text-sm text-slate-400 space-y-1">
                  <p>
                    Created:{" "}
                    {new Date(connection.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  {connection.updated_at && (
                    <p>
                      Updated:{" "}
                      {new Date(connection.updated_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Form Modal */}
      {showUpdateForm && selectedConnection && mounted && typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-2 sm:p-4">
            <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-lg sm:rounded-2xl border border-[#fc4f02]/20 shadow-[0_0_50px_rgba(252,79,2,0.15)] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-4 sm:p-6">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedConnection(null);
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
                  Update {selectedConnection.exchange_name} Connection
                </h2>

                {/* Warning */}
                <div className="bg-[#fc4f02]/10 border border-[#fc4f02]/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-[#fc4f02] text-xs sm:text-sm font-semibold">⚠️ Important</p>
                  <p className="text-slate-300 text-xs sm:text-sm mt-1">
                    Your new API credentials will be encrypted and verified before updating.
                  </p>
                </div>

                {/* Form */}
                <div className="space-y-4 sm:space-y-5">
                  {/* API Key */}
                  <div>
                    <label className="block text-white text-xs sm:text-sm font-semibold mb-2">
                      API Key *
                    </label>
                    <input
                      type="text"
                      value={formData.api_key}
                      onChange={(e) => {
                        setFormData({ ...formData, api_key: e.target.value });
                        if (formErrors.api_key) setFormErrors({ ...formErrors, api_key: "" });
                      }}
                      placeholder="Enter your API key"
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/20 backdrop-blur-sm border ${
                        formErrors.api_key ? "border-red-400" : "border-white/30"
                      } text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-xs sm:text-sm`}
                    />
                    {formErrors.api_key && (
                      <p className="text-red-400 text-xs mt-1 font-semibold">{formErrors.api_key}</p>
                    )}
                  </div>

                  {/* API Secret */}
                  <div>
                    <label className="block text-white text-xs sm:text-sm font-semibold mb-2">
                      API Secret *
                    </label>
                    <input
                      type="password"
                      value={formData.api_secret}
                      onChange={(e) => {
                        setFormData({ ...formData, api_secret: e.target.value });
                        if (formErrors.api_secret) setFormErrors({ ...formErrors, api_secret: "" });
                      }}
                      placeholder="Enter your API secret"
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/20 backdrop-blur-sm border ${
                        formErrors.api_secret ? "border-red-400" : "border-white/30"
                      } text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-xs sm:text-sm`}
                    />
                    {formErrors.api_secret && (
                      <p className="text-red-400 text-xs mt-1 font-semibold">{formErrors.api_secret}</p>
                    )}
                  </div>

                  {/* Optional Passphrase */}
                  {selectedConnection.exchange_name?.toLowerCase() === "bybit" && (
                    <div>
                      <label className="block text-white text-xs sm:text-sm font-semibold mb-2">
                        Passphrase (Optional)
                      </label>
                      <input
                        type="password"
                        value={formData.passphrase}
                        onChange={(e) => setFormData({ ...formData, passphrase: e.target.value })}
                        placeholder="Enter passphrase if required"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-xs sm:text-sm"
                      />
                    </div>
                  )}

                  {/* Password Verification */}
                  <div>
                    <label className="block text-white text-xs sm:text-sm font-semibold mb-2">
                      Your Password (for verification) *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          if (formErrors.password) setFormErrors({ ...formErrors, password: "" });
                        }}
                        placeholder="Enter your account password"
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 rounded-lg bg-white/20 backdrop-blur-sm border ${
                          formErrors.password ? "border-red-400" : "border-white/30"
                        } text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-xs sm:text-sm`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
                            />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="text-red-400 text-xs mt-1 font-semibold">{formErrors.password}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <button
                    onClick={() => {
                      setShowUpdateForm(false);
                      setSelectedConnection(null);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateConnection}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#FDA300] hover:shadow-lg hover:shadow-[#fc4f02]/50 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold transition-all duration-200"
                  >
                    {isSubmitting ? "Updating..." : "Update Connection"}
                  </button>
                </div>
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
