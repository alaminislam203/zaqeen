'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { HiTicket } from 'react-icons/hi';
import { RiNotification3Line } from 'react-icons/ri';

const TopBar = () => {
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [siteConfig, setSiteConfig] = useState(null);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "settings", "site_config"), (doc) => {
      if (doc.exists()) setSiteConfig(doc.data());
    });

    const q = query(collection(db, 'coupons'), where('active', '==', true));
    const unsubCoupons = onSnapshot(q, (snapshot) => {
      const coupons = snapshot.docs.map(doc => doc.data().code);
      setActiveCoupons(coupons);
    });

    return () => {
      unsubConfig();
      unsubCoupons();
    };
  }, []);

  if (!siteConfig?.topBarText && activeCoupons.length === 0) return null;

  return (
    <div className="w-full bg-[#0d0d0d] text-white border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left Side: Announcement */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <RiNotification3Line className="text-amber-400 w-4 h-4 animate-pulse" />
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-500 rounded-full border border-black"></span>
          </div>
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] font-medium text-gray-300">
            {siteConfig?.topBarText || "Experience Luxury with Zaqeen"}
          </p>
        </div>

        {/* Right Side: Active Coupons as Clean Badges */}
        {activeCoupons.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 hidden sm:inline-block">Limited Offers:</span>
            <div className="flex gap-2">
              {activeCoupons.map(code => (
                <div 
                  key={code} 
                  className="group relative flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 rounded-full transition-all duration-300 cursor-default"
                >
                  <HiTicket className="text-amber-400 text-xs transition-transform group-hover:rotate-12" />
                  <span className="text-[10px] font-bold tracking-widest text-white">{code}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TopBar;