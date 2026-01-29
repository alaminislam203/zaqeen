'use client';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

import ProductCard from '@/components/ProductCard';
import { HiAdjustments, HiOutlineChevronDown, HiOutlineViewGrid, HiOutlineViewList } from 'react-icons/hi';

function ShopContent() {
  const searchParams = useSearchParams();
  const searchInside = searchParams.get('search');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('latest');

  const categories = ["All", "Clothing", "Accessories", "New Arrivals"];

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredProducts = useMemo(() => {
    let results = [...products];

    if (searchInside) {
      results = results.filter(p => 
        p.title?.toLowerCase().includes(searchInside.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchInside.toLowerCase())
      );
    }

    if (activeCategory === 'New Arrivals') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      results = results.filter(p => p.createdAt && p.createdAt.toDate() > thirtyDaysAgo);
    } else if (activeCategory !== 'All') {
      results = results.filter(p => p.category === activeCategory);
    }

    if (sortBy === 'low') results.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sortBy === 'high') results.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));

    return results;
  }, [products, searchInside, activeCategory, sortBy]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-10 h-[1px] bg-black animate-pulse mb-4"></div>
      <p className="uppercase tracking-[0.5em] text-[9px] font-black italic">Curating Catalog</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-24 animate-fadeIn">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 gap-6 border-b border-gray-50 pb-12">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Discover</span>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">Collections</h1>
            {searchInside && (
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                Results for: <span className="text-black italic">&quot;{searchInside}&quot;</span>
              </p>
            )}
          </div>

          {/* Desktop Filters & Sorting */}
          <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-8">
            {/* Category Tabs */}
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative text-[10px] uppercase tracking-[0.2em] font-black transition-all pb-1 group ${
                    activeCategory === cat ? 'text-black' : 'text-gray-300 hover:text-black'
                  }`}
                >
                  {cat}
                  <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-black transition-transform duration-300 origin-left ${activeCategory === cat ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                </button>
              ))}
            </div>

            {/* Custom Styled Sort */}
            <div className="flex items-center gap-4 border-l border-gray-100 pl-8 h-8">
               <div className="relative flex items-center group">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-2">Sort:</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-transparent text-[10px] uppercase tracking-widest font-black pr-6 outline-none cursor-pointer text-gray-900"
                  >
                    <option value="latest">Latest Drops</option>
                    <option value="low">Price (Min - Max)</option>
                    <option value="high">Price (Max - Min)</option>
                  </select>
                  <HiOutlineChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-3 h-3 transition-transform group-hover:translate-y-0" />
               </div>
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="relative min-h-[400px]">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 md:gap-x-10 gap-y-16 md:gap-y-24">
              {filteredProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="reveal-animation" 
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-40 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                 <HiAdjustments className="w-6 h-6 text-gray-200" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-black italic">
                Our archives couldn&apos;t find a match
              </p>
              <button 
                onClick={() => {setActiveCategory('All'); setSortBy('latest')}}
                className="mt-6 text-[9px] uppercase tracking-[0.2em] underline font-bold hover:text-gray-500"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Floating Result Counter (Subtle Luxury Touch) */}
        <div className="fixed bottom-10 right-10 bg-black text-white px-5 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl z-40 hidden md:flex items-center gap-3 border border-white/10">
           <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
           {filteredProducts.length} Items Selected
        </div>
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <>
      
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center">
           <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <ShopContent />
      </Suspense>
    </>
  );
}
