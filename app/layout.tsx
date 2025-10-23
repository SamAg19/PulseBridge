import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Healthcare Platform',
  description: 'Connect with verified doctors and manage appointments with PYUSD payments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
