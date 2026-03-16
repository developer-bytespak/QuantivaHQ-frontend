"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTransactionDetail, type TransactionDetail } from "@/lib/api/vc-pools";
import { getApiErrorMessage } from "@/lib/utils/errors";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    verified: "bg-green-500/20 text-green-300 border-green-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize ${
        styles[status] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30"
      }`}
    >
      {status}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-[--color-border] last:border-0">
      <span className="text-sm text-slate-400 sm:w-48 shrink-0">{label}</span>
      <span className="text-sm text-white break-all">{value}</span>
    </div>
  );
}

function formatType(type: string): string {
  const labels: Record<string, string> = {
    payment_submitted: "Payment Submitted",
    payment_verified: "Payment Verified",
    payment_rejected: "Payment Rejected",
  };
  return labels[type] ?? type;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const transactionId = params.transactionId as string;
  const [tx, setTx] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) return;
    setLoading(true);
    getTransactionDetail(transactionId)
      .then(setTx)
      .catch((err: unknown) =>
        setError(getApiErrorMessage(err, "Failed to load transaction details"))
      )
      .finally(() => setLoading(false));
  }, [transactionId]);

  return (
    <div className="min-h-screen bg-[--color-surface] p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard/vc-pool/transactions"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[#fda300] transition-colors group"
        >
          <svg className="w-4 h-4 text-[#fc4f02] group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to transactions</span>
        </Link>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {!loading && tx && (
          <>
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{formatType(tx.transaction_type)}</h1>
                <p className="text-sm text-slate-400">{tx.pool_name}</p>
              </div>
              <StatusBadge status={tx.status} />
            </div>

            {/* Amount Card */}
            <div className="rounded-xl border border-[--color-border] bg-gradient-to-r from-[#fc4f02]/10 to-[#fda300]/10 p-6 mb-6">
              <p className="text-sm text-slate-400 mb-1">Amount</p>
              <p className="text-3xl font-bold text-white font-mono">{tx.amount_usdt} USDT</p>
              {tx.expected_amount && (
                <p className="text-sm text-slate-400 mt-2">
                  Expected: <span className="font-mono text-white">{tx.expected_amount} USDT</span>
                </p>
              )}
              {tx.actual_amount_received && (
                <p className="text-sm text-slate-400 mt-1">
                  Received: <span className="font-mono text-green-400">{tx.actual_amount_received} USDT</span>
                </p>
              )}
            </div>

            {/* Details */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Transaction Details</h2>
              <DetailRow label="Transaction ID" value={<span className="font-mono text-xs">{tx.transaction_id}</span>} />
              <DetailRow label="Pool" value={tx.pool_name} />
              <DetailRow label="Type" value={formatType(tx.transaction_type)} />
              <DetailRow label="Status" value={<StatusBadge status={tx.status} />} />
              <DetailRow label="Description" value={tx.description} />
              {tx.payment_method && <DetailRow label="Payment Method" value={tx.payment_method} />}
              {tx.payment_network && <DetailRow label="Network" value={tx.payment_network} />}
            </div>

            {/* Blockchain Info */}
            {(tx.tx_hash || tx.binance_tx_id) && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Blockchain Info</h2>
                {tx.tx_hash && <DetailRow label="TX Hash" value={<span className="font-mono text-xs">{tx.tx_hash}</span>} />}
                {tx.binance_tx_id && <DetailRow label="Binance TX ID" value={<span className="font-mono text-xs">{tx.binance_tx_id}</span>} />}
                {tx.user_wallet_address && <DetailRow label="User Wallet" value={<span className="font-mono text-xs">{tx.user_wallet_address}</span>} />}
                {tx.admin_wallet_address && <DetailRow label="Admin Wallet" value={<span className="font-mono text-xs">{tx.admin_wallet_address}</span>} />}
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-yellow-400 shrink-0" />
                  <div>
                    <p className="text-sm text-white">Created</p>
                    <p className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {tx.verified_at && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-green-400 shrink-0" />
                    <div>
                      <p className="text-sm text-white">Verified</p>
                      <p className="text-xs text-slate-400">{new Date(tx.verified_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {tx.resolved_at && (
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${tx.status === "rejected" ? "bg-red-400" : "bg-green-400"}`} />
                    <div>
                      <p className="text-sm text-white">Resolved</p>
                      <p className="text-xs text-slate-400">{new Date(tx.resolved_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection reason */}
            {tx.rejection_reason && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
                <h2 className="text-lg font-semibold text-red-300 mb-2">Rejection Reason</h2>
                <p className="text-sm text-red-200">{tx.rejection_reason}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
