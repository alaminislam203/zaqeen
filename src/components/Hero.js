'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

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
        if (docSnap.exists() && docSnap.data().bannerHeadline) {
          const config = docSnap.data();
          setBanner({
            headline: config.bannerHeadline,
            subheading: config.bannerSubheading,
            imageUrl: config.bannerImageUrl
          });
        }
      } catch (error) {
        console.error("Error fetching banner data: ", error);
        // Keep default banner on error
      } finally {
        setLoading(false);
      }
    };

    fetchBannerData();
  }, []);

  if (loading) {
    return (
        <div className="w-full h-[70vh] md:h-[90vh] bg-gray-100 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  return (
    <section 
      className="w-full h-[70vh] md:h-[90vh] bg-cover bg-center bg-no-repeat flex items-center justify-center text-white relative"
      style={{ backgroundImage: `url(${banner.imageUrl})` }}
    >
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="relative z-10 text-center px-6 space-y-8 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-tight italic">
            {banner.headline}
          </h1>
          <p className="text-sm md:text-base font-medium tracking-widest uppercase text-white/80">
            {banner.subheading}
          </p>
          <div className="pt-6">
              <Link href="/products" className="bg-white text-black px-10 py-5 text-xs font-bold uppercase tracking-[0.4em] hover:bg-opacity-90 transition-all shadow-2xl hover:shadow-lg">
                  
                    Explore Collection
                  
              </Link>
          </div>
      </div>
    </section>
  );
};

export default Hero;
