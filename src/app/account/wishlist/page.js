"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { HiOutlineTrash, HiOutlineShoppingBag, HiOutlineArrowNarrowRight } from "react-icons/hi";
import toast from 'react-hot-toast';

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const q = query(collection(db, "users", currentUser.uid, "wishlist"));
        const unsub = onSnapshot(q, (querySnapshot) => {
          setWishlistItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        });
        return () => unsub();
      } else {
        setUser(null);
        setWishlistItems([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const removeItem = async (itemId) => {
    try {
      if (auth.currentUser) {
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "wishlist", itemId));
        toast.success("Removed from wishlist");
      }
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-400">Loading Favorites</p>
    </div>
  );
  
  if (!user) return (
    <div className="max-w-md mx-auto py-20 text-center">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-8 font-bold italic">Identity Required to View Favorites</p>
      <Link href="/login" className="block w-full bg-black text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-gray-900 transition-all">
        Login to Account
      </Link>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      {/* Header Section */}
      <div className="flex justify-between items-baseline mb-12 border-b border-gray-50 pb-8">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold">Personal Vault</span>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">Wishlist</h1>
        </div>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black italic">
          {wishlistItems.length} {wishlistItems.length === 1 ? 'Masterpiece' : 'Pieces'} Saved
        </p>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {wishlistItems.map((item) => (
            <div key={item.id} className="group relative bg-white transition-all duration-500">
              {/* Product Image Wrapper */}
              <div className="relative aspect-[3/4] overflow-hidden bg-[#f9f9f9] rounded-sm">
                <Link href={`/product/${item.productId}`}>
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0" 
                  />
                </Link>
                
                {/* Remove Action - Floating Top Right */}
                <button 
                  onClick={() => removeItem(item.id)}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full text-gray-400 hover:text-rose-500 hover:scale-110 transition-all duration-300 z-20 shadow-sm border border-gray-100"
                  title="Remove from favorites"
                >
                  <HiOutlineTrash size={16} />
                </button>

                {/* Quick View Overlay (Mobile Friendly) */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>

              {/* Product Content */}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 leading-relaxed truncate pr-4">
                    {item.title}
                  </h3>
                  <p className="text-[11px] font-bold tracking-tighter text-gray-800 italic">৳{item.price}</p>
                </div>
                
                <div className="pt-4">
                   <Link 
                    href={`/product/${item.productId}`} 
                    className="group/btn flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-all"
                   >
                     View Masterpiece 
                     <HiOutlineArrowNarrowRight className="text-lg transition-transform group-hover/btn:translate-x-1.5" />
                   </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center text-center bg-gray-50/50 border border-dashed border-gray-100 rounded-sm">
          <HiOutlineShoppingBag className="w-12 h-12 text-gray-200 mb-6" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-black italic mb-10">
            Your personal curation is currently empty
          </p>
          <Link href="/shop" className="text-[10px] font-black uppercase tracking-[0.3em] border-b border-black pb-1 hover:text-gray-500 hover:border-gray-200 transition-all">
            Browse Collections
          </Link>
        </div>
      )}
    </div>
  );
}