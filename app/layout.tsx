import type { Metadata } from 'next';
import './globals.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
import { LanguageProvider } from '@/context/LanguageContext';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import TopBar from '@/components/TopBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppFloating from '@/components/WhatsAppFloating';

import dynamicImport from 'next/dynamic';

const AdminToolbar = dynamicImport(() => import('@/components/AdminToolbar'), { ssr: false });
const AdminOrdersDrawer = dynamicImport(() => import('@/components/AdminOrdersDrawer'), { ssr: false });
const AdminProductModal = dynamicImport(() => import('@/components/AdminProductModal'), { ssr: false });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: 'Kakria Dairy — Since 2002 by DKK | Pure Desi Dairy in Kotakpura',
  description:
    'Genuinely made, blindly trusted — the taste of home since 2002. Authentic Cow Ghee, Buffalo Ghee, A2 Binola Ghee, Fresh Paneer, Pure Khoya, Makhan, and Chatti Milk from Kotakpura, Punjab.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/brand/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Kakria Dairy — Since 2002 by DKK',
    description: 'Pure Desi Dairy in Kotakpura, Punjab. Authentic Ghee, Paneer, Butter, and Milk.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className="bg-dairy-cream text-dairy-text min-h-screen flex flex-col selection:bg-dairy-gold selection:text-dairy-green-dark">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <AdminToolbar />
              <TopBar />
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <AdminOrdersDrawer />
              <AdminProductModal />
              <Footer />
              <WhatsAppFloating />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

