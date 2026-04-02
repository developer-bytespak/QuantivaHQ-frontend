'use client';

import Image from 'next/image';
import { QhqBalanceCard } from './components/QhqBalanceCard';
import { WalletConnectButton } from './components/WalletConnectButton';
import { ClaimFlow } from './components/ClaimFlow';
import { TransactionHistory } from './components/TransactionHistory';
import { EarnOpportunities } from './components/EarnOpportunities';
import { SpendPanel } from './components/SpendPanel';

export default function QhqPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <Image src="/qhq_token.png" alt="QHQ" width={32} height={32} className="rounded-full" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">QHQ Token Wallet</h1>
            <p className="text-sm text-slate-400 mt-1">
              Earn QHQ by trading and using QuantivaHQ. Claim on Base chain.
            </p>
          </div>
        </div>
        <WalletConnectButton />
      </div>

      <div className="h-px bg-gradient-to-r from-[var(--primary)]/40 via-[var(--primary-light)]/20 to-transparent" />

      {/* Balance + Claim */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <QhqBalanceCard />
        <ClaimFlow />
      </div>

      {/* Earn + Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <EarnOpportunities />
        <SpendPanel />
      </div>

      {/* Transaction History */}
      <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <TransactionHistory />
      </div>
    </div>
  );
}
