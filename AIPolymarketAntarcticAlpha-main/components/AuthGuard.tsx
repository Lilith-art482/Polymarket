'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { LandingPage } from './LandingPage';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (user && pathname === '/auth') {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  if (loading) return null;
  if (user) return <>{children}</>;
  if (pathname === '/auth') return <>{children}</>;
  return <LandingPage />;
}
