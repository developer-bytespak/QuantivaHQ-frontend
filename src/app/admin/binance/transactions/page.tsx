"use client";

import { useEffect, useState } from "react";
import { adminBinanceDeposits, adminBinanceWithdrawals, type BinanceDeposit, type BinanceWithdrawal } from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

type TxType = "deposit" | "withdrawal";
interface Transaction {
  id: string;
  type: TxType;
  coin: string;
  amount: string;
  address: string;
  addressTag?: string;
  txId: string;
  status: number;
  statusText?: string;
  network: string;
  transactionFee?: string;
  withdrawOrderId?: string;
  timestamp: number;
}

function fromDeposit(d: BinanceDeposit): Transaction {
  return { id: d.id, type: "deposit", coin: d.coin, amount: d.amount, address: d.address, addressTag: d.addressTag ?? undefined, txId: d.txId, status: d.status, network: d.network, timestamp: d.insertTime };
}
function fromWithdrawal(w: BinanceWithdrawal): Transaction {
  const ts = w.insertTime ?? (typeof w.completeTime === "number" ? w.completeTime : 0);
  return { id: w.id, type: "withdrawal", coin: w.coin, amount: w.amount, address: w.address, addressTag: w.addressTag ?? undefined, txId: w.txId, status: w.status, network: w.network, transactionFee: w.transactionFee, withdrawOrderId: w.withdrawOrderId, timestamp: ts };
}

function StatusBadge({ status }: { status: number }) {
  const map: Record<number, [string, string]> = {
    0: ["Pending", "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"],
    1: ["Success", "bg-green-500/20 text-green-300 border-green-500/30"],
    2: ["Failed", "bg-red-500/20 text-red-300 border-red-500/30"],
    6: ["Completed", "bg-green-500/20 text-green-300 border-green-500/30"],
  };
  const [label, cls] = map[status] ?? [`Status ${status}`, "bg-slate-500/20 text-slate-300 border-slate-500/30"];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function TypeBadge({ type }: { type: TxType }) {
  return type === "deposit"
    ? <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400">↓ Deposit</span>
    : <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-0.5 text-xs font-semibold text-orange-400">↑ Withdrawal</span>;
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
  const copy = () => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); };
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

function TransactionModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Transaction Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click outside or ✕ to close</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-lg">✕</button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <TypeBadge type={tx.type} />
          <StatusBadge status={tx.status} />
        </div>
        <DetailRow label="Transaction ID" value={tx.id} mono />
        {tx.withdrawOrderId && <DetailRow label="Withdraw Order ID" value={tx.withdrawOrderId} mono />}
        <DetailRow label="Coin" value={tx.coin} />
        <DetailRow label="Amount" value={tx.amount} mono />
        {tx.transactionFee && <DetailRow label="Transaction Fee" value={tx.transactionFee} mono />}
        <DetailRow label="Network" value={tx.network} />
        <DetailRow label="Wallet Address" value={tx.address} mono />
        {tx.addressTag && <DetailRow label="Address Tag / Memo" value={tx.addressTag} mono />}
        <DetailRow label="TX ID / Hash" value={tx.txId} mono />
        <DetailRow label="Date & Time" value={tx.timestamp ? new Date(tx.timestamp).toLocaleString() : "—"} />
      </div>
    </div>
  );
}

export default function AdminTransactionsPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal">("all");
  const [stats, setStats] = useState({ total: 0, deposits: 0, withdrawals: 0, depositAmt: 0, withdrawalAmt: 0 });

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([adminBinanceDeposits({ limit: 100 }), adminBinanceWithdrawals({ limit: 100 })])
      .then(([dRes, wRes]) => {
        const deps = (dRes?.data || []).map(fromDeposit);
        const wits = (wRes?.data || []).map(fromWithdrawal);
        const all = [...deps, ...wits].sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(all);
        setStats({
          total: all.length,
          deposits: deps.length,
          withdrawals: wits.length,
          depositAmt: deps.reduce((s, d) => s + parseFloat(d.amount), 0),
          withdrawalAmt: wits.reduce((s, w) => s + parseFloat(w.amount), 0),
        });
      })
      .catch((err: unknown) => {
        const e = err as { response?: { status?: number }; message?: string };
        let msg = "Failed to load transactions";
        if (e?.response?.status === 401) msg = "Unauthorized (401).";
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

  const visible = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  return (
    <div className="space-y-6">
      {notification && <Notification message={notification.message} type={notification.type} onClose={hideNotification} />}
      {selected && <TransactionModal tx={selected} onClose={() => setSelected(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#fc4f02] to-[#fda300] bg-clip-text text-transparent mb-1">All Transactions</h1>
          <p className="text-sm text-slate-300">Click any row to view full transaction details</p>
        </div>
        <button type="button" onClick={fetchData} disabled={loading}
          className="shrink-0 rounded-xl border border-[--color-border] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-60 transition-colors">
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total Txns" value={stats.total} color="text-white" />
        <SummaryCard label="Deposits" value={stats.deposits} color="text-green-400" />
        <SummaryCard label="Withdrawals" value={stats.withdrawals} color="text-[#fc4f02]" />
        <SummaryCard label="Net Flow" value={`$${(stats.depositAmt - stats.withdrawalAmt).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color="text-[#fda300]" />
      </div>

      {error && !loading && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          <p className="font-semibold mb-1">Error Loading Transactions</p>
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

      {!loading && !error && (
        <div className="flex items-center gap-2">
          {(["all", "deposit", "withdrawal"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors border ${filter === f ? "bg-[#fc4f02]/20 border-[#fc4f02]/50 text-[#fc4f02]" : "border-[--color-border] text-slate-400 hover:text-white hover:bg-white/5"}`}>
              {f === "all" ? `All (${transactions.length})` : f === "deposit" ? `Deposits (${stats.deposits})` : `Withdrawals (${stats.withdrawals})`}
            </button>
          ))}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-8 text-center text-slate-400">No transactions found.</div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[--color-border]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[--color-border] bg-[--color-surface-alt]">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Type</th>
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
              {visible.map((t) => (
                <tr key={`${t.type}-${t.id}`} onClick={() => setSelected(t)}
                  className="border-b border-[--color-border] hover:bg-[#fc4f02]/[0.06] cursor-pointer transition-colors">
                  <td className="px-4 py-3"><TypeBadge type={t.type} /></td>
                  <td className="px-4 py-3 font-semibold text-white">{t.coin}</td>
                  <td className="px-4 py-3 font-mono text-white">{parseFloat(t.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                  <td className="px-4 py-3 text-slate-300">{t.network}</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{t.address.slice(0, 12)}…</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{t.txId ? `${t.txId.slice(0, 18)}…` : "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{t.timestamp ? new Date(t.timestamp).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}