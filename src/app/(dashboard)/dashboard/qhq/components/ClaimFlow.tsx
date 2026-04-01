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
    <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">Claim QHQ On-Chain</h3>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Transfer your earned QHQ tokens to your Base wallet. Tokens are verified via Merkle proof.
      </p>

      <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white/[0.07] to-transparent rounded-xl border border-[--color-border] mb-4">
        <span className="text-sm text-slate-400">Available to claim</span>
        <span className="text-xl font-bold text-white">
          {pendingBalance.toFixed(2)} <span className="text-[#fda300] text-base">QHQ</span>
        </span>
      </div>

      <button
        onClick={handleClaim}
        disabled={!canClaim || isConfirming}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
          canClaim && !isConfirming
            ? 'bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white hover:from-[#fd6a00] hover:to-[#fdb800] hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
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
        <div className="mt-3 text-xs text-green-400 text-center bg-green-400/10 border border-green-400/20 rounded-lg p-2">
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
