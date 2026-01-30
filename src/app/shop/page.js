'use client';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

import ProductCard from '@/components/ProductCard';
import { HiAdjustments, HiOutlineChevronDown, HiOutlineX } from 'react-icons/hi';

function ShopContent() {
  const searchParams = useSearchParams();
  const searchInside = searchParams.get('search');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); // মোবাইল ফিল্টার স্টেট

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
        p.name?.toLowerCase().includes(searchInside.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchInside.toLowerCase())
      );
    }

    if (activeCategory === 'New Arrivals') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      results = results.filter(p => {
          const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
          return createdAt > thirtyDaysAgo;
      });
    } else if (activeCategory !== 'All') {
      results = results.filter(p => p.category === activeCategory);
    }

    if (sortBy === 'low') results.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sortBy === 'high') results.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));

    return results;
  }, [products, searchInside, activeCategory, sortBy]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-[0.5em] text-[9px] font-black italic">Synchronizing Catalog</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white">
      <div className="max-w-[1440px] mx-auto px-6 py-12 md:py-24 animate-fadeIn">
        
        {/* --- Page Header Architecture --- */}
        <div className="flex flex-col lg:flex-row justify-between items-baseline mb-16 gap-10 border-b border-gray-50 pb-12">
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-[0.8em] text-gray-300 font-black italic block">Blueprints</span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">Collections</h1>
            {searchInside && (
              <p className="text-[9px] uppercase font-black tracking-[0.3em] text-gray-400">
                Found in Archives: <span className="text-black">&quot;{searchInside}&quot;</span>
              </p>
            )}
          </div>

          {/* --- Filters & Sorting: Desktop Layout --- */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-10">
            {/* Category Navigation */}
            <nav className="flex items-center gap-8 overflow-x-auto no-scrollbar w-full sm:w-auto py-2">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative text-[10px] uppercase tracking-[0.4em] font-black transition-all pb-2 group whitespace-nowrap ${
                    activeCategory === cat ? 'text-black' : 'text-gray-300 hover:text-black'
                  }`}
                >
                  {cat}
                  <span className={`absolute bottom-0 left-0 h-[2px] bg-black transition-all duration-500 ${activeCategory === cat ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </button>
              ))}
            </nav>

            {/* Functional Tools (Sort & Mobile Trigger) */}
            <div className="flex items-center gap-8 border-t sm:border-t-0 sm:border-l border-gray-100 pt-6 sm:pt-0 sm:pl-10 w-full sm:w-auto justify-between sm:justify-start">
               {/* Sort Protocol */}
               <div className="relative flex items-center group">
                  <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] mr-3">Protocol:</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-transparent text-[10px] uppercase tracking-[0.2em] font-black pr-8 outline-none cursor-pointer text-black italic"
                  >
                    <option value="latest">Latest Drops</option>
                    <option value="low">Investment: Low</option>
                    <option value="high">Investment: High</option>
                  </select>
                  <HiOutlineChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-black pointer-events-none w-3 h-3 transition-transform group-hover:translate-y-[-2px]" />
               </div>

               {/* Mobile Filter Toggle */}
               <button 
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-black px-4 py-2 hover:bg-black hover:text-white transition-all"
               >
                  <HiAdjustments /> Filters
               </button>
            </div>
          </div>
        </div>

        {/* --- Product Matrix --- */}
        <div className="relative min-h-[500px]">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16 md:gap-y-24">
              {filteredProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="animate-fadeIn" 
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-48 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-[1px] bg-gray-100 mb-10"></div>
              <p className="text-[10px] uppercase tracking-[0.6em] text-gray-300 font-black italic">
                Archives Empty for this Query
              </p>
              <button 
                onClick={() => {setActiveCategory('All'); setSortBy('latest')}}
                className="mt-10 px-8 py-4 border border-gray-100 text-[9px] uppercase tracking-[0.4em] font-black hover:bg-black hover:text-white transition-all"
              >
                Reset Archives
              </button>
            </div>
          )}
        </div>

        {/* --- Data Badge: Floating Status --- */}
        <div className="fixed bottom-10 right-10 bg-black text-white px-6 py-4 rounded-sm text-[9px] font-black uppercase tracking-[0.4em] shadow-2xl z-40 hidden lg:flex items-center gap-4 border border-white/10 italic">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
           {filteredProducts.length} Articles Verified
        </div>

        {/* --- Mobile Filter Side Drawer --- */}
        {isMobileFilterOpen && (
            <>
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setIsMobileFilterOpen(false)}></div>
                <div className="fixed right-0 top-0 h-full w-[80%] max-w-sm bg-white z-[110] p-10 animate-slideLeft">
                    <div className="flex justify-between items-center mb-16">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Tools</h3>
                        <button onClick={() => setIsMobileFilterOpen(false)}><HiOutlineX size={24} /></button>
                    </div>
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">Catalog</p>
                            <div className="flex flex-col gap-6">
                                {categories.map(cat => (
                                    <button 
                                        key={cat} 
                                        onClick={() => {setActiveCategory(cat); setIsMobileFilterOpen(false)}}
                                        className={`text-left text-[11px] font-black uppercase tracking-widest ${activeCategory === cat ? 'text-black italic underline' : 'text-gray-400'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )}
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-white">
         <div className="w-6 h-6 border border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
