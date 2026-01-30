'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import UserSidebar from '@/components/UserSidebar'; // ইউজার সাইডবার নিশ্চিত করুন

export default function AccountLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // ইউজার লগইন করা থাকলে এক্সেস দিন
        setIsAuthenticated(true);
      } else {
        // লগইন না থাকলে লগইন পেজে পাঠিয়ে দিন
        // ইউজার লগইন পেজ সাধারণত '/login' হয়
        router.push(`/login?redirect=${pathname}`);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  // লোডিং স্টেট - প্রিমিয়াম অ্যানিমেশন সহ
  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] uppercase tracking-[0.5em] font-black italic animate-pulse">
          Syncing Identity Protocol...
        </p>
      </div>
    );
  }

  // ভেরিফাইড ইউজার হলে মূল কন্টেন্ট দেখাবে
  return isAuthenticated ? (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FDFDFD]">
      {/* ইউজার সাইডবার - যা আমরা আগে কলাপসিবল এবং মোবাইল ফ্রেন্ডলি করেছিলাম */}
      <UserSidebar />
      
      {/* মেইন কন্টেন্ট স্টেজ */}
      <main className="flex-1 p-6 md:p-12 lg:p-20 overflow-x-hidden animate-fadeIn">
        <div className="max-w-5xl mx-auto">
           {children}
        </div>
        
        {/* কন্টেন্ট ফুটার বা সাব-ইনফো */}
        <div className="mt-20 pt-10 border-t border-gray-50 opacity-20 italic">
            <p className="text-[8px] uppercase tracking-[0.5em] font-black">
                Zaqeen User Access Protocol v2.0
            </p>
        </div>
      </main>
    </div>
  ) : null;
}
