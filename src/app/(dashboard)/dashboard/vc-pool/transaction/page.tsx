"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  userBinanceDeposits,
  userBinanceWithdrawals,
  type UserDeposit,
  type UserWithdrawal,
} from "@/lib/api/user-binance";
import { useNotification, Notification } from "@/components/common/notification";

// ─── Shared types ────────────────────────────────────────────────────────────

type TabId = "all" | "deposits" | "withdrawals";

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
  statusText: string;
  network: string;
  transactionFee?: string;
  withdrawOrderId?: string;
  timestamp: number;
}

function fromDeposit(d: UserDeposit): Transaction {
  return {
    id: d.id, type: "deposit", coin: d.coin, amount: d.amount,
    address: d.address, addressTag: d.addressTag ?? undefined,
    txId: d.txId, status: d.status, statusText: d.statusText,
    network: d.network, timestamp: d.insertTime,
  };
}

function fromWithdrawal(w: UserWithdrawal): Transaction {
  return {
    id: w.id, type: "withdrawal", coin: w.coin, amount: w.amount,
    address: w.address, addressTag: w.addressTag ?? undefined,
    txId: w.txId, status: w.status, statusText: w.statusText,
    network: w.network, transactionFee: w.transactionFee,
    withdrawOrderId: w.withdrawOrderId,
    timestamp: w.applyTime ?? w.completeTime ?? 0,
  };
}

// ─── Shared UI helpers ───────────────────────────────────────────────────────

function StatusBadge({ status, text }: { status: number; text?: string }) {
  const map: Record<number, string> = {
    0: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    1: "bg-green-500/20 text-green-300 border-green-500/30",
    2: "bg-red-500/20 text-red-300 border-red-500/30",
    4: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    6: "bg-green-500/20 text-green-300 border-green-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}>
      {text || `Status ${status}`}
    </span>
  );
}

function TypeBadge({ type }: { type: TxType }) {
  return type === "deposit" ? (
    <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400">↓ Deposit</span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-0.5 text-xs font-semibold text-orange-400">↑ Withdrawal</span>
  );
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
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
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

// ─── Modals ──────────────────────────────────────────────────────────────────

function TxModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
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
          <StatusBadge status={tx.status} text={tx.statusText} />
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

function DepositModal({ deposit, onClose }: { deposit: UserDeposit; onClose: () => void }) {
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
        <div className="mb-4"><StatusBadge status={deposit.status} text={deposit.statusText} /></div>
        <DetailRow label="Transaction ID" value={deposit.id} mono />
        <DetailRow label="Coin" value={deposit.coin} />
        <DetailRow label="Amount" value={deposit.amount} mono />
        <DetailRow label="Network" value={deposit.network} />
        <DetailRow label="Wallet Address" value={deposit.address} mono />
        {deposit.addressTag && <DetailRow label="Address Tag / Memo" value={deposit.addressTag} mono />}
        <DetailRow label="TX ID / Hash" value={deposit.txId} mono />
        <DetailRow label="Confirmations" value={deposit.confirmTimes} />
        <DetailRow label="Unlock Confirmations" value={deposit.unlockConfirm} />
        <DetailRow label="Date & Time" value={new Date(deposit.insertTime).toLocaleString()} />
      </div>
    </div>
  );
}

function WithdrawalModal({ withdrawal, onClose }: { withdrawal: UserWithdrawal; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Withdrawal Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click outside or ✕ to close</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-lg">✕</button>
        </div>
        <div className="mb-4"><StatusBadge status={withdrawal.status} text={withdrawal.statusText} /></div>
        <DetailRow label="Transaction ID" value={withdrawal.id} mono />
        {withdrawal.withdrawOrderId && <DetailRow label="Withdraw Order ID" value={withdrawal.withdrawOrderId} mono />}
        <DetailRow label="Coin" value={withdrawal.coin} />
        <DetailRow label="Amount" value={withdrawal.amount} mono />
        <DetailRow label="Transaction Fee" value={withdrawal.transactionFee} mono />
        <DetailRow label="Network" value={withdrawal.network} />
        <DetailRow label="Destination Address" value={withdrawal.address} mono />
        {withdrawal.addressTag && <DetailRow label="Address Tag / Memo" value={withdrawal.addressTag} mono />}
        <DetailRow label="TX ID / Hash" value={withdrawal.txId} mono />
        <DetailRow label="Applied At" value={new Date(withdrawal.applyTime).toLocaleString()} />
        {withdrawal.completeTime != null && <DetailRow label="Completed At" value={new Date(withdrawal.completeTime).toLocaleString()} />}
      </div>
    </div>
  );
}

