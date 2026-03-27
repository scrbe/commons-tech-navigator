import type { Metadata } from 'next';
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';
import './globals.css';

export const metadata: Metadata = {
  title: 'Commons Tech Navigator',
  description:
    'AI-powered governance guidance for common-pool resource management technology projects.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* ThemeRegistry provides MUI theme + emotion cache to all child components.
            Must wrap the entire app at the root layout level. */}
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
