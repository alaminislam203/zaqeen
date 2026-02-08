'use client';
import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, limit, orderBy } from "firebase/firestore";
import Link from "next/link";
import { debounce } from "lodash";

export default function SearchBar({ onFocus, onBlur, autoFocus = false }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    }
  }, []);

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch all products
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const q = query(collection(db, "products"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setAllProducts(data);

        // Get popular products (you can modify this logic)
        const popular = data
          .filter(p => p.featured || p.bestseller)
          .slice(0, 4);
        setPopularProducts(popular);
      } catch (error) {
        console.error("Search fetch error:", error);
      }
    };
    fetchAllProducts();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term) => {
      if (term.trim() === "") {
        setFilteredResults([]);
        setIsLoading(false);
        return;
      }

      const results = allProducts.filter(product =>
        product.title?.toLowerCase().includes(term.toLowerCase()) ||
        product.category?.toLowerCase().includes(term.toLowerCase()) ||
        product.description?.toLowerCase().includes(term.toLowerCase())
      );
      
      setFilteredResults(results.slice(0, 6));
      setIsLoading(false);
    }, 300),
    [allProducts]
  );

  // Handle search input change
  useEffect(() => {
    if (searchTerm.trim() !== "") {
      setIsLoading(true);
      debouncedSearch(searchTerm);
      setShowDropdown(true);
    } else {
      setFilteredResults([]);
      setIsLoading(false);
    }
  }, [searchTerm, debouncedSearch]);

  // Save to recent searches
  const saveToRecentSearches = (term) => {
    if (typeof window === 'undefined' || !term.trim()) return;
    
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('recentSearches');
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const resultsCount = filteredResults.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < resultsCount - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selected = filteredResults[selectedIndex];
      if (selected) {
        window.location.href = `/product/${selected.id}`;
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (searchTerm || recentSearches.length > 0 || popularProducts.length > 0) {
      setShowDropdown(true);
    }
    onFocus?.();
  };

  const handleBlur = () => {
    onBlur?.();
  };

  return (
    <div className="relative w-full group" ref={searchRef}>
      {/* Search Input */}
      <div className="relative flex items-center bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-black focus-within:bg-white focus-within:shadow-lg transition-all duration-300">
        {/* Search Icon */}
        <div className="absolute left-4 flex items-center justify-center pointer-events-none">
          <svg 
            className={`w-5 h-5 transition-colors ${
              searchTerm ? 'text-black' : 'text-gray-400'
            }`} 
            fill="none" 
            strokeWidth="2" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products, categories..."
          className="w-full py-3 pl-12 pr-12 outline-none bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />

        {/* Loading Spinner / Clear Button */}
        <div className="absolute right-4 flex items-center justify-center">
          {isLoading ? (
            <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : searchTerm ? (
            <button 
              onClick={handleClear}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors group"
            >
              <svg className="w-4 h-4 text-gray-500 group-hover:text-black transition-colors" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-300 max-h-[500px] overflow-y-auto">
          
          {/* Search Results */}
          {searchTerm && (
            <>
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="animate-spin w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Searching...</p>
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="p-3">
                  <div className="px-3 py-2 mb-2">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                      Found {filteredResults.length} {filteredResults.length === 1 ? 'Result' : 'Results'}
                    </h3>
                  </div>
                  
                  {/* Results List */}
                  <div className="space-y-1">
                    {filteredResults.map((product, index) => {
                      const productImg = product.imageUrl || (product.images && product.images[0]) || "/placeholder.png";
                      return (
                        <Link 
                          key={product.id} 
                          href={`/product/${product.id}`}
                          onClick={() => {
                            saveToRecentSearches(product.title);
                            setShowDropdown(false);
                          }}
                          className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${
                            index === selectedIndex 
                              ? 'bg-gray-100 scale-[1.02]' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shrink-0 border border-gray-200 shadow-sm">
                            <img 
                              src={productImg} 
                              alt={product.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate mb-1 group-hover:text-black transition-colors">
                              {product.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {product.category && (
                                <span className="text-[10px] text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                                  {product.category}
                                </span>
                              )}
                              <span className="text-sm font-black text-gray-900">
                                ৳{product.price}
                              </span>
                            </div>
                          </div>

                          {/* Arrow Icon */}
                          <svg 
                            className="w-5 h-5 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0" 
                            fill="none" 
                            strokeWidth="2.5" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Link>
                      );
                    })}
                  </div>
                  
                  {/* View All Button */}
                  <Link 
                    href={`/shop?search=${searchTerm}`}
                    onClick={() => {
                      saveToRecentSearches(searchTerm);
                      setShowDropdown(false);
                    }}
                    className="mt-3 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider bg-black text-white hover:bg-gray-900 rounded-xl transition-all shadow-lg hover:shadow-xl group"
                  >
                    View All Results
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">No Results Found</h4>
                  <p className="text-xs text-gray-500">
                    Try searching with different keywords
                  </p>
                </div>
              )}
            </>
          )}

          {/* Recent Searches & Popular Products (when no search term) */}
          {!searchTerm && (
            <div className="p-3 space-y-4">
              
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-3 py-2 mb-2">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                      Recent Searches
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[9px] font-bold text-gray-400 hover:text-black uppercase tracking-wider transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchTerm(search);
                          inputRef.current?.focus();
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left group"
                      >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">
                          {search}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Products */}
              {popularProducts.length > 0 && (
                <div>
                  <div className="px-3 py-2 mb-2">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                      Popular Products
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {popularProducts.map((product) => {
                      const productImg = product.imageUrl || (product.images && product.images[0]) || "/placeholder.png";
                      return (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          onClick={() => setShowDropdown(false)}
                          className="flex flex-col gap-2 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                        >
                          <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                            <img 
                              src={productImg} 
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-gray-900 truncate">
                              {product.title}
                            </h4>
                            <p className="text-xs font-bold text-black mt-1">
                              ৳{product.price}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {recentSearches.length === 0 && popularProducts.length === 0 && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Start Searching</h4>
                  <p className="text-xs text-gray-500">
                    Find your favorite products
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}