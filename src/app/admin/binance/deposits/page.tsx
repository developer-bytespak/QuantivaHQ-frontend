"use client";

import { useEffect, useState } from "react";
import { adminBinanceDeposits, type BinanceDeposit } from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

function StatusBadge({ status }: { status: number }) {
  const map: Record<number, [string, string]> = {
    0: ["Pending", "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"],
    1: ["Success", "bg-green-500/20 text-green-300 border-green-500/30"],
    2: ["Failed", "bg-red-500/20 text-red-300 border-red-500/30"],
  };
  const [label, cls] = map[status] ?? [`Status ${status}`, "bg-slate-500/20 text-slate-300 border-slate-500/30"];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function SummaryCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-gradient-to-br from-white/[0.05] to-transparent p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value?: string | number | null; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const text = value != null ? String(value) : "—";
  const canCopy = value != null && String(value).length > 4;
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-[--color-border] last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
      <div className="flex items-start justify-between gap-3 mt-0.5">
        <span className={`text-sm text-white break-all leading-relaxed ${mono ? "font-mono text-xs" : ""}`}>{text}</span>
        {canCopy && (
          <button onClick={copy} className="shrink-0 text-xs px-2 py-0.5 rounded border border-[--color-border] text-slate-400 hover:text-[#fc4f02] hover:border-[#fc4f02]/40 transition-colors">
            {copied ? "✓" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

function DepositModal({ deposit, onClose }: { deposit: BinanceDeposit; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Deposit Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click outside or ✕ to close</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-lg">✕</button>
        </div>
        <div className="mb-4"><StatusBadge status={deposit.status} /></div>
        <DetailRow label="Transaction ID" value={deposit.id} mono />
        <DetailRow label="Coin" value={deposit.coin} />
        <DetailRow label="Amount" value={deposit.amount} mono />
        <DetailRow label="Network" value={deposit.network} />
        <DetailRow label="Wallet Address" value={deposit.address} mono />
        {deposit.addressTag && <DetailRow label="Address Tag / Memo" value={deposit.addressTag} mono />}
        <DetailRow label="TX ID / Hash" value={deposit.txId} mono />
        <DetailRow label="Confirm Times" value={deposit.confirmTimes} />
        <DetailRow label="Unlock Confirmations" value={deposit.unlockConfirm} />
        <DetailRow label="Date & Time" value={new Date(deposit.insertTime).toLocaleString()} />
      </div>
    </div>
  );
}

export default function AdminDepositsPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [deposits, setDeposits] = useState<BinanceDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BinanceDeposit | null>(null);
  const [stats, setStats] = useState({ total: 0, amount: 0, pending: 0, success: 0 });

  const fetchData = () => {
    setLoading(true);
    setError(null);
    adminBinanceDeposits({ limit: 100 })
      .then((res) => {
        const data = res?.data || [];
        setDeposits(data);
        setStats({
          total: res?.count || 0,
          amount: data.reduce((s, d) => s + parseFloat(d.amount), 0),
          pending: data.filter((d) => d.status === 0).length,
          success: data.filter((d) => d.status === 1).length,
        });
      })
      .catch((err: unknown) => {
        const e = err as { response?: { status?: number }; message?: string };
        let msg = "Failed to load deposits";
        if (e?.response?.status === 404) msg = "API endpoint not found (404).";
        else if (e?.response?.status === 401) msg = "Unauthorized (401).";
        else if (e?.message) msg = e.message;
        setError(msg);
        showNotification(msg, "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {notification && <Notification message={notification.message} type={notification.type} onClose={hideNotification} />}
      {selected && <DepositModal deposit={selected} onClose={() => setSelected(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#fc4f02] to-[#fda300] bg-clip-text text-transparent mb-1">Binance Deposits</h1>
          <p className="text-sm text-slate-300">Click any row to view full transaction details</p>
        </div>
        <button type="button" onClick={fetchData} disabled={loading}
          className="shrink-0 rounded-xl border border-[--color-border] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-60 transition-colors">
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total Deposits" value={stats.total} color="text-white" />
        <SummaryCard label="Total Amount" value={`$${stats.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color="text-[#fc4f02]" />
        <SummaryCard label="Pending" value={stats.pending} color="text-yellow-400" />
        <SummaryCard label="Success" value={stats.success} color="text-green-400" />
      </div>

      {error && !loading && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          <p className="font-semibold mb-1">Error Loading Deposits</p>
          <p className="text-sm">{error}</p>
          <button type="button" onClick={() => { setError(null); fetchData(); }}
            className="mt-3 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-medium hover:bg-red-500/30 transition-colors">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
        </div>
      )}

      {!loading && !error && deposits.length === 0 && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-8 text-center text-slate-400">No deposits found.</div>
      )}

      {!loading && !error && deposits.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[--color-border]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[--color-border] bg-[--color-surface-alt]">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Coin</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Network</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Address</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">TX ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} onClick={() => setSelected(d)}
                  className="border-b border-[--color-border] hover:bg-[#fc4f02]/[0.06] cursor-pointer transition-colors group">
                  <td className="px-4 py-3 font-semibold text-white">{d.coin}</td>
                  <td className="px-4 py-3 font-mono text-white">{parseFloat(d.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                  <td className="px-4 py-3 text-slate-300">{d.network}</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs max-w-[100px] truncate">{d.address.slice(0, 12)}…</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs max-w-[140px] truncate">{d.txId.slice(0, 18)}…</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(d.insertTime).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}