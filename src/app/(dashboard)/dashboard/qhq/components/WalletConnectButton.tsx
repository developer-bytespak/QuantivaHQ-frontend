'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import useQhqStore from '@/state/qhq-store';

export function WalletConnectButton() {
  const { isConnected, address } = useAccount();
  const { wallet, linkWallet, disconnectWallet, fetchWallet } = useQhqStore();
  const [showRefresh, setShowRefresh] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Handle wallet connection
  useEffect(() => {
    if (isConnected && address) {
      if (!wallet || wallet.wallet_address.toLowerCase() !== address.toLowerCase()) {
        linkWallet(address).catch(() => {});
        fetchWallet();
      }
      setShowRefresh(false);
      setWasConnected(true);
    }
  }, [isConnected, address, wallet, linkWallet, fetchWallet]);

  // Handle wallet disconnection - delete from backend
  useEffect(() => {
    if (!isConnected && wasConnected) {
      disconnectWallet().catch((error: any) => {
        console.error('Failed to disconnect wallet from backend:', error);
      });
      setWasConnected(false);
    }
  }, [isConnected, wasConnected, disconnectWallet]);

  if (isConnected) {
    return (
      <ConnectButton
        chainStatus="icon"
        showBalance={false}
        accountStatus="address"
      />
    );
  }

  return (
    <div className="flex items-center gap-3">
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            onClick={() => {
              openConnectModal();
              setShowRefresh(true);
            }}
            className="py-2.5 px-6 rounded-lg text-base font-semibold transition-all whitespace-nowrap bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white hover:from-[#fd6a00] hover:to-[#fdb800]"
          >
            Connect Wallet
          </button>
        )}
      </ConnectButton.Custom>

      {showRefresh && (
        <button
          onClick={() => window.location.reload()}
          className="py-2.5 px-4 rounded-lg text-sm font-medium border border-[--color-border] text-slate-300 hover:text-white hover:border-[var(--primary)]/50 transition-all"
        >
          ↻ Refresh
        </button>
      )}
    </div>
  );
}
