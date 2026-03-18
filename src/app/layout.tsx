import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/providers/auth-provider';
import { CartProvider } from '@/providers/cart-provider';
import { Toaster } from '@/components/ui/toaster';
import { getStoreSettings } from '@/lib/data';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const storeName = settings?.storeDetails?.name || 'My E-Commerce Store';

  // Create a dynamic SVG favicon with "ILV" text
  const ilvFaviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="black" /><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="bold" fill="white">ILV</text></svg>`;
  const ilvFaviconDataUri = `data:image/svg+xml;base64,${Buffer.from(ilvFaviconSvg).toString('base64')}`;

  return {
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description: `The official store for ${storeName}.`,
    icons: {
      icon: ilvFaviconDataUri,
      shortcut: ilvFaviconDataUri,
      apple: ilvFaviconDataUri,
      other: [
        {
          rel: 'icon',
          url: ilvFaviconDataUri,
          sizes: 'any',
          type: 'image/svg+xml',
        },
      ],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
      >
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
