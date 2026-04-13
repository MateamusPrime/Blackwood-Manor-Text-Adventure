import type { Metadata } from 'next';
import { VT323 } from 'next/font/google';
import './globals.css';

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Blackwood Manor',
  description: 'A haunted mansion text adventure. Dare you enter?',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${vt323.variable} h-full`}>
      <body
        className="h-full overflow-hidden"
        style={{
          backgroundColor: '#0a0a0a',
          fontFamily: 'var(--font-vt323), monospace',
        }}
      >
        {children}
      </body>
    </html>
  );
}
