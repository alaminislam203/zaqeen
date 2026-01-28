'use client';
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import Link from "next/link";
import { HiOutlineSearch, HiOutlineX, HiArrowRight } from "react-icons/hi";

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // বাইরের ক্লিকে ড্রপডাউন বন্ধ করা
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const q = query(collection(db, "products"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllProducts(data);
      } catch (error) {
        console.error("Search fetch error:", error);
      }
    };
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredResults([]);
      setShowDropdown(false);
      return;
    }

    const results = allProducts.filter(product =>
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredResults(results.slice(0, 4)); 
    setShowDropdown(true);
  }, [searchTerm, allProducts]);

  return (
    <div className="relative w-full group" ref={searchRef}>
      {/* Input Container */}
      <div className="relative flex items-center bg-gray-50/50 rounded-full border border-transparent focus-within:border-black/10 focus-within:bg-white focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300">
        <input
          type="text"
          placeholder="SEARCH PRODUCTS..."
          className="w-full py-2.5 pl-5 pr-12 outline-none bg-transparent text-[11px] font-medium uppercase tracking-[0.15em] text-gray-800 placeholder:text-gray-400 placeholder:font-light"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm && setShowDropdown(true)}
        />
        <div className="absolute right-4 flex items-center justify-center">
          {searchTerm ? (
            <button 
              onClick={() => { setSearchTerm(""); setShowDropdown(false); }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <HiOutlineX className="text-gray-500 w-4 h-4" />
            </button>
          ) : (
            <HiOutlineSearch className="text-gray-400 w-4 h-4" />
          )}
        </div>
      </div>

      {/* Floating Dropdown */}
      {showDropdown && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-50 overflow-hidden z-[110] animate-fadeIn">
          {filteredResults.length > 0 ? (
            <div className="p-2">
              <div className="px-3 py-2 border-b border-gray-50">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Top Results</span>
              </div>
              
              {filteredResults.map((product) => {
                const productImg = product.imageUrl || (product.images && product.images[0]) || "/placeholder.png";
                return (
                  <Link 
                    key={product.id} 
                    href={`/product/${product.id}`}
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-all duration-300 group/item"
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-50">
                      <img 
                        src={productImg} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-bold uppercase tracking-tight text-gray-900 truncate">
                        {product.title}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-gray-500 font-medium">৳{product.price}</p>
                        <HiArrowRight className="w-3 h-3 text-gray-300 -translate-x-2 opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-100 transition-all" />
                      </div>
                    </div>
                  </Link>
                );
              })}
              
              <Link 
                href={`/shop?search=${searchTerm}`}
                onClick={() => setShowDropdown(false)}
                className="mt-2 flex items-center justify-center gap-2 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] bg-gray-950 text-white hover:bg-black rounded-xl transition-all shadow-lg shadow-black/10 mx-2 mb-2"
              >
                View all results
              </Link>
            </div>
          ) : searchTerm && (
            <div className="p-10 text-center">
              <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                 <HiOutlineSearch className="text-gray-300 w-6 h-6" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No products found</p>
              <p className="text-[9px] text-gray-300 mt-1 italic">Try searching for something else</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}