// ─── Tab views ───────────────────────────────────────────────────────────────

function AllTransactionsTab({
  transactions, loading, error, onRetry, onSelect,
}: {
  transactions: Transaction[]; loading: boolean; error: string | null;
  onRetry: () => void; onSelect: (t: Transaction) => void;
}) {
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal">("all");
  const deps = transactions.filter((t) => t.type === "deposit");
  const wits = transactions.filter((t) => t.type === "withdrawal");
  const visible = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);
  const depAmt = deps.reduce((s, d) => s + parseFloat(d.amount), 0);
  const witAmt = wits.reduce((s, w) => s + parseFloat(w.amount), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total Txns" value={transactions.length} color="text-white" />
        <SummaryCard label="Deposits" value={deps.length} color="text-green-400" />
        <SummaryCard label="Withdrawals" value={wits.length} color="text-[#fc4f02]" />
        <SummaryCard label="Net Flow" value={`$${(depAmt - witAmt).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color="text-[#fda300]" />
      </div>

      {error && !loading && <ErrorBox message={error} onRetry={onRetry} />}
      {loading && <Spinner />}

      {!loading && !error && (
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "deposit", "withdrawal"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors border ${filter === f ? "bg-[#fc4f02]/20 border-[#fc4f02]/50 text-[#fc4f02]" : "border-[--color-border] text-slate-400 hover:text-white hover:bg-white/5"}`}>
              {f === "all" ? `All (${transactions.length})` : f === "deposit" ? `Deposits (${deps.length})` : `Withdrawals (${wits.length})`}
            </button>
          ))}
        </div>
      )}

      {!loading && !error && visible.length === 0 && <EmptyState text="No transactions found." />}

      {!loading && !error && visible.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[--color-border]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[--color-border] bg-[--color-surface-alt]">
                {["Type", "Coin", "Amount", "Network", "Address", "TX ID", "Status", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id} onClick={() => onSelect(t)} className="border-b border-[--color-border] hover:bg-[#fc4f02]/[0.06] cursor-pointer transition-colors">
                  <td className="px-4 py-3"><TypeBadge type={t.type} /></td>
                  <td className="px-4 py-3 font-semibold text-white">{t.coin}</td>
                  <td className="px-4 py-3 font-mono text-white">{parseFloat(t.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                  <td className="px-4 py-3 text-slate-300">{t.network}</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{t.address.slice(0, 12)}…</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{t.txId ? `${t.txId.slice(0, 18)}…` : "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} text={t.statusText} /></td>
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

function DepositsTab({
  deposits, loading, error, onRetry, onSelect,
}: {
  deposits: UserDeposit[]; loading: boolean; error: string | null;
  onRetry: () => void; onSelect: (d: UserDeposit) => void;
}) {
  const total = deposits.reduce((s, d) => s + parseFloat(d.amount), 0);
  const pending = deposits.filter((d) => d.status === 0).length;
  const success = deposits.filter((d) => d.status === 1).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total Deposits" value={deposits.length} color="text-white" />
        <SummaryCard label="Total Amount" value={`$${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color="text-green-400" />
        <SummaryCard label="Pending" value={pending} color="text-yellow-400" />
        <SummaryCard label="Successful" value={success} color="text-[#fc4f02]" />
      </div>

      {error && !loading && <ErrorBox message={error} onRetry={onRetry} />}
      {loading && <Spinner />}
      {!loading && !error && deposits.length === 0 && <EmptyState text="No deposits found." />}

      {!loading && !error && deposits.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[--color-border]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[--color-border] bg-[--color-surface-alt]">
                {["Coin", "Amount", "Network", "Address", "TX ID", "Confirms", "Status", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} onClick={() => onSelect(d)} className="border-b border-[--color-border] hover:bg-[#fc4f02]/[0.06] cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{d.coin}</td>
                  <td className="px-4 py-3 font-mono text-white">{parseFloat(d.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                  <td className="px-4 py-3 text-slate-300">{d.network}</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{d.address.slice(0, 12)}…</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{d.txId ? `${d.txId.slice(0, 18)}…` : "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{d.confirmTimes}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} text={d.statusText} /></td>
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

function WithdrawalsTab({
  withdrawals, loading, error, onRetry, onSelect,
}: {
  withdrawals: UserWithdrawal[]; loading: boolean; error: string | null;
  onRetry: () => void; onSelect: (w: UserWithdrawal) => void;
}) {
  const total = withdrawals.reduce((s, w) => s + parseFloat(w.amount), 0);
  const processing = withdrawals.filter((w) => w.status === 4 || w.status === 2).length;
  const completed = withdrawals.filter((w) => w.status === 6).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total Withdrawals" value={withdrawals.length} color="text-white" />
        <SummaryCard label="Total Amount" value={`$${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color="text-[#fc4f02]" />
        <SummaryCard label="Processing" value={processing} color="text-blue-400" />
        <SummaryCard label="Completed" value={completed} color="text-green-400" />
      </div>

      {error && !loading && <ErrorBox message={error} onRetry={onRetry} />}
      {loading && <Spinner />}
      {!loading && !error && withdrawals.length === 0 && <EmptyState text="No withdrawals found." />}

      {!loading && !error && withdrawals.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[--color-border]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[--color-border] bg-[--color-surface-alt]">
                {["Coin", "Amount", "Fee", "Network", "Address", "TX ID", "Status", "Applied At"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} onClick={() => onSelect(w)} className="border-b border-[--color-border] hover:bg-[#fc4f02]/[0.06] cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{w.coin}</td>
                  <td className="px-4 py-3 font-mono text-white">{parseFloat(w.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{w.transactionFee}</td>
                  <td className="px-4 py-3 text-slate-300">{w.network}</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{w.address.slice(0, 12)}…</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{w.txId ? `${w.txId.slice(0, 18)}…` : "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={w.status} text={w.statusText} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(w.applyTime).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Micro helpers ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-8 text-center text-slate-400">{text}</div>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
      <p className="font-semibold mb-1">Error</p>
      <p className="text-sm">{message}</p>
      <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-medium hover:bg-red-500/30 transition-colors">Retry</button>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All Transactions" },
  { id: "deposits", label: "Deposits" },
  { id: "withdrawals", label: "Withdrawals" },
];

export default function VCPoolTransactionPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<TabId>("all");

  // data
  const [deposits, setDeposits] = useState<UserDeposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<UserWithdrawal[]>([]);
  const [allTxns, setAllTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modals
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<UserDeposit | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<UserWithdrawal | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([userBinanceDeposits({ limit: 100 }), userBinanceWithdrawals({ limit: 100 })])
      .then(([dRes, wRes]) => {
        const deps = dRes?.data || [];
        const wits = wRes?.data || [];
        setDeposits(deps);
        setWithdrawals(wits);
        setAllTxns([...deps.map(fromDeposit), ...wits.map(fromWithdrawal)].sort((a, b) => b.timestamp - a.timestamp));
      })
      .catch((err: unknown) => {
        const e = err as { response?: { status?: number }; message?: string };
        const msg = e?.response?.status === 401 ? "Unauthorized — please log in again." : e?.message || "Failed to load data";
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
      {selectedTx && <TxModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}
      {selectedDeposit && <DepositModal deposit={selectedDeposit} onClose={() => setSelectedDeposit(null)} />}
      {selectedWithdrawal && <WithdrawalModal withdrawal={selectedWithdrawal} onClose={() => setSelectedWithdrawal(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-[--color-border] text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#fc4f02] to-[#fda300] bg-clip-text text-transparent">
              My Transactions
            </h1>
            <p className="text-sm text-slate-400 mt-1">Your Binance deposits and withdrawals</p>
          </div>
        </div>
        <button type="button" onClick={fetchData} disabled={loading}
          className="rounded-xl border border-[--color-border] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-60 transition-colors">
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-[--color-border]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-[#fc4f02] bg-[#fc4f02]/20 border-b-2 border-[#fc4f02]"
                : "text-white/80 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="text-sm text-slate-400 -mt-2">Click any row to view full details</div>

      {activeTab === "all" && (
        <AllTransactionsTab
          transactions={allTxns}
          loading={loading}
          error={error}
          onRetry={() => { setError(null); fetchData(); }}
          onSelect={setSelectedTx}
        />
      )}
      {activeTab === "deposits" && (
        <DepositsTab
          deposits={deposits}
          loading={loading}
          error={error}
          onRetry={() => { setError(null); fetchData(); }}
          onSelect={setSelectedDeposit}
        />
      )}
      {activeTab === "withdrawals" && (
        <WithdrawalsTab
          withdrawals={withdrawals}
          loading={loading}
          error={error}
          onRetry={() => { setError(null); fetchData(); }}
          onSelect={setSelectedWithdrawal}
        />
      )}
    </div>
  );
}
