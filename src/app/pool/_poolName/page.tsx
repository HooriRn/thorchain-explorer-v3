"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PoolPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [poolName, setPoolName] = useState('');

  useEffect(() => {
    const asset = searchParams.get('asset');
    if (asset) {
      setPoolName(decodeURIComponent(asset));
    } else {
      router.push('/pools');
    }
  }, [searchParams, router]);

  if (!poolName) return <div>Loading...</div>;

  return (
    <div>
      <h1>Pool: {poolName}</h1>
      <div>
        <button onClick={() => router.push(`/pool/poolName/lp?asset=${encodeURIComponent(poolName)}`)}>
          LP Positions
        </button>
        <button onClick={() => router.push(`/pool/poolName/savers?asset=${encodeURIComponent(poolName)}`)}>
          Savers
        </button>
        <button onClick={() => router.push(`/pool/poolName/txs?asset=${encodeURIComponent(poolName)}`)}>
          Transactions
        </button>
      </div>
    </div>
  );
}