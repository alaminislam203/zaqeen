'use client';
import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import ProductCard from "./ProductCard";
import Link from "next/link";
import { FiStar, FiTrendingUp, FiBox, FiTag, FiFolder } from 'react-icons/fi';
import { IoSparklesOutline } from "react-icons/io5";

export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleProducts, setVisibleProducts] = useState([]);
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const currentRef = sectionRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, "products"), 
          orderBy("createdAt", "desc"), 
          limit(12)
        );
        const querySnapshot = await getDocs(q);
        const productData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productData);
        setVisibleProducts(productData.slice(0, 8));
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter products
  const handleFilter = (filter) => {
    setActiveFilter(filter);
    
    let filtered = [...products];
    if (filter === 'featured') {
      filtered = products.filter(p => p.featured);
    } else if (filter === 'sale') {
      filtered = products.filter(p => p.discountPrice);
    }
    
    setVisibleProducts(filtered.slice(0, 8));
  };

  const filters = [
    { id: 'all', label: 'All Products', icon: <IoSparklesOutline /> },
    { id: 'featured', label: 'Featured', icon: <FiStar /> },
    { id: 'sale', label: 'On Sale', icon: <FiTrendingUp /> },
  ];

  // Premium Skeleton Loader
  const Skeleton = ({ index }) => (
    <div 
      className="animate-in fade-in slide-in-from-bottom-4 duration-700"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
      </div>
      <div className="pt-5 space-y-3">
        <div className="h-3 bg-gray-200 rounded-full w-1/3 mx-auto animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded-full w-2/3 mx-auto animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded-full w-1/4 mx-auto animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <section 
      ref={sectionRef}
      className="relative bg-gradient-to-b from-white via-gray-50/30 to-white py-20 md:py-32 overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large watermark text */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 opacity-[0.02] select-none">
          <h2 className="text-[12rem] md:text-[18rem] font-black uppercase tracking-tighter whitespace-nowrap">
            New Arrivals
          </h2>
        </div>
        
        {/* Decorative shapes */}
        <div className="absolute top-40 right-10 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-10 w-64 h-64 bg-gradient-to-br from-amber-100/20 to-orange-100/20 rounded-full blur-3xl"></div>
        
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(0,0,0,0.02) 40px, rgba(0,0,0,0.02) 80px)`
          }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        
        {/* Header Section */}
        <div className={`flex flex-col items-center text-center mb-16 transition-all duration-1000 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full mb-6 shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-black">
              Latest Collection
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-gray-900 mb-4">
            New Arrivals
          </h2>
          
          {/* Subheading */}
          <p className="text-sm md:text-base text-gray-600 max-w-2xl font-medium leading-relaxed mb-8">
            Discover our latest curated collection of premium products, handpicked for you
          </p>

          {/* Decorative Divider */}
          <div className="flex items-center gap-4">
            <div className="h-[2px] w-16 bg-gradient-to-r from-transparent to-black rounded-full"></div>
            <div className="w-2 h-2 bg-black rounded-full"></div>
            <div className="h-[2px] w-16 bg-gradient-to-l from-transparent to-black rounded-full"></div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={`flex items-center justify-center gap-3 mb-12 flex-wrap transition-all duration-1000 delay-200 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {filters.map((filter, index) => (
            <button
              key={filter.id}
              onClick={() => handleFilter(filter.id)}
              className={`group relative px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                activeFilter === filter.id
                  ? 'bg-black text-white shadow-lg shadow-black/20 scale-105'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-black hover:text-black'
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <span className="flex items-center gap-2">
                {filter.icon}
                {filter.label}
              </span>
              
              {/* Active indicator line */}
              {activeFilter === filter.id && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full"></span>
              )}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-16">
          {loading 
            ? Array(8).fill(0).map((_, i) => <Skeleton key={i} index={i} />)
            : visibleProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className={`transition-all duration-700 ${
                    isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${300 + index * 100}ms` }}
                >
                  <ProductCard product={product} index={index} />
                </div>
              ))
          }
        </div>

        {/* Empty State */}
        {!loading && visibleProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-sm text-gray-600">Try selecting a different filter</p>
          </div>
        )}
        
        {/* View All Button */}
        <div className={`text-center transition-all duration-1000 delay-700 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <Link 
            href="/shop" 
            className="group relative inline-flex flex-col items-center"
          >
            {/* Main Button */}
            <div className="relative overflow-hidden rounded-xl">
              <span className="relative z-10 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] py-5 px-12 bg-black text-white transition-all duration-500 group-hover:bg-white group-hover:text-black border-2 border-black">
                Explore Collection
                <svg 
                  className="w-5 h-5 transition-transform group-hover:translate-x-2" 
                  fill="none" 
                  strokeWidth="2.5" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>

            {/* Subtitle */}
            <div className="mt-4 flex items-center gap-2">
              <div className="h-[1px] w-8 bg-gray-300"></div>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-semibold group-hover:text-black transition-colors">
                {products.length} Products Available
              </p>
              <div className="h-[1px] w-8 bg-gray-300"></div>
            </div>
          </Link>
        </div>

        {/* Statistics Bar */}
        {!loading && products.length > 0 && (
          <div className={`mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-1000 delay-900 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {[
              { label: 'New Products', value: products.length, icon: FiBox },
              { label: 'On Sale', value: products.filter(p => p.discountPrice).length, icon: FiTag },
              { label: 'Featured', value: products.filter(p => p.featured).length, icon: FiStar },
              { label: 'Categories', value: new Set(products.map(p => p.category)).size, icon: FiFolder },
            ].map((stat, index) => (
              <div 
                key={index}
                className="text-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-black hover:shadow-lg transition-all duration-300 group"
              >
                <stat.icon className="text-3xl mb-2 group-hover:scale-110 transition-transform mx-auto" />
                <div className="text-3xl font-black text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </section>
  );
}