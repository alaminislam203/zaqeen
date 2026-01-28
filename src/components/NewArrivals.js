'use client';
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import ProductCard from "./ProductCard";
import Link from "next/link";

export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, "products"), 
          orderBy("createdAt", "desc"), 
          limit(8)
        );
        const querySnapshot = await getDocs(q);
        const productData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // প্রিমিয়াম স্কেলিটন লোডার (লোডিংয়ের সময় খালি স্ক্রিন দেখাবে না)
  const Skeleton = () => (
    <div className="animate-pulse flex flex-col space-y-4">
      <div className="aspect-[3/4] bg-gray-100 rounded-sm w-full"></div>
      <div className="h-3 bg-gray-100 w-1/3 mx-auto"></div>
      <div className="h-4 bg-gray-100 w-2/3 mx-auto"></div>
      <div className="h-3 bg-gray-100 w-1/4 mx-auto"></div>
    </div>
  );

  return (
    <section className="relative bg-white py-20 md:py-32 overflow-hidden">
      {/* ব্যাকগ্রাউন্ড ডেকোরেশন (Subtle Text) */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-[0.02] pointer-events-none select-none">
        <h2 className="text-[12rem] font-black uppercase tracking-tighter">Zaqeen</h2>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* হেডার সেকশন */}
        <div className="flex flex-col items-center text-center mb-16 md:mb-24">
          <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 mb-4 font-bold">Latest Drops</span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest text-gray-900">
            New Arrivals
          </h2>
          <div className="flex items-center gap-4 mt-6">
            <div className="h-[1px] w-8 bg-gray-200"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-black"></div>
            <div className="h-[1px] w-8 bg-gray-200"></div>
          </div>
        </div>

        {/* প্রোডাক্ট গ্রিড */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16 md:gap-y-20">
          {loading 
            ? Array(8).fill(0).map((_, i) => <Skeleton key={i} />)
            : products.map((product) => (
                <div key={product.id} className="reveal-animation">
                  <ProductCard product={product} />
                </div>
              ))
          }
        </div>
        
        {/* ভিউ অল বাটন - আন্ডারলাইন অ্যানিমেশন সহ */}
        <div className="mt-20 md:mt-28 text-center">
          <Link 
            href="/shop" 
            className="group relative inline-flex flex-col items-center overflow-hidden"
          >
            <span className="text-xs md:text-sm font-black uppercase tracking-[0.4em] py-4 px-8 border border-black group-hover:bg-black group-hover:text-white transition-all duration-500">
              Discover More
            </span>
            {/* নিচে একটি ডেকোরেটিভ লাইন */}
            <div className="mt-4 flex flex-col items-center">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest group-hover:text-black transition-colors">Explorer full collection</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}