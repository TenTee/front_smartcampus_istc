'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SalairesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/finances/salaires-personnel');
  }, [router]);
  return null;
}
