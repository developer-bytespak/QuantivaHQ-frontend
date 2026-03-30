// QHQ Token contract ABI (minimal — only functions used by frontend)
export const QHQ_CONTRACT_ABI = [
  // ERC-20 standard
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  // Merkle claim
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'cumulativeAmount', type: 'uint256' },
      { name: 'proof', type: 'bytes32[]' },
    ],
    outputs: [],
  },
  {
    name: 'claimableAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'cumulativeAmount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'claimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const QHQ_CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_QHQ_CONTRACT_ADDRESS ?? ''
) as `0x${string}`;
