'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar'; // সাইডবার ইম্পোর্ট নিশ্চিত করুন

export default function AdminLayout({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().role === 'admin') { 
            // 'isAdmin' এর বদলে 'role === admin' চেক করা বেশি নিরাপদ
            setIsAdmin(true);
          } else {
            // অ্যাডমিন না হলে মেইন অ্যাকাউন্টে পাঠিয়ে দিন
            router.push('/account'); 
          }
        } catch (error) {
          console.error("Verification failed", error);
          router.push('/admin/login');
        }
      } else {
        // লগইন না থাকলে লগইন পেজে
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  // লগইন পেজের জন্য আলাদা লেআউট
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <p className="text-xs uppercase tracking-[0.4em] animate-pulse">Verifying Admin Access...</p>
      </div>
    );
  }

  // যদি ভেরিফাইড অ্যাডমিন হয় তবেই মূল কন্টেন্ট দেখাবে
  return isAdmin ? (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  ) : null;
}