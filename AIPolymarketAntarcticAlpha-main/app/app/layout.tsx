import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';
import { AuthGuard } from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Polymarket AI',
  description: 'Сигналы и аналитика для торговли на Polymarket',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Providers>
          <AuthGuard>
            <Navbar />
            {children}
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
