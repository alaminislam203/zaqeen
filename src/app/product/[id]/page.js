'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { HiOutlineShoppingBag, HiOutlineHeart, HiHeart, HiStar, HiOutlineFire, HiOutlineShieldCheck, HiPlay } from 'react-icons/hi';
import ProductCard from '@/components/ProductCard';
import ProductReviews from '@/components/ProductReviews';

const ProductPageSkeleton = () => (
  <div className="max-w-7xl mx-auto px-6 py-20 animate-pulse">
    <div className="grid md:grid-cols-2 gap-20">
      <div className="bg-gray-100 aspect-[3/4] rounded-sm"></div>
      <div className="space-y-8">
        <div className="h-4 bg-gray-100 rounded w-1/4"></div>
        <div className="h-12 bg-gray-100 rounded w-3/4"></div>
        <div className="h-20 bg-gray-100 rounded w-full"></div>
      </div>
    </div>
  </div>
);

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  
  // মেইন ভিউ কন্ট্রোল করার জন্য নতুন স্টেট
  const [activeMedia, setActiveMedia] = useState({ type: 'image', url: '' });

  const { dispatch: cartDispatch } = useCart();
  const { state: wishlistState, dispatch: wishlistDispatch } = useWishlist();
  const isInWishlist = product ? wishlistState.wishlistItems.some(item => item.id === product.id) : false;

  const fetchRelatedProducts = useCallback(async (category, currentProductId) => {
    if (!category) return;
    const q = query(collection(db, 'products'), where('category', '==', category), limit(5));
    const querySnapshot = await getDocs(q);
    const products = [];
    querySnapshot.forEach((doc) => {
      if (doc.id !== currentProductId) products.push({ id: doc.id, ...doc.data() });
    });
    setRelatedProducts(products.slice(0, 4)); 
  }, []);

  const fetchSalesCount = useCallback(async (productId) => {
    const ordersQuery = query(collection(db, 'orders'), where('status', 'in', ['Processing', 'Shipped', 'Delivered']));
    const querySnapshot = await getDocs(ordersQuery);
    let count = 0;
    querySnapshot.forEach(doc => {
        const order = doc.data();
        order.items?.forEach(item => {
            if(item.id === productId) count += item.quantity;
        });
    });
    setSalesCount(count);
  }, []);

  const fetchProductAndReviews = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const productData = { id: docSnap.id, ...docSnap.data() };
      setProduct(productData);
      
      // শুরুতে ভিডিও থাকলে ভিডিও দেখাবে, না থাকলে মেইন ইমেজ
      if (productData.videoUrl) {
        setActiveMedia({ type: 'video', url: productData.videoUrl });
      } else {
        setActiveMedia({ type: 'image', url: productData.imageUrl || productData.images?.[0] });
      }

      fetchRelatedProducts(productData.category, id);
      fetchSalesCount(id);
      
      const reviewsRef = collection(db, 'products', id, 'reviews');
      const reviewsSnapshot = await getDocs(reviewsRef);
      const fetchedReviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(fetchedReviews);

      if (fetchedReviews.length > 0) {
        const totalRating = fetchedReviews.reduce((acc, curr) => acc + curr.rating, 0);
        setAvgRating(totalRating / fetchedReviews.length);
      }
    }
    setLoading(false);
  }, [id, fetchRelatedProducts, fetchSalesCount]);

  useEffect(() => { fetchProductAndReviews(); }, [fetchProductAndReviews]);

  const handleAddToCart = () => {
    const sizes = product.stock && typeof product.stock === 'object' ? Object.keys(product.stock) : [];
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Identity Audit: Please select a size.');
      return;
    }

    cartDispatch({ 
        type: 'ADD_TO_CART', 
        payload: { ...product, selectedSize, price: product.discountPrice || product.price }
    });
    toast.success('Article added to bag', { 
        style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px', letterSpacing: '0.2em' }
    });
  };

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      wishlistDispatch({ type: 'REMOVE_FROM_WISHLIST', payload: product });
      toast.success('Removed from Portfolio');
    } else {
      wishlistDispatch({ type: 'ADD_TO_WISHLIST', payload: product });
      toast.success('Archived to Portfolio', { icon: '🖤' });
    }
  };
  
  if (loading || !product) return <ProductPageSkeleton />;

  const discountPercentage = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const availableSizes = product.stock && typeof product.stock === 'object' ? Object.keys(product.stock) : [];

  return (
    <div className="bg-[#FDFDFD] text-black selection:bg-black selection:text-white">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
          
          <nav className="flex items-center text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-16 font-black italic">
            <Link href="/" className="hover:text-black transition-colors">Origin</Link>
            <span className="mx-4">/</span>
            <Link href="/shop" className="hover:text-black transition-colors">Archive</Link>
            {product.category && (
              <>
                <span className="mx-4">/</span>
                <span className="text-black">{product.category}</span>
              </>
            )}
          </nav>

          <div className="grid md:grid-cols-2 gap-20 lg:gap-32 items-start">
            
            {/* --- Updated Gallery Section --- */}
            <div className="space-y-6">
                <div className="aspect-[3/4] relative bg-white border border-gray-50 overflow-hidden group">
                    {activeMedia.type === 'video' ? (
                        <video 
                            src={activeMedia.url} 
                            autoPlay 
                            muted 
                            loop 
                            playsInline
                            className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-[1.5s]"
                        />
                    ) : (
                        <Image 
                            src={activeMedia.url || '/placeholder.svg'}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-[2s] group-hover:scale-110 grayscale-[0.1] group-hover:grayscale-0"
                        />
                    )}

                    {discountPercentage > 0 && (
                        <div className="absolute top-8 left-8 bg-black text-white text-[9px] font-black px-4 py-2 uppercase tracking-widest italic z-10">
                        -{discountPercentage}% Acquisition
                        </div>
                    )}
                </div>

                {/* Thumbnails (Images + Video) */}
                <div className="grid grid-cols-5 gap-3">
                    {/* ভিডিও থাম্বনেইল (যদি থাকে) */}
                    {product.videoUrl && (
                        <button 
                            onClick={() => setActiveMedia({ type: 'video', url: product.videoUrl })}
                            className={`aspect-square relative border flex items-center justify-center bg-gray-50 transition-all ${activeMedia.type === 'video' ? 'border-black scale-95' : 'border-gray-100'}`}
                        >
                            <HiPlay className="w-6 h-6 text-black" />
                            <span className="absolute bottom-1 text-[7px] font-black uppercase tracking-tighter">Motion</span>
                        </button>
                    )}

                    {/* ইমেজেস থাম্বনেইল */}
                    {product.images?.map((img, index) => (
                        <button 
                            key={index}
                            onClick={() => setActiveMedia({ type: 'image', url: img })}
                            className={`aspect-square relative border overflow-hidden transition-all ${activeMedia.url === img ? 'border-black scale-95 shadow-lg' : 'border-gray-100 hover:border-gray-300'}`}
                        >
                            <Image src={img} alt={`view-${index}`} fill className="object-cover" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Narrative */}
            <div className="space-y-12">
              <div className="space-y-4">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-[0.5em] italic block">Article No. {product.id.slice(-6).toUpperCase()}</span>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none italic">{product.name}</h1>
                
                <div className="flex items-center gap-8 pt-4">
                    {reviews.length > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => <HiStar key={i} className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? 'text-black' : 'text-gray-100'}`} />)}
                            </div>
                            <span className="text-[10px] font-black tracking-widest text-gray-400">({reviews.length})</span>
                        </div>
                    )}
                    {salesCount > 0 && (
                        <div className="flex items-center gap-3 bg-emerald-50 px-4 py-1.5 rounded-full">
                            <HiOutlineFire className="w-4 h-4 text-emerald-600 animate-pulse"/>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">{salesCount} Articles Secured</span>
                        </div>
                    )}
                </div>
              </div>

              <div className="flex items-baseline gap-6 border-b border-gray-50 pb-10">
                  {product.discountPrice ? (
                      <>
                          <span className="text-4xl font-black tracking-tighter italic">৳{product.discountPrice.toLocaleString()}</span>
                          <span className="text-xl text-gray-200 line-through tracking-tighter">৳{product.price.toLocaleString()}</span>
                      </>
                  ) : (
                      <span className="text-4xl font-black tracking-tighter italic">৳{product.price.toLocaleString()}</span>
                  )}
              </div>
              
              <div className="space-y-4">
    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
        The Blueprint
    </span>
    {/* dangerouslySetInnerHTML ব্যবহার করে HTML সাপোর্ট যোগ করা হয়েছে */}
    <div 
        className="text-[13px] leading-relaxed text-gray-500 font-medium italic max-w-md prose prose-sm prose-stone"
        dangerouslySetInnerHTML={{ __html: product.description }} 
    />
</div>

              {availableSizes.length > 0 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center max-w-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Select Architecture</p>
                    <button className="text-[8px] font-black uppercase tracking-widest text-gray-400 underline decoration-gray-200 underline-offset-4">Size Guide</button>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {availableSizes.map(size => {
                      const isAvailable = product.stock[size] > 0;
                      return (
                          <button 
                              key={size}
                              onClick={() => isAvailable && setSelectedSize(size)}
                              disabled={!isAvailable}
                              className={`w-14 h-14 border text-[11px] font-black uppercase transition-all duration-500 rounded-sm 
                                  ${!isAvailable ? 'bg-gray-50 text-gray-200 border-gray-50 cursor-not-allowed italic' : ''}
                                  ${selectedSize === size ? 'bg-black text-white border-black shadow-2xl scale-110' : 'bg-white text-black border-gray-100 hover:border-black'}`
                              }
                          >
                              {size}
                          </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-8 space-y-8">
                <div className="flex items-stretch gap-4 max-w-md">
                    <button 
                        onClick={handleAddToCart}
                        className="group relative flex-grow bg-black text-white py-6 overflow-hidden transition-all active:scale-95"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.5em]">
                            <HiOutlineShoppingBag size={20} /> Secure Acquisition
                        </span>
                        <div className="absolute inset-0 bg-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    </button>
                    <button 
                        onClick={handleWishlistToggle}
                        className={`px-6 border transition-all duration-500 ${isInWishlist ? 'bg-black border-black text-white' : 'border-gray-100 hover:border-black'}`}
                    >
                        {isInWishlist ? <HiHeart size={24} /> : <HiOutlineHeart size={24} />}
                    </button>
                </div>

                <div className="max-w-md p-8 bg-gray-50/50 border border-gray-50 space-y-4">
                    <div className="flex items-center gap-4">
                       <HiOutlineShieldCheck className="text-emerald-500 w-5 h-5" />
                       <span className="text-[9px] font-black uppercase tracking-[0.3em]">Acquisition Security Protocol</span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold tracking-widest leading-loose uppercase">
                        Every transaction is logged. fraudulent activity will trigger immediate legal audit. 2-4 business days for logistics.
                    </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-32">
             <ProductReviews productId={id} initialReviews={reviews} onReviewPosted={fetchProductAndReviews} />
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-40 pt-20 border-t border-gray-50">
                <div className="flex flex-col items-center mb-20 space-y-4">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-gray-300 font-black italic">Similar Blueprints</span>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Complementary Goods</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            </div>
          )}
        </div>
    </div>
  );
}
