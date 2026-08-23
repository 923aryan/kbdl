import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KBDL Admin',
  description: 'Product owner console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F6F7F9] text-[#111827]">{children}</body>
    </html>
  );
}
