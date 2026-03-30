'use client';

import Image from 'next/image';
import Link from 'next/link';

export function QhqBalanceChip() {
  return (
    <Link
      href="/dashboard/qhq"
      title="QHQ Token Wallet"
    >
      <Image
        src="/qhq_token.png"
        alt="QHQ"
        width={36}
        height={36}
        className="rounded-full hover:opacity-80 transition-opacity"
      />
    </Link>
  );
}
