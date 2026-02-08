'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

const Hero = () => {
  const [banner, setBanner] = useState({
    headline: 'Confidence in Every Thread',
    subheading: 'Redefining style with minimal aesthetics and premium craftsmanship.',
    imageUrl: 'https://images.unsplash.com/photo-1509316976857-0b44b6ae229b?q=80&w=2787&auto=format&fit=crop',
    ctaText: 'Explore Collection',
    ctaLink: '/shop'
  });
  const [loading, setLoading] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            imageUrl: config.bannerImageUrl || banner.imageUrl,
            ctaText: config.bannerCtaText || banner.ctaText,
            ctaLink: config.bannerCtaLink || banner.ctaLink
          });
        }
      } catch (error) {
        console.error("Banner fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBannerData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 80px)`
            }}></div>
          </div>
        </div>
        
        {/* Loading animation */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/40 text-center">
            Loading Experience
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Background Image with Parallax */}
      <div 
        className="absolute inset-0 will-change-transform"
        style={{ 
          transform: `translateY(${scrollY * 0.5}px) scale(${1 + scrollY * 0.0002})`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[12s] ease-out hover:scale-110"
          style={{ backgroundImage: `url(${banner.imageUrl})` }}
        >
          {/* Image overlay for better text visibility */}
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
      </div>

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"></div>
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top corner decoration */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-white/10"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-white/10"></div>
        
        {/* Vertical lines */}
        <div className="absolute left-8 md:left-16 top-0 w-[1px] h-40 bg-gradient-to-b from-white/40 to-transparent"></div>
        <div className="absolute right-8 md:right-16 top-0 w-[1px] h-40 bg-gradient-to-b from-white/40 to-transparent"></div>
        
        {/* Bottom corner decoration */}
        <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-white/10"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-white/10"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 md:px-12 max-w-7xl mx-auto">
          
        {/* Top Label */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] text-white/80 font-black">
              Zaqeen Archive — Vol. 01
            </span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white">
            {banner.headline.split(' ').map((word, i) => (
              <span 
                key={i} 
                className={`inline-block ${
                  i % 2 === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-white stroke-text' : ''
                } transition-all duration-700 hover:scale-105`}
                style={{ 
                  animationDelay: `${i * 100}ms`,
                  display: 'inline-block',
                  margin: '0 0.1em'
                }}
              >
                {word}
              </span>
            ))}
          </h1>
          
          {/* Decorative line under headline */}
          <div className="flex items-center justify-center gap-3 opacity-50">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-white"></div>
            <div className="w-2 h-2 border border-white rotate-45"></div>
            <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-white"></div>
          </div>
        </div>

        {/* Subheading */}
        <p className="text-xs md:text-sm font-medium tracking-[0.2em] uppercase text-white/70 max-w-2xl mx-auto leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          {banner.subheading}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">
          <Link 
            href={banner.ctaLink}
            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-white text-black text-xs font-black uppercase tracking-[0.3em] transition-all overflow-hidden shadow-2xl hover:shadow-white/20 rounded-sm"
          >
            <span className="relative z-10 flex items-center gap-3">
              {banner.ctaText}
              <svg 
                className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" 
                fill="none" 
                strokeWidth="2.5" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gray-100 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
          </Link>

          <Link 
            href="/about"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-transparent border-2 border-white/30 text-white text-xs font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:border-white transition-all backdrop-blur-sm rounded-sm"
          >
            <span>Learn More</span>
            <svg 
              className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              strokeWidth="2.5" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Features/USPs */}
        <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-8 md:gap-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-1000">
          {[
            { icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>, text: 'Premium Quality' },
            { icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, text: 'Fast Delivery' },
            { icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, text: 'Secure Payment' },
          ].map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/30 transition-all">
                {item.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Side Decorative Text */}
      <div className="absolute bottom-16 right-8 md:right-16 hidden lg:block opacity-30 group-hover:opacity-50 transition-opacity">
        <p className="text-[8px] font-black uppercase tracking-[0.8em] text-white vertical-text">
          Certainty • Identity • Zaqeen
        </p>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center gap-2 text-white/40 hover:text-white/80 transition-colors cursor-pointer">
          <span className="text-[8px] font-bold uppercase tracking-widest">Scroll</span>
          <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Ambient Light Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .stroke-text {
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.3);
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
        }
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;