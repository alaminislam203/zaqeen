'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';

import Hero from '@/components/Hero';
import NewArrivals from '@/components/NewArrivals';
import Link from 'next/link';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), limit(4));
    const unsub = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeaturedProducts(productsData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white">
    
      <Hero />

      <section className="py-16 md:py-24 border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {[
            { title: "Premium Quality", desc: "Crafted with the finest fabrics for ultimate comfort." },
            { title: "Modern Aesthetic", desc: "Minimal designs that make a maximum statement." },
            { title: "Ethical Belief", desc: "Confidence rooted in certainty and self-expression." }
          ].map((item, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-900">{item.title}</h4>
              <p className="text-xs text-gray-400 font-light leading-relaxed max-w-[250px] mx-auto uppercase tracking-tighter">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <NewArrivals />

      <section className="py-24 md:py-32 bg-[#0a0a0a] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16 md:gap-24">
          <div className="w-full md:w-1/2 relative group">
            <div className="absolute -inset-4 border border-white/10 translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700"></div>
            <img 
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070" 
              alt="The Spirit" 
              className="relative z-10 w-full h-[500px] object-cover grayscale hover:grayscale-0 transition-all duration-1000"
            />
          </div>
          <div className="w-full md:w-1/2 space-y-8">
            <span className="text-[10px] uppercase tracking-[0.5em] text-gray-500 font-bold">The Philosophy</span>
            <h3 className="text-3xl md:text-5xl font-extralight tracking-tight leading-tight">
              A state of <span className="font-black italic">Certainty</span> in who you are.
            </h3>
            <p className="text-gray-400 font-light leading-relaxed text-sm md:text-lg">
              Zaqeen is not just a brand; it’s an identity. We believe that what you wear should reflect your inner strength—bold, certain, and unapologetic.
            </p>
            <div className="pt-6">
               <Link href="/about">
                <button className="text-xs font-bold uppercase tracking-[0.4em] border-b-2 border-white pb-2 hover:text-gray-400 hover:border-gray-400 transition-all">
                  Learn our story
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
         <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-widest">In the Moment</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2">Follow @ZaqeenOfficial</p>
            </div>
         </div>
         
      </section>

     
    </main>
  );
}