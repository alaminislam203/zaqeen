import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';
import LiveChatWidget from '@/components/LiveChatWidget';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MaintenanceMode from '@/components/MaintenanceMode';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // ফন্ট লোড হওয়ার সময় ইউজার এক্সপেরিয়েন্স ভালো রাখার জন্য
});

export const metadata = {
  metadataBase: new URL('https://zaqeen.vercel.app'), // আপনার আসল ডোমেইন দিন
  title: {
    template: '%s | Zaqeen',
    default: 'Zaqeen — Confidence, Belief, and Certainty',
  },
  description: 'Zaqeen redefines modern fashion with premium streetwear and boutique apparel. Discover a curation of quality and confidence.',
  keywords: ['streetwear', 'luxury apparel', 'minimal fashion', 'Zaqeen', 'premium hoodies', 'boutique clothing'],
  authors: [{ name: 'Zaqeen Ventures' }],
  creator: 'Zaqeen Studio',
  icons: {
    icon: '/favicon.ico', // আপনার পাবলিক ফোল্ডারে ফেভিকন থাকতে হবে
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Zaqeen — Curated Streetwear & Apparel',
    description: 'Minimalist aesthetics meet premium craftsmanship.',
    url: 'https://zaqeen.vercel.app',
    siteName: 'Zaqeen',
    images: [
      {
        url: '/og-image.png', 
        width: 1200,
        height: 630,
        alt: 'Zaqeen Premium Collection',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zaqeen — Curated Streetwear',
    description: 'Premium collections for the modern wardrobe.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      {/* Selection কালার আপনার ব্র্যান্ডের থিমের সাথে মিলিয়ে কালো রাখা হয়েছে */}
      <body className={`${inter.className} bg-[#FDFDFD] text-[#111] antialiased selection:bg-black selection:text-white`}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {/* লেআউটকে সুন্দর রাখতে Flexbox ব্যবহার করা হয়েছে */}
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">
                  <MaintenanceMode>
                    {children}
                  </MaintenanceMode>
                </main>
                <Footer />
              </div>
              
              <LiveChatWidget />
              
              <Toaster 
                position="bottom-center"
                reverseOrder={false}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#000',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    borderRadius: '0px', // লাক্সারি লুকের জন্য রাউন্ডেড কর্নার বাদ দেওয়া হয়েছে
                    padding: '16px 24px',
                    border: '1px solid #333'
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
