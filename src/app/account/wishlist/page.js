'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { HiOutlineHeart, HiOutlineShoppingBag, HiOutlineTrash, HiOutlineArrowNarrowRight } from 'react-icons/hi';

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const { dispatch } = useCart(); // Cart-এ অ্যাড করার জন্য

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userRef = doc(db, 'users', currentUser.uid);
                
                // রিয়েল-টাইম উইশলিস্ট আপডেট
                const unsubWishlist = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setWishlist(doc.data().wishlist || []);
                    }
                    setLoading(false);
                });
                return () => unsubWishlist();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // উইশলিস্ট থেকে রিমুভ করার ফাংশন
    const removeFromWishlist = async (product) => {
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                wishlist: arrayRemove(product)
            });
            toast.success("Article removed from portfolio.");
        } catch (error) {
            toast.error("Error updating archive.");
        }
    };

    // কার্টে অ্যাড করার ফাংশন
    const addToCart = (product) => {
        dispatch({ type: 'ADD_TO_CART', payload: { ...product, quantity: 1 } });
        toast.success("Moved to active acquisition cart.");
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!user) return (
        <div className="py-32 text-center space-y-8">
            <p className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-black italic">Identity Required</p>
            <Link href="/login" className="inline-block bg-black text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em]">
                Enter Vault
            </Link>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 gap-6 border-b border-gray-50 pb-10">
                <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.6em] text-gray-300 font-black italic">Curation</span>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">Saved Portfolio</h1>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-5 py-2 border border-gray-100 italic">
                    Archives: {wishlist.length} Articles
                </div>
            </div>

            {wishlist.length === 0 ? (
                <div className="py-40 flex flex-col items-center text-center border border-dashed border-gray-100 bg-gray-50/20">
                    <HiOutlineHeart className="w-12 h-12 text-gray-100 mb-8" />
                    <p className="text-[10px] uppercase tracking-[0.4em] text-gray-300 font-black italic mb-10">
                        Your architectural portfolio is currently empty.
                    </p>
                    <Link href="/shop" className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] border-b border-black pb-2 hover:text-gray-400 hover:border-gray-200 transition-all">
                        Discover Blueprints <HiOutlineArrowNarrowRight className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {wishlist.map((product) => (
                        <div key={product.id} className="group relative bg-white border border-gray-50 hover:border-black transition-all duration-700 overflow-hidden">
                            {/* Product Image */}
                            <div className="aspect-[3/4] overflow-hidden relative bg-gray-50">
                                <img 
                                    src={product.imageUrl} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                                />
                                {/* Remove Overlay */}
                                <button 
                                    onClick={() => removeFromWishlist(product)}
                                    className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-md text-black opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-black hover:text-white"
                                >
                                    <HiOutlineTrash size={18} />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="p-8 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 italic">Article Identity</p>
                                        <h3 className="text-[11px] font-black uppercase tracking-widest leading-none">{product.name}</h3>
                                    </div>
                                    <p className="text-sm font-black italic tracking-tighter">৳{product.price.toLocaleString()}</p>
                                </div>

                                <button 
                                    onClick={() => addToCart(product)}
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-black text-white text-[9px] font-black uppercase tracking-[0.4em] overflow-hidden relative group/btn active:scale-95 transition-all"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        <HiOutlineShoppingBag size={14} /> Move to Cart
                                    </span>
                                    <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500"></div>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
