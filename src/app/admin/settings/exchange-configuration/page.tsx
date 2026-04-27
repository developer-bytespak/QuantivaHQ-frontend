"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { SettingsBackButton } from "@/components/settings/settings-back-button";
import { useNotification, Notification } from "@/components/common/notification";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { adminExchangesService } from "@/lib/api/admin-exchanges.service";
import { adminGetSettings, adminUpdateBinance } from "@/lib/api/vcpool-admin";
import type { Connection } from "@/lib/api/exchanges.service";

type ExchangeConnection = Connection;
type AccountType = "crypto" | "stocks" | "both";

function getEffectiveAccountType(
  connections: ExchangeConnection[]
): AccountType {
  const hasCrypto = connections.some((c) => c.exchange?.type === "crypto");
  const hasStocks = connections.some((c) => c.exchange?.type === "stocks");
  if (hasCrypto && hasStocks) return "both";
  if (hasCrypto) return "crypto";
  if (hasStocks) return "stocks";
  return "crypto";
}

export default function AdminExchangeConfigurationPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [paymentNetwork, setPaymentNetwork] = useState<"TRC20" | "ERC20" | "BEP20">(
    "TRC20",
  );
  const [selectedConnection, setSelectedConnection] =
    useState<ExchangeConnection | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    api_key: "",
    api_secret: "",
    passphrase: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    connectionId: string | null;
  }>({ isOpen: false, connectionId: null });

  const effectiveAccountType = useMemo(
    () => getEffectiveAccountType(connections),
    [connections]
  );
  const cryptoConnections = useMemo(
    () => connections.filter((c) => c.exchange?.type === "crypto"),
    [connections]
  );
  const stockConnections = useMemo(
    () => connections.filter((c) => c.exchange?.type === "stocks"),
    [connections]
  );
  const showCrypto =
    effectiveAccountType === "crypto" || effectiveAccountType === "both";
  const showStocks =
    effectiveAccountType === "stocks" || effectiveAccountType === "both";

  const refetch = () => {
    setLoading(true);
    adminExchangesService
      .getConnections()
      .then((list) => {
        setConnections(
          list.map((c) => ({
            ...c,
            exchange_name:
              c.exchange_name ?? (c.exchange as { name?: string })?.name ?? "",
          }))
        );
      })
      .catch(() => setConnections([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    refetch();
    adminGetSettings()
      .then((data) => {
        setWalletAddress(data.wallet_address ?? data.binance_uid ?? "");
        const stored = (data.payment_network ?? "TRC20").toUpperCase();
        setPaymentNetwork(
          stored === "ERC20" || stored === "BEP20" ? stored : "TRC20",
        );
      })
      .catch(() => {});
  }, []);

  const handleSelectConnection = (conn: ExchangeConnection) => {
    setSelectedConnection(conn);
    setShowUpdateForm(true);
    setFormData({ api_key: "", api_secret: "", passphrase: "" });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.api_key.trim()) errors.api_key = "API Key is required";
    else if (formData.api_key.length < 10)
      errors.api_key = "API Key must be at least 10 characters";
    if (!formData.api_secret.trim())
      errors.api_secret = "API Secret is required";
    else if (formData.api_secret.length < 10)
      errors.api_secret = "API Secret must be at least 10 characters";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateConnection = async () => {
    if (!validateForm() || !selectedConnection) return;
    try {
      setIsSubmitting(true);
      await adminExchangesService.updateConnection(
        selectedConnection.connection_id,
        {
          api_key: formData.api_key,
          api_secret: formData.api_secret,
          ...(formData.passphrase && { passphrase: formData.passphrase }),
        }
      );
      showNotification("Exchange connection updated successfully", "success");
      setShowUpdateForm(false);
      setSelectedConnection(null);
      refetch();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string }; status?: number }; message?: string })
          ?.response?.data?.message ??
        (err as { message?: string })?.message ??
        "Failed to update";
      showNotification(msg, "error");
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
      await adminExchangesService.deleteConnection(deleteConfirmation.connectionId);
      showNotification("Exchange connection deleted successfully", "success");
      setDeleteConfirmation({ isOpen: false, connectionId: null });
      setSelectedConnection(null);
      setShowUpdateForm(false);
      refetch();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        "Failed to delete exchange connection";
      showNotification(msg, "error");
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

  const goToConnectCrypto = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("quantivahq_admin_selected_exchange", "binance");
    }
    router.push("/admin/settings/connect-crypto");
  };

  const goToCryptoSwitchExchange = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("quantivahq_admin_selected_exchange", "binance");
    }
    router.push("/admin/settings/connect-crypto");
  };

  const goToConnectStock = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("quantivahq_admin_selected_exchange", "alpaca");
    }
    router.push("/admin/settings/connect-stock");
  };

  const goToAddStockBroker = () => {
    router.push("/admin/settings/connect-stock");
  };

  const goToAddCryptoExchange = () => {
    router.push("/admin/settings/connect-crypto");
  };

  const handleSubmitWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminUpdateBinance({
        wallet_address: walletAddress.trim(),
        payment_network: paymentNetwork.trim(),
      });
      showNotification("Deposit wallet updated successfully", "success");
    } catch (err: unknown) {
      showNotification(
        (err as { message?: string })?.message ?? "Failed to update",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const renderConnectionList = (
    list: ExchangeConnection[],
    emptyLabel: string
  ) => {
    if (loading) {
      return (
        <div className="text-center py-8 sm:py-10 bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl mt-4">
          <div className="animate-spin w-7 h-7 mx-auto mb-3 border-2 border-[#fc4f02] border-t-transparent rounded-full" />
          <p className="text-slate-400 text-sm sm:text-base">
            Loading connections...
          </p>
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div className="text-center py-8 sm:py-10 bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl mt-4">
          <svg
            className="w-10 sm:w-12 h-10 sm:h-12 text-slate-500 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <p className="text-slate-400 text-sm sm:text-base">{emptyLabel}</p>
        </div>
      );
    }
    return (
      <div className="space-y-3 mt-4">
        {list.map((connection) => (
          <div
            key={connection.connection_id}
            onClick={() => {
              setSelectedConnection(connection);
              setShowUpdateForm(false);
            }}
            className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-5 hover:border-[#fc4f02]/30 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                    {connection.exchange_name ??
                      (connection.exchange as { name?: string })?.name ??
                      "Exchange"}
                  </h3>
                  {connection.verified && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#fc4f02]/20 text-[#fc4f02] border border-[#fc4f02]/30 flex-shrink-0">
                      Verified
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 border ${getStatusColor(connection.status)}`}
                  >
                    {connection.status.charAt(0).toUpperCase() +
                      connection.status.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Connected{" "}
                  {new Date(connection.created_at).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
              <svg
                className="w-4 sm:w-5 h-4 sm:h-5 text-slate-400 mt-1 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const activeCrypto =
    cryptoConnections.find((c) => c.status === "active") ??
    cryptoConnections[0] ??
    null;
  const activeCryptoName = activeCrypto
    ? (
        (activeCrypto.exchange as { name?: string })?.name ??
        activeCrypto.exchange_name ??
        ""
      ).toLowerCase()
    : null;
  const cryptoIsBinance = activeCryptoName?.includes("binance") ?? true;

  const renderCryptoSection = () => (
    <div className="bg-gradient-to-br from-[#fc4f02]/10 to-[#fc4f02]/5 border border-[#fc4f02]/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-1 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-[#fc4f02]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Crypto Exchange
      </h2>
      <p className="text-sm text-slate-400 mb-5">
        {activeCrypto
          ? `Connected to ${(activeCrypto.exchange as { name?: string })?.name ?? activeCrypto.exchange_name}`
          : "Connect a crypto exchange to start trading"}
      </p>

      {activeCrypto ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                cryptoIsBinance ? "bg-[#f7931a] text-white" : "bg-[#f0b90b] text-white"
              }`}
            >
              <span className="text-lg font-bold">
                {cryptoIsBinance ? "B" : "฿"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-white">
                {(activeCrypto.exchange as { name?: string })?.name ??
                  activeCrypto.exchange_name}
              </p>
              <p className="text-xs text-slate-400">
                Connected{" "}
                {new Date(activeCrypto.created_at).toLocaleDateString(
                  undefined,
                  { year: "numeric", month: "short", day: "numeric" }
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleSelectConnection(activeCrypto)}
              className="px-4 py-2 rounded-lg border border-[#fc4f02]/40 text-[#fc4f02] text-sm font-semibold hover:bg-[#fc4f02]/10 transition-all duration-200"
            >
              Switch Credentials
            </button>
            <button
              onClick={goToCryptoSwitchExchange}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all duration-300"
            >
              Switch Exchange
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-5">
          <p className="text-sm text-slate-400">No crypto exchange connected yet</p>
          <button
            onClick={goToConnectCrypto}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all duration-300"
          >
            Connect
          </button>
        </div>
      )}

      {renderConnectionList(cryptoConnections, "No crypto connections yet")}
    </div>
  );

  const activeStock =
    stockConnections.find((c) => c.status === "active") ??
    stockConnections[0] ??
    null;

  const renderStocksSection = () => (
    <div className="bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5 border border-[#10b981]/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-1 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-[#10b981]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        Stock Broker
      </h2>
      <p className="text-sm text-slate-400 mb-5">
        {activeStock
          ? `Connected to ${(activeStock.exchange as { name?: string })?.name ?? activeStock.exchange_name}`
          : "Connect a stock broker to start trading"}
      </p>

      {activeStock ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#fcda03] text-slate-900">
              <span className="text-lg font-bold">A</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-white">
                {(activeStock.exchange as { name?: string })?.name ??
                  activeStock.exchange_name}
              </p>
              <p className="text-xs text-slate-400">
                Connected{" "}
                {new Date(activeStock.created_at).toLocaleDateString(
                  undefined,
                  { year: "numeric", month: "short", day: "numeric" }
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleSelectConnection(activeStock)}
              className="px-4 py-2 rounded-lg border border-[#10b981]/40 text-[#10b981] text-sm font-semibold hover:bg-[#10b981]/10 transition-all duration-200"
            >
              Switch Credentials
            </button>
            <button
              disabled
              title="Only one stock broker available"
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-500 text-sm font-semibold cursor-not-allowed opacity-50"
            >
              Switch Exchange
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-5">
          <p className="text-sm text-slate-400">No stock broker connected yet</p>
          <button
            onClick={goToConnectStock}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#10b981] to-[#34d399] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#10b981]/30 transition-all duration-300"
          >
            Connect
          </button>
        </div>
      )}

      {renderConnectionList(stockConnections, "No stock connections yet")}
    </div>
  );

  const renderAddStockCTA = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#10b981]/10 to-transparent border border-dashed border-[#10b981]/30 rounded-xl sm:rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#10b981]/15 border border-[#10b981]/20 flex items-center justify-center flex-shrink-0">
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-[#10b981]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
          Add Stock Broker
        </h3>
        <p className="text-sm text-slate-400">
          Trade both crypto and stocks in one platform. Add a stock broker to
          upgrade to <span className="text-[#10b981] font-medium">Both</span>{" "}
          account type.
        </p>
      </div>
      <button
        onClick={goToAddStockBroker}
        className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#10b981] to-[#34d399] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#10b981]/30 transition-all duration-300 flex-shrink-0"
      >
        Add Stock Broker
      </button>
    </div>
  );

  const renderAddCryptoCTA = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#fc4f02]/10 to-transparent border border-dashed border-[#fc4f02]/30 rounded-xl sm:rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#fc4f02]/15 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-[#fc4f02]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
          Add Crypto Exchange
        </h3>
        <p className="text-sm text-slate-400">
          Trade both crypto and stocks in one platform. Add a crypto exchange to
          upgrade to <span className="text-[#fc4f02] font-medium">Both</span>{" "}
          account type.
        </p>
      </div>
      <button
        onClick={goToAddCryptoExchange}
        className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all duration-300 flex-shrink-0"
      >
        Add Crypto Exchange
      </button>
    </div>
  );

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
        onCancel={() =>
          setDeleteConfirmation({ isOpen: false, connectionId: null })
        }
        type="danger"
      />
      <SettingsBackButton backHref="/admin/settings" />

      {/* Connection details overlay */}
      {selectedConnection &&
        !showUpdateForm &&
        mounted &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedConnection(null)}
          >
            <div
              className="relative mx-auto w-full max-w-2xl rounded-lg sm:rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 shadow-2xl shadow-black/50 backdrop-blur animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-[--color-border]/30 bg-gradient-to-br from-[--color-surface-alt] to-[--color-surface-alt]/90 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-2xl font-bold text-white truncate">
                      {selectedConnection.exchange_name ??
                        (selectedConnection.exchange as { name?: string })?.name ??
                        "Exchange"}
                    </h2>
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
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                  <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                      Status
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-white capitalize">
                      {selectedConnection.status}
                    </p>
                  </div>
                  <div className="bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                      Connected
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-white">
                      {new Date(
                        selectedConnection.created_at
                      ).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="pt-4 sm:pt-6 border-t border-[--color-border]/50 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => handleSelectConnection(selectedConnection)}
                    className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg bg-[--color-surface] border border-[--color-border] text-white text-sm sm:text-base hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt] transition-all duration-200 font-medium"
                  >
                    Update Credentials
                  </button>
                  <button
                    onClick={() => {
                      setShowUpdateForm(false);
                      handleDeleteConnection(selectedConnection.connection_id);
                    }}
                    className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm sm:text-base hover:bg-red-500/30 transition-all duration-200 font-medium"
                  >
                    Delete Connection
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg space-y-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">
              Exchange Connections
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {effectiveAccountType === "both"
                ? "Manage your crypto and stock broker connections (admin)"
                : effectiveAccountType === "crypto"
                  ? "Manage your crypto exchange connection (admin)"
                  : "Manage your stock broker connection (admin)"}
            </p>
          </div>
        </div>

        {showCrypto && renderCryptoSection()}
        {showStocks && renderStocksSection()}

        {effectiveAccountType === "crypto" && renderAddStockCTA()}
        {effectiveAccountType === "stocks" && renderAddCryptoCTA()}

        {/* Deposit Wallet (VC Pool) - admin only */}
        <div className="bg-gradient-to-br from-[#fc4f02]/10 to-[#fc4f02]/5 border border-[#fc4f02]/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-1 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#fc4f02]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Deposit Wallet (VC Pool)
          </h2>
          <p className="text-sm text-slate-400 mb-5">
            This wallet receives on-chain USDT from pool participants. Pick a
            network supported on both Binance and Binance.US (TRC20 or ERC20
            recommended).
          </p>

          <form onSubmit={handleSubmitWallet} className="space-y-4">
            <div>
              <label
                htmlFor="wallet-address"
                className="mb-1 block text-sm font-semibold text-slate-300"
              >
                Wallet Address
              </label>
              <input
                id="wallet-address"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-4 py-2.5 text-white font-mono placeholder:text-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02] disabled:opacity-60"
                disabled={saving}
              />
            </div>
            <div>
              <label
                htmlFor="payment-network"
                className="mb-1 block text-sm font-semibold text-slate-300"
              >
                Network
              </label>
              <select
                id="payment-network"
                value={paymentNetwork}
                onChange={(e) =>
                  setPaymentNetwork(
                    e.target.value as "TRC20" | "ERC20" | "BEP20",
                  )
                }
                className="w-full rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02] disabled:opacity-60"
                disabled={saving}
              >
                <option value="TRC20">TRC20 (Tron)</option>
                <option value="ERC20">ERC20 (Ethereum)</option>
                <option value="BEP20">BEP20 (BSC)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={saving || !walletAddress.trim()}
              className="rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-5 py-2.5 font-semibold text-white hover:shadow-lg hover:shadow-[#fc4f02]/30 disabled:opacity-60 transition-all"
            >
              {saving ? "Saving…" : "Save deposit wallet"}
            </button>
          </form>
        </div>
      </div>

      {/* Update credentials modal */}
      {showUpdateForm &&
        selectedConnection &&
        mounted &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-lg sm:rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="border-b border-[--color-border] bg-[--color-surface]/80 backdrop-blur-sm p-4 sm:p-6 flex items-start justify-between flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-white">
                    Update Credentials
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 truncate">
                    {selectedConnection.exchange_name ??
                      (selectedConnection.exchange as { name?: string })?.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedConnection(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
                <div className="bg-[#fc4f02]/10 border border-[#fc4f02]/30 rounded-lg p-3 sm:p-4">
                  <p className="text-[#fc4f02] text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <span>⚠️</span> Security Notice
                  </p>
                  <p className="text-slate-300 text-xs sm:text-sm mt-2">
                    Credentials are encrypted and stored securely.
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => {
                      setFormData({ ...formData, api_key: e.target.value });
                      if (formErrors.api_key)
                        setFormErrors({ ...formErrors, api_key: "" });
                    }}
                    placeholder="Enter new API key"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[--color-surface-alt] border ${
                      formErrors.api_key ? "border-red-500/50" : "border-[--color-border]"
                    } focus:border-[#fc4f02] text-white placeholder:text-slate-500 text-sm transition-colors focus:outline-none focus:ring-0`}
                  />
                  {formErrors.api_key && (
                    <p className="text-red-400 text-xs mt-1.5 font-medium">
                      {formErrors.api_key}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={formData.api_secret}
                    onChange={(e) => {
                      setFormData({ ...formData, api_secret: e.target.value });
                      if (formErrors.api_secret)
                        setFormErrors({ ...formErrors, api_secret: "" });
                    }}
                    placeholder="Enter new API secret"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[--color-surface-alt] border ${
                      formErrors.api_secret ? "border-red-500/50" : "border-[--color-border]"
                    } focus:border-[#fc4f02] text-white placeholder:text-slate-500 text-sm transition-colors focus:outline-none focus:ring-0`}
                  />
                  {formErrors.api_secret && (
                    <p className="text-red-400 text-xs mt-1.5 font-medium">
                      {formErrors.api_secret}
                    </p>
                  )}
                </div>

                {(selectedConnection.exchange_name ?? (selectedConnection.exchange as { name?: string })?.name)
                  ?.toLowerCase() === "bybit" && (
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                      Passphrase (Optional)
                    </label>
                    <input
                      type="password"
                      value={formData.passphrase}
                      onChange={(e) =>
                        setFormData({ ...formData, passphrase: e.target.value })
                      }
                      placeholder="Bybit passphrase if required"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[--color-surface-alt] border border-[--color-border] focus:border-[#fc4f02] text-white placeholder:text-slate-500 text-sm transition-colors focus:outline-none focus:ring-0"
                    />
                  </div>
                )}
              </div>

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
    </div>
  );
}
