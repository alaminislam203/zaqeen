'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MaintenanceMode({ children }) {
  const pathname = usePathname();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site_config'), (doc) => {
      if (doc.exists()) {
        const settings = doc.data();
        setIsMaintenance(settings.maintenanceMode || false);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow admin access during maintenance
  if (isMaintenance && !pathname.startsWith('/admin')) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center min-h-screen">
        <div className="text-center space-y-8 px-6 max-w-md">
          {/* Animated Logo/Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-2 border-white/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
              {/* Pulsing effect */}
              <div className="absolute inset-0 border-2 border-white/10 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
              Under Maintenance
            </h1>
            <p className="text-[11px] font-medium tracking-wide text-white/70 leading-relaxed">
              We're currently performing scheduled maintenance to improve your experience.
              We'll be back online shortly.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>

          {/* Estimated Time */}
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/50">
            Estimated Return: Soon
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-white/10"></div>
          <div className="absolute top-8 right-8 w-16 h-16 border-r border-t border-white/10"></div>
          <div className="absolute bottom-8 left-8 w-16 h-16 border-l border-b border-white/10"></div>
          <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-white/10"></div>
        </div>
      </div>
    );
  }

  return children;
}
