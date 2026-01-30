'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { RiArrowRightLine } from 'react-icons/ri';

const Hero = () => {
  const [banner, setBanner] = useState({
    headline: 'Confidence in Every Thread',
    subheading: 'Redefining style with minimal aesthetics and premium craftsmanship.',
    imageUrl: 'https://images.unsplash.com/photo-1509316976857-0b44b6ae229b?q=80&w=2787&auto=format&fit=crop'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        const docRef = doc(db, 'settings', 'site_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const config = docSnap.data();
          setBanner({
            headline: config.bannerHeadline || banner.headline,
            subheading: config.bannerSubheading || banner.subheading,
            imageUrl: config.bannerImageUrl || banner.imageUrl
          });
        }
      } catch (error) {
        console.error("Transmission Breach: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBannerData();
  }, [banner.headline, banner.subheading, banner.imageUrl]);

  if (loading) {
    return (
        <div className="w-full h-[80vh] md:h-[95vh] bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 animate-shimmer"></div>
            <div className="relative z-10 w-24 h-[1px] bg-white/20 animate-pulse"></div>
        </div>
    );
  }

  return (
    <section className="relative w-full h-[80vh] md:h-[95vh] overflow-hidden group">
      {/* Background Image with Auto-Zoom Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10s] ease-out group-hover:scale-110"
        style={{ backgroundImage: `url(${banner.imageUrl})` }}
      ></div>

      {/* Modern Cinematic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
      
      {/* Vertical Aesthetic Line */}
      <div className="absolute left-6 md:left-12 top-0 w-[1px] h-32 bg-gradient-to-b from-white/40 to-transparent hidden md:block"></div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto space-y-10">
          
          <div className="space-y-4 animate-fadeIn">
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.8em] text-white/60 font-black italic block">
                Zaqeen Archive — Vol. 01
            </span>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] italic text-white">
              {banner.headline.split(' ').map((word, i) => (
                <span key={i} className={i === 1 ? "text-transparent stroke-text" : ""}>
                    {word}{' '}
                </span>
              ))}
            </h1>
          </div>

          <p className="text-[10px] md:text-[12px] font-bold tracking-[0.3em] uppercase text-white/70 max-w-xl mx-auto leading-loose animate-fadeInDelay">
            {banner.subheading}
          </p>

          <div className="pt-10 animate-fadeInDelayMore">
              <Link href="/products" className="group relative inline-flex items-center gap-6 px-12 py-6 bg-white text-black text-[10px] font-black uppercase tracking-[0.5em] transition-all overflow-hidden active:scale-95 shadow-2xl">
                <span className="relative z-10 flex items-center gap-3">
                    Explore Gallery <RiArrowRightLine className="group-hover:translate-x-2 transition-transform duration-500" />
                </span>
                <div className="absolute inset-0 bg-neutral-200 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </Link>
          </div>
      </div>

      {/* Decorative Brand Watermark */}
      <div className="absolute bottom-10 right-10 hidden md:block opacity-20">
          <p className="text-[8px] font-black uppercase tracking-[1em] text-white vertical-text">
              Certainty in Curation
          </p>
      </div>

      <style jsx>{`
        .stroke-text {
          -webkit-text-stroke: 1px white;
        }
        .vertical-text {
          writing-mode: vertical-rl;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </section>
  );
};

export default Hero;
