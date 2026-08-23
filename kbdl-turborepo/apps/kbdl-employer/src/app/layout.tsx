import type { Metadata } from 'next';
import { Toaster } from '../components/ui/toaster';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'KBDL Employer',
  description: 'Employer portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Toaster />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
