'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';

import Hero from '@/components/Hero';
import NewArrivals from '@/components/NewArrivals';
import Link from 'next/link';
import { RiInstagramLine, RiArrowRightUpLine } from 'react-icons/ri';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ডাটা ফেচিং প্রোটোকল
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(8));
    const unsub = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeaturedProducts(productsData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white overflow-x-hidden">
      
      {/* Cinematic Hero Segment */}
      <Hero />

      {/* --- Section 01: Brand Identity Protocols --- */}
      <section className="py-24 md:py-40 border-b border-gray-50 bg-[#fdfdfd]">
        <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-20 text-center">
          {[
            { title: "Architectural Quality", desc: "Crafted with the finest fibers for ultimate permanence and structural integrity." },
            { title: "Modern Blueprint", desc: "Minimalist silhouettes that command maximum attention in any environment." },
            { title: "The Ethical Belief", desc: "Confidence rooted in certainty and curated expression of the self." }
          ].map((item, idx) => (
            <div key={idx} className="space-y-6 group">
              <div className="w-12 h-[1px] bg-black/10 mx-auto transition-all duration-700 group-hover:w-20 group-hover:bg-black"></div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.6em] text-gray-900 italic">{item.title}</h4>
              <p className="text-[10px] text-gray-400 font-bold leading-[2.2] max-w-[260px] mx-auto uppercase tracking-[0.2em] italic">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Section 02: Latest Acquisitions --- */}
      <NewArrivals products={featuredProducts} loading={loading} />

      {/* --- Section 03: The Philosophy Hub --- */}
      <section className="py-32 md:py-56 bg-[#0a0a0a] text-white relative overflow-hidden">
        {/* Decorative Background Text */}
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
            <h2 className="text-[25vw] font-black italic">ZAQEEN</h2>
        </div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-24 lg:gap-40 relative z-10">
          <div className="w-full lg:w-1/2 relative group">
            <div className="absolute -inset-8 border border-white/5 translate-x-8 translate-y-8 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-1000 ease-out"></div>
            <div className="relative z-10 overflow-hidden aspect-[4/5] bg-neutral-900 shadow-2xl">
                <img 
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070" 
                alt="Zaqeen Philosophy" 
                className="w-full h-full object-cover grayscale opacity-70 group-hover:opacity-100 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-[2.5s] ease-out"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 z-20 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                <span className="text-[9px] font-black uppercase tracking-[0.8em] bg-white text-black px-6 py-4 shadow-2xl italic">The Curator&apos;s Vision</span>
            </div>
          </div>

          <div className="w-full lg:w-1/2 space-y-12">
            <div className="space-y-6">
               <span className="text-[10px] uppercase tracking-[0.8em] text-gray-500 font-black italic block underline decoration-gray-800 underline-offset-8">Statement 001</span>
               <h3 className="text-5xl md:text-8xl font-thin tracking-tighter leading-[0.9] italic uppercase">
                 A state of <br/> <span className="font-black text-white not-italic">Certainty</span>
               </h3>
            </div>
            <p className="text-gray-400 font-bold leading-[2] text-[11px] md:text-xs max-w-md uppercase tracking-[0.3em] opacity-80 italic">
              Zaqeen is not just a label; it’s an archive of identity. We curate garments that reflect your inner conviction—bold, certain, and unapologetically minimal. Every thread is a blueprint of confidence.
            </p>
            <div className="pt-10">
               <Link href="/about" className="group inline-flex items-center gap-6 text-[11px] font-black uppercase tracking-[0.6em] border-b border-white/10 pb-6 hover:border-white transition-all italic">
                  Explore The Legacy <RiArrowRightUpLine className="text-xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500" />
               </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section 04: Visual Social Proof --- */}
      <section className="py-40 bg-white">
         <div className="max-w-[1440px] mx-auto px-6 mb-24 flex flex-col md:flex-row justify-between items-baseline gap-10">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.6em] text-gray-300 font-black block italic">Collective Identity</span>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">In The Moment</h2>
            </div>
            <a href="https://instagram.com/zaqeen.bd" target="_blank" className="group flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.5em] italic hover:text-gray-400 transition-all">
               <RiInstagramLine size={24} className="group-hover:rotate-12 transition-transform" /> @ZaqeenOfficial
            </a>
         </div>

         <div className="max-w-[1440px] mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1974",
              "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1974",
              "https://images.unsplash.com/photo-1598033129183-c4f50c717658?q=80&w=1974",
              "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?q=80&w=2070"
            ].map((url, i) => (
               <div key={i} className="aspect-[3/4] bg-gray-50 overflow-hidden relative group cursor-none">
                  <img 
                    src={url} 
                    alt={`Zaqeen Gallery Article ${i}`} 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" 
                  />
                  {/* Hover Overlay Architecture */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 flex flex-col items-center justify-center space-y-4">
                     <RiInstagramLine className="text-white text-3xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500" />
                     <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white italic">View Acquisition</span>
                  </div>
               </div>
            ))}
         </div>
      </section>
    </main>
  );
}
