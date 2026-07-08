'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'react-toastify';
import { qhqApi } from '@/lib/api/qhq-token';
import { QHQ_CONTRACT_ABI, QHQ_CONTRACT_ADDRESS } from '@/lib/web3/qhq-contract';
import useQhqStore from '@/state/qhq-store';

export function ClaimFlow() {
  const { isConnected, address } = useAccount();
  const { balance, fetchBalance } = useQhqStore();
  const [isClaiming, setIsClaiming] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  const pendingBalance = balance ? parseFloat(balance.pending_balance) : 0;
  const canClaim = isConnected && pendingBalance > 0 && !isClaiming;

  const handleClaim = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (pendingBalance <= 0) {
      toast.error('No QHQ available to claim');
      return;
    }

    setIsClaiming(true);
    try {
      const proofData = await qhqApi.getClaimProof();
      const cumulativeAmountWei = BigInt(proofData.cumulative_amount_wei);
      const claimAmount = proofData.cumulative_amount;

      const txHash = await writeContractAsync({
        address: QHQ_CONTRACT_ADDRESS,
        abi: QHQ_CONTRACT_ABI,
        functionName: 'claim',
        args: [cumulativeAmountWei, proofData.proof as `0x${string}`[]],
      });

      setPendingTxHash(txHash);
      toast.info('Transaction submitted! Waiting for confirmation...');

      await qhqApi.confirmClaim(txHash, claimAmount);
      await fetchBalance();

      toast.success(
        <span>
          Claimed {parseFloat(claimAmount).toFixed(2)} QHQ!{' '}
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Basescan
          </a>
        </span>,
        { autoClose: 8000 },
      );
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || '';
      if (msg.includes('User rejected') || msg.includes('user rejected') || msg.includes('denied')) {
        toast.error('Transaction rejected by user.');
      } else if (msg.includes('insufficient funds') || msg.includes('gas')) {
        toast.error('Insufficient ETH on Base for gas fees.');
      } else if (msg.includes('MerkleRoot') || msg.includes('proof')) {
        toast.error('Merkle proof invalid. Wait for the next weekly root update.');
      } else {
        toast.error('Claim failed. Please try again.');
      }
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/[0.09] bg-gradient-to-b from-white/[0.055] via-white/[0.02] to-white/[0.015] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-colors duration-300 hover:border-white/[0.14] animate-fade-in">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/25 bg-[var(--primary)]/10">
          <svg className="h-4 w-4 text-[var(--primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </span>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white">Claim QHQ On-Chain</h3>
          <p className="mt-0.5 text-[10px] sm:text-xs text-slate-500">
            Transfer your earned QHQ tokens to your Base wallet. Tokens are verified via Merkle proof.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg sm:rounded-xl border border-white/[0.07] bg-gradient-to-b from-white/[0.06] to-white/[0.02] transition-colors duration-300 hover:border-[var(--primary)]/25 mb-4">
        <span className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Available to claim</span>
        <span className="text-xl font-bold tracking-tight text-white [font-variant-numeric:tabular-nums]">
          {pendingBalance.toFixed(2)} <span className="text-[var(--primary-light)] text-base">QHQ</span>
        </span>
      </div>

      <button
        onClick={handleClaim}
        disabled={!canClaim || isConfirming}
        className={`w-full py-3 px-4 rounded-full font-semibold transition-all ${
          canClaim && !isConfirming
            ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] hover:scale-[1.03] active:scale-[0.98]'
            : 'border border-white/[0.08] bg-white/[0.04] text-slate-500 cursor-not-allowed'
        }`}
      >
        {isClaiming || isConfirming
          ? 'Processing...'
          : !isConnected
          ? 'Connect wallet to claim'
          : pendingBalance <= 0
          ? 'No QHQ to claim'
          : `Claim ${pendingBalance.toFixed(2)} QHQ`}
      </button>

      {pendingTxHash && isConfirmed && (
        <div className="mt-3 text-xs text-green-400 text-center bg-green-400/10 border border-green-400/20 rounded-xl p-2">
          Confirmed!{' '}
          <a
            href={`https://basescan.org/tx/${pendingTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Basescan
          </a>
        </div>
      )}
    </div>
  );
}
