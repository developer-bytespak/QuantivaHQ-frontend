'use client';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">QHQ Token Wallet</h1>
          <p className="text-sm text-slate-400 mt-1">
            Earn QHQ by trading and using QuantivaHQ. Claim on Base chain.
          </p>
        </div>
        <WalletConnectButton />
      </div>

      {/* Balance + Claim */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QhqBalanceCard />
        <ClaimFlow />
      </div>

      {/* Earn + Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EarnOpportunities />
        <SpendPanel />
      </div>

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
}
