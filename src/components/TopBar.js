'use client';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const TopBar = () => {
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [siteConfig, setSiteConfig] = useState(null);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const scrollRef = useRef(null);

  // Multiple announcements support
  const announcements = siteConfig?.announcements || [
    siteConfig?.topBarText || "Identity • Certainty • Zaqeen"
  ];

  useEffect(() => {
    // Site config fetching
    const unsubConfig = onSnapshot(doc(db, "settings", "site_config"), (doc) => {
      if (doc.exists()) setSiteConfig(doc.data());
    });

    // Active coupons fetching (matching coupon page logic)
    const q = query(collection(db, 'coupons'), where('active', '==', true));
    const unsubCoupons = onSnapshot(q, (snapshot) => {
      const couponsData = snapshot.docs.map(doc => ({
        id: doc.id,
        code: doc.data().code,
        type: doc.data().type,
        value: doc.data().value,
        description: doc.data().description || '',
        discount: doc.data().type === 'percentage' ? `${doc.data().value}%` : `৳${doc.data().value}`,
        expiresAt: doc.data().expiryDate,
        usedCount: doc.data().usedCount || 0,
        usageLimit: doc.data().usageLimit
      })).filter(coupon => {
        // Filter out expired coupons
        if (!coupon.expiresAt) return true;
        const expiryDate = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt);
        return expiryDate > new Date();
      });
      setActiveCoupons(couponsData);
    });

    return () => {
      unsubConfig();
      unsubCoupons();
    };
  }, []);

  // Announcement rotation
  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAnnouncementIndex((prev) => (prev + 1) % announcements.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [announcements.length]);

  // Countdown timer for coupon expiry
  useEffect(() => {
    if (activeCoupons.length > 0 && activeCoupons[0].expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(activeCoupons[0].expiresAt).getTime();
        const distance = expiry - now;

        if (distance < 0) {
          setCountdown(null);
        } else {
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setCountdown({ hours, minutes, seconds });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeCoupons]);

  // Copy coupon function with analytics
  const copyCoupon = (code, discount) => {
    navigator.clipboard.writeText(code);
    
    // Track coupon copy event (you can integrate analytics here)
    console.log(`Coupon copied: ${code}`);
    
    toast.success(
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span><strong>{code}</strong> copied! {discount && `Save ${discount}%`}</span>
      </div>,
      {
        style: {
          borderRadius: '0px',
          background: '#000',
          color: '#fff',
          fontSize: '11px',
          letterSpacing: '0.05em',
          padding: '12px 16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        },
        duration: 3000,
        icon: null
      }
    );
  };

  // Auto-scroll for coupons
  useEffect(() => {
    if (activeCoupons.length > 3 && scrollRef.current) {
      const scrollWidth = scrollRef.current.scrollWidth;
      const clientWidth = scrollRef.current.clientWidth;
      let scrollPosition = 0;
      
      const interval = setInterval(() => {
        scrollPosition += 1;
        if (scrollPosition >= scrollWidth - clientWidth) {
          scrollPosition = 0;
        }
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollPosition;
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [activeCoupons.length]);

  if (!siteConfig?.topBarText && activeCoupons.length === 0 && !isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-b from-[#0a0a0a] to-black text-white border-b border-white/[0.08] relative z-[100] overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)`
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 relative">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Left Side: Dynamic Announcement with animation */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Notification Icon */}
            <div className="relative flex items-center justify-center w-6 h-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full border border-amber-500/20 backdrop-blur-sm">
              <svg
                className="w-3 h-3 text-amber-400"
                fill="none"
                strokeWidth="2.5"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {/* Pulse animation */}
              <span className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping"></span>
            </div>

            {/* Coupon Descriptions */}
            {activeCoupons.length > 0 && activeCoupons.some(coupon => coupon.description) && (
              <div className="relative h-5 overflow-hidden">
                {activeCoupons.filter(coupon => coupon.description).map((coupon, index) => (
                  <p
                    key={`desc-${index}`}
                    className={`text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-bold text-amber-300 transition-all duration-700 absolute whitespace-nowrap ${
                      index === currentAnnouncementIndex % activeCoupons.filter(c => c.description).length
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-full'
                    }`}
                  >
                    {coupon.description}
                  </p>
                ))}
              </div>
            )}

            {/* Rotating announcements (fallback if no coupon descriptions) */}
            {(!activeCoupons.length || !activeCoupons.some(coupon => coupon.description)) && (
              <div className="relative h-5 overflow-hidden">
                {announcements.map((announcement, index) => (
                  <p
                    key={index}
                    className={`text-[9px] md:text-[10px] uppercase tracking-[0.25em] font-bold text-gray-300 transition-all duration-700 absolute whitespace-nowrap ${
                      index === currentAnnouncementIndex
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-full'
                    }`}
                  >
                    {announcement}
                  </p>
                ))}
              </div>
            )}

            {/* Announcement indicator dots */}
            {((announcements.length > 1 && (!activeCoupons.length || !activeCoupons.some(coupon => coupon.description))) ||
              (activeCoupons.filter(coupon => coupon.description).length > 1)) && (
              <div className="hidden md:flex gap-1">
                {Array.from({ length: activeCoupons.some(coupon => coupon.description) ?
                  activeCoupons.filter(coupon => coupon.description).length : announcements.length }, (_, index) => (
                  <div
                    key={index}
                    className={`w-1 h-1 rounded-full transition-all duration-300 ${
                      index === currentAnnouncementIndex
                        ? 'bg-amber-400 w-3'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Enhanced Coupon System */}
          {activeCoupons.length > 0 && (
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
              
              {/* Countdown Timer (if applicable) */}
              {countdown && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-sm">
                  <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[8px] font-black tracking-wider text-red-400 uppercase tabular-nums">
                    {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                  </span>
                </div>
              )}

              {/* Label */}
              <div className="hidden md:flex items-center gap-2">
                <div className="w-px h-4 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 whitespace-nowrap">
                  Active Offers
                </span>
              </div>

              {/* Coupon badges */}
              <div 
                ref={scrollRef}
                className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar scroll-smooth max-w-full sm:max-w-md"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {activeCoupons.map((coupon, index) => (
                  <button
                    key={index}
                    onClick={() => copyCoupon(coupon.code, coupon.discount)}
                    className="group relative flex items-center gap-2 bg-gradient-to-r from-white/[0.03] via-white/[0.05] to-white/[0.03] hover:from-amber-500/10 hover:via-amber-500/5 hover:to-amber-500/10 border border-white/10 hover:border-amber-500/30 px-3 sm:px-4 py-1.5 transition-all duration-500 active:scale-95 flex-shrink-0 overflow-hidden"
                    title={`Click to copy ${coupon.discount ? `- Save ${coupon.discount}%` : ''}`}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    
                    {/* Ticket Icon */}
                    <svg 
                      className="w-3.5 h-3.5 text-amber-400 transition-transform group-hover:rotate-12 group-hover:scale-110 flex-shrink-0" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                    </svg>   

                    {/* Coupon Code */}
                    <span className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] text-white uppercase relative z-10">
                      {coupon.code}
                    </span>

                    {/* Discount Badge */}
                    {coupon.discount && (
                      <span className="text-[7px] sm:text-[8px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-sm border border-amber-400/20">
                        -{coupon.discount}
                      </span>
                    )}

                    {/* Copy indicator line */}
                    <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-[1px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 transition-all duration-500"></div>
                    
                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-amber-500/0 group-hover:border-amber-500/50 transition-colors duration-300"></div>
                    <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-amber-500/0 group-hover:border-amber-500/50 transition-colors duration-300"></div>
                  </button>
                ))}
              </div>

              {/* Scroll indicator (for mobile) */}
              {activeCoupons.length > 2 && (
                <div className="flex sm:hidden items-center gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse"></div>
                  <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Premium gradient border */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
      
      {/* Secondary subtle border */}
      <div className="absolute bottom-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      {/* Close button (optional) */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 w-5 h-5 flex items-center justify-center text-gray-600 hover:text-white transition-colors duration-300 group"
        aria-label="Close announcement bar"
      >
        <svg className="w-3 h-3 group-hover:rotate-90 transition-transform duration-300" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default TopBar;
