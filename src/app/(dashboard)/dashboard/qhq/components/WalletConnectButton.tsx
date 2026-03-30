'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import useQhqStore from '@/state/qhq-store';

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { wallet, linkWallet, fetchWallet } = useQhqStore();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Auto-link wallet when user connects (if not already linked)
  useEffect(() => {
    if (isConnected && address && (!wallet || wallet.wallet_address.toLowerCase() !== address.toLowerCase())) {
      linkWallet(address).catch(() => {
        // Wallet may already be linked — ignore error
      });
    }
  }, [isConnected, address, wallet, linkWallet]);

  return (
    <div>
      <ConnectButton
        label="Connect Wallet to Claim"
        chainStatus="icon"
        showBalance={false}
        accountStatus="address"
      />
      {wallet && (
        <p className="mt-2 text-xs text-slate-400">
          Linked: {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
        </p>
      )}
    </div>
  );
}
