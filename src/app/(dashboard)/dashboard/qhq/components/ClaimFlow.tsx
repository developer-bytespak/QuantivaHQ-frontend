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
      // 1. Get Merkle proof from backend
      const proofData = await qhqApi.getClaimProof();
      const cumulativeAmountWei = BigInt(proofData.cumulative_amount_wei);
      const claimAmount = proofData.cumulative_amount;

      // 2. Submit claim tx to Base chain
      const txHash = await writeContractAsync({
        address: QHQ_CONTRACT_ADDRESS,
        abi: QHQ_CONTRACT_ABI,
        functionName: 'claim',
        args: [cumulativeAmountWei, proofData.proof as `0x${string}`[]],
      });

      setPendingTxHash(txHash);
      toast.info('Transaction submitted! Waiting for confirmation...');

      // 3. Record claim in backend after tx is confirmed
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
    <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-2">Claim QHQ On-Chain</h3>
      <p className="text-sm text-slate-400 mb-6">
        Transfer your earned QHQ tokens to your Base wallet. Tokens are verified via Merkle proof.
      </p>

      <div className="flex items-center justify-between p-4 bg-[--color-surface-alt] rounded-lg mb-4">
        <span className="text-sm text-slate-400">Available to claim</span>
        <span className="text-xl font-bold text-white">
          {pendingBalance.toFixed(2)} <span className="text-[--color-primary] text-base">QHQ</span>
        </span>
      </div>

      <button
        onClick={handleClaim}
        disabled={!canClaim || isConfirming}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
          canClaim && !isConfirming
            ? 'bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white hover:from-[#fd6a00] hover:to-[#fdb800]'
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
        <p className="mt-2 text-xs text-green-400 text-center">
          Confirmed!{' '}
          <a
            href={`https://basescan.org/tx/${pendingTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Basescan
          </a>
        </p>
      )}
    </div>
  );
}
