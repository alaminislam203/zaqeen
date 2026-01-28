import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';
import LiveChatWidget from '@/components/LiveChatWidget';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    template: '%s | Zaqeen - Curated Streetwear & Apparel',
    default: 'Zaqeen - Curated Streetwear & Apparel',
  },
  description: 'Discover curated collections of premium streetwear, t-shirts, hoodies, and accessories at Zaqeen. Redefining modern fashion with quality and confidence.',
  keywords: ['streetwear', 't-shirts', 'hoodies', 'apparel', 'fashion', 'online shopping', 'Zaqeen'],
  openGraph: {
    title: 'Zaqeen - Curated Streetwear & Apparel',
    description: 'Premium collections for the modern wardrobe.',
    url: 'https://zaqeen-aa745.web.app',
    siteName: 'Zaqeen',
    images: [
      {
        url: 'https://zaqeen-aa745.web.app/og-image.png', // একটি আকর্ষণীয় ওপেন গ্রাফ ইমেজ যোগ করতে হবে
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              {children}
              <Footer />
              <LiveChatWidget />
              <Toaster 
                position="bottom-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#111',
                    color: '#fff',
                    borderRadius: '99px',
                    padding: '12px 20px',
                  }
                }}
              />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
