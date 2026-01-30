'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { HiTicket } from 'react-icons/hi';
import { RiNotification3Line } from 'react-icons/ri';
import toast from 'react-hot-toast';

const TopBar = () => {
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [siteConfig, setSiteConfig] = useState(null);

  useEffect(() => {
    // সাইট কনফিগ ফেচিং
    const unsubConfig = onSnapshot(doc(db, "settings", "site_config"), (doc) => {
      if (doc.exists()) setSiteConfig(doc.data());
    });

    // সক্রিয় কুপন ফেচিং
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

  // কুপন কপি করার ফাংশন
  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`${code} copied to clipboard`, {
        style: {
            borderRadius: '0px',
            background: '#000',
            color: '#fff',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
        }
    });
  };

  if (!siteConfig?.topBarText && activeCoupons.length === 0) return null;

  return (
    <div className="w-full bg-[#0a0a0a] text-white border-b border-white/[0.05] relative z-[100]">
      <div className="max-w-7xl mx-auto px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Dynamic Announcement */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-5 h-5 bg-white/5 rounded-full border border-white/10">
            <RiNotification3Line className="text-amber-400 w-2.5 h-2.5 animate-pulse" />
          </div>
          <p className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-black italic text-gray-400">
            {siteConfig?.topBarText || "Identity • Certainty • Zaqeen"}
          </p>
        </div>

        {/* Right Side: Clickable Coupon Badges */}
        {activeCoupons.length > 0 && (
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar w-full sm:w-auto justify-center">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600 whitespace-nowrap hidden md:inline">
              Exclusive Access:
            </span>
            <div className="flex gap-3">
              {activeCoupons.map(code => (
                <button 
                  key={code} 
                  onClick={() => copyCoupon(code)}
                  className="group flex items-center gap-2 bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 border border-white/10 px-4 py-1.5 transition-all duration-500 active:scale-95"
                  title="Click to copy blueprint code"
                >
                  <HiTicket className="text-amber-500 text-[10px] transition-transform group-hover:rotate-12" />
                  <span className="text-[9px] font-black tracking-[0.2em] text-white uppercase italic">{code}</span>
                  <div className="w-0 group-hover:w-1 h-[1px] bg-amber-500 transition-all duration-500"></div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* নিচের বর্ডারে খুব হালকা একটি গ্রেডিয়েন্ট লাইন (Premium Touch) */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>
  );
};

export default TopBar;
