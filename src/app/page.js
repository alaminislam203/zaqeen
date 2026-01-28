'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';

import Hero from '@/components/Hero';
import NewArrivals from '@/components/NewArrivals';
import Link from 'next/link';
import Image from 'next/image';
import { RiInstagramLine, RiArrowRightUpLine } from 'react-icons/ri';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // অর্ডারিং যোগ করা হয়েছে যাতে লেটেস্ট প্রোডাক্ট আগে আসে
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(4));
    const unsub = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeaturedProducts(productsData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white overflow-x-hidden">
    
      <Hero />

      {/* Brand Value Props - Minimalist Design */}
      <section className="py-20 md:py-32 border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
          {[
            { title: "Premium Quality", desc: "Crafted with the finest fibers for ultimate permanence." },
            { title: "Modern Aesthetic", desc: "Minimalist blueprints that command maximum attention." },
            { title: "Ethical Belief", desc: "Confidence rooted in certainty and curated expression." }
          ].map((item, idx) => (
            <div key={idx} className="space-y-4 group">
              <div className="w-1 h-1 bg-black mx-auto mb-6 scale-0 group-hover:scale-100 transition-transform duration-500"></div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-900 italic">{item.title}</h4>
              <p className="text-[10px] text-gray-400 font-bold leading-loose max-w-[220px] mx-auto uppercase tracking-[0.1em]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <NewArrivals />

      {/* Philosophy Section - Cinematic Layout */}
      <section className="py-24 md:py-48 bg-[#0a0a0a] text-white relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-20 md:gap-32">
          
          {/* Image Container with Framing */}
          <div className="w-full md:w-1/2 relative group">
            <div className="absolute -inset-6 border border-white/5 translate-x-6 translate-y-6 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-1000 ease-out"></div>
            <div className="relative z-10 overflow-hidden aspect-[4/5] bg-neutral-900">
               <img 
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070" 
                alt="Zaqeen Spirit" 
                className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:scale-110 group-hover:grayscale-0 transition-all duration-[2s] ease-out"
              />
            </div>
            <div className="absolute bottom-10 left-10 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <span className="text-[8px] font-black uppercase tracking-[0.8em] bg-white text-black px-4 py-2">The Curator</span>
            </div>
          </div>

          {/* Text Content */}
          <div className="w-full md:w-1/2 space-y-10">
            <div className="space-y-4">
               <span className="text-[10px] uppercase tracking-[0.6em] text-gray-500 font-black italic block">The Philosophy</span>
               <h3 className="text-4xl md:text-7xl font-extralight tracking-tighter leading-none italic uppercase">
                 A state of <br/> <span className="font-black text-white not-italic">Certainty</span>
               </h3>
            </div>
            
            <p className="text-gray-400 font-medium leading-relaxed text-sm md:text-base max-w-md uppercase tracking-widest opacity-80">
              Zaqeen is not just a label; it’s an archive of identity. We curate garments that reflect your inner conviction—bold, certain, and unapologetically minimal.
            </p>

            <div className="pt-8">
               <Link href="/about" className="group inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] border-b border-white/20 pb-4 hover:border-white transition-all">
                  The Zaqeen Legacy <RiArrowRightUpLine className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
               </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social / Instagram Grid Concept */}
      <section className="py-32 bg-white">
         <div className="max-w-7xl mx-auto px-6 mb-20 flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold block italic">Collective Identity</span>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">In the Moment</h2>
            </div>
            <a href="#" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] hover:text-gray-400 transition-colors">
               <RiInstagramLine size={20} /> @ZaqeenOfficial
            </a>
         </div>

         {/* Grid Placeholders for Social Proof */}
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
               <div key={i} className="aspect-square bg-gray-50 overflow-hidden relative group cursor-pointer">
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                     <RiInstagramLine className="text-white text-2xl" />
                  </div>
                  <div className="w-full h-full bg-neutral-100 animate-pulse group-hover:scale-110 transition-transform duration-1000"></div>
               </div>
            ))}
         </div>
      </section>

    </main>
  );
}
