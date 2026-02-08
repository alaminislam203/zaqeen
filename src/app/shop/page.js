'use client';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import ProductCard from '@/components/ProductCard';

function ShopContent() {
  const searchParams = useSearchParams();
  const searchInside = searchParams.get('search');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [viewMode, setViewMode] = useState('grid-4'); // grid-3, grid-4, grid-5
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Get unique categories and tags
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    return ['All', ...cats, 'New Arrivals'];
  }, [products]);

  const allTags = useMemo(() => {
    const tags = new Set();
    products.forEach(p => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [products]);

  // Price range from products
  const productPriceRange = useMemo(() => {
    if (products.length === 0) return [0, 10000];
    const prices = products.map(p => p.price || 0);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let results = [...products];

    // Search filter
    if (searchInside) {
      results = results.filter(p => 
        p.name?.toLowerCase().includes(searchInside.toLowerCase()) ||
        p.title?.toLowerCase().includes(searchInside.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchInside.toLowerCase()) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchInside.toLowerCase()))
      );
    }

    // Category filter
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

    // Price range filter
    results = results.filter(p => {
      const price = p.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Tags filter
    if (selectedTags.length > 0) {
      results = results.filter(p => 
        p.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    // Sorting
    if (sortBy === 'low') results.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (sortBy === 'high') results.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sortBy === 'popular') results.sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0));
    else if (sortBy === 'name') results.sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''));

    return results;
  }, [products, searchInside, activeCategory, sortBy, priceRange, selectedTags]);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setActiveCategory('All');
    setSortBy('latest');
    setPriceRange(productPriceRange);
    setSelectedTags([]);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeCategory !== 'All') count++;
    if (selectedTags.length > 0) count += selectedTags.length;
    if (priceRange[0] !== productPriceRange[0] || priceRange[1] !== productPriceRange[1]) count++;
    return count;
  }, [activeCategory, selectedTags, priceRange, productPriceRange]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="uppercase tracking-[0.4em] text-[9px] font-black text-gray-400 mt-6">Loading Catalog...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 selection:bg-black selection:text-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-20">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-8">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black block">Product Collection</span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter">Shop</h1>
              {searchInside && (
                <p className="text-[10px] uppercase font-bold tracking-wide text-gray-500 mt-3">
                  Search results for: <span className="text-black font-black">&quot;{searchInside}&quot;</span>
                </p>
              )}
            </div>

            {/* View Mode & Filter Toggle */}
            <div className="flex items-center gap-4">
              {/* Grid View Options */}
              <div className="hidden lg:flex gap-1 bg-white border border-gray-200 p-1">
                {[
                  { id: 'grid-3', cols: 3, icon: 'M4 6h16M4 12h16M4 18h16' },
                  { id: 'grid-4', cols: 4, icon: 'M3 6h18M3 12h18M3 18h18' },
                  { id: 'grid-5', cols: 5, icon: 'M2 6h20M2 12h20M2 18h20' }
                ].map(view => (
                  <button
                    key={view.id}
                    onClick={() => setViewMode(view.id)}
                    className={`p-2 transition-all ${
                      viewMode === view.id 
                        ? 'bg-black text-white' 
                        : 'text-gray-600 hover:text-black'
                    }`}
                    title={`${view.cols} columns`}
                  >
                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={view.icon} />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-black transition-all text-[10px] font-black uppercase tracking-wide"
              >
                <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                Filters
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 bg-black text-white text-[8px] font-black">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Mobile Filter */}
              <button 
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-wide"
              >
                <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filter
              </button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? 'bg-black text-white' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters (Desktop) */}
          {showFilters && (
            <aside className="hidden lg:block w-72 flex-shrink-0 space-y-6">
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[11px] font-black uppercase tracking-wide">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-[9px] font-bold uppercase tracking-wide text-red-500 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Price Range */}
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <p className="text-[9px] font-black uppercase tracking-wide text-gray-600 mb-4">Price Range</p>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min={productPriceRange[0]}
                      max={productPriceRange[1]}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-black"
                    />
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span>৳{priceRange[0]}</span>
                      <span>৳{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {allTags.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wide text-gray-600 mb-4">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-all ${
                            selectedTags.includes(tag)
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Options */}
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-[9px] font-black uppercase tracking-wide text-gray-600 mb-4">Sort By</p>
                <div className="space-y-2">
                  {[
                    { value: 'latest', label: 'Latest' },
                    { value: 'popular', label: 'Most Popular' },
                    { value: 'low', label: 'Price: Low to High' },
                    { value: 'high', label: 'Price: High to Low' },
                    { value: 'name', label: 'Name: A-Z' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                        sortBy === option.value
                          ? 'bg-black text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Info */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
                {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''} Found
              </p>
              
              {/* Mobile Sort */}
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="lg:hidden px-4 py-2 bg-white border border-gray-200 text-[9px] font-black uppercase tracking-wide outline-none cursor-pointer"
              >
                <option value="latest">Latest</option>
                <option value="popular">Popular</option>
                <option value="low">Price: Low</option>
                <option value="high">Price: High</option>
                <option value="name">Name: A-Z</option>
              </select>
            </div>

            {filteredProducts.length > 0 ? (
              <div 
                className={`grid gap-6 ${
                  viewMode === 'grid-3' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                  viewMode === 'grid-5' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
                  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}
              >
                {filteredProducts.map((product, index) => (
                  <div 
                    key={product.id} 
                    className="animate-fadeIn" 
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center">
                <svg className="w-24 h-24 mx-auto text-gray-200 mb-6" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-black mb-4">
                  No products found
                </p>
                <p className="text-[9px] text-gray-400 mb-8">
                  Try adjusting your filters or search terms
                </p>
                <button 
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-black text-white text-[10px] uppercase tracking-wide font-black hover:bg-neutral-800 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Results Badge */}
        {filteredProducts.length > 0 && (
          <div className="fixed bottom-8 right-8 bg-black text-white px-6 py-3 shadow-2xl z-40 hidden lg:flex items-center gap-3 text-[9px] font-black uppercase tracking-wide">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Mobile Filter Drawer */}
        {isMobileFilterOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
              onClick={() => setIsMobileFilterOpen(false)}
            ></div>
            <div className="fixed right-0 top-0 h-full w-[85%] max-w-sm bg-white z-[110] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
                  <h3 className="text-xl font-black uppercase tracking-tight">Filters</h3>
                  <button onClick={() => setIsMobileFilterOpen(false)}>
                    <svg className="w-6 h-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Categories */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wide text-gray-600 mb-4">Categories</p>
                    <div className="space-y-2">
                      {categories.map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => {
                            setActiveCategory(cat);
                            setIsMobileFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide transition-all ${
                            activeCategory === cat 
                              ? 'bg-black text-white' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wide text-gray-600 mb-4">Price Range</p>
                    <div className="space-y-4">
                      <input
                        type="range"
                        min={productPriceRange[0]}
                        max={productPriceRange[1]}
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full accent-black"
                      />
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span>৳{priceRange[0]}</span>
                        <span>৳{priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {allTags.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wide text-gray-600 mb-4">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => handleTagToggle(tag)}
                            className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-all ${
                              selectedTags.includes(tag)
                                ? 'bg-black text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clear Button */}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => {
                        clearAllFilters();
                        setIsMobileFilterOpen(false);
                      }}
                      className="w-full px-6 py-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-wide hover:bg-red-600 transition-all"
                    >
                      Clear All Filters
                    </button>
                  )}
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
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}