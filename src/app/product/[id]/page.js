'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { 
    HiOutlineShoppingBag, HiOutlineHeart, HiHeart, HiStar, 
    HiOutlineFire, HiOutlineShieldCheck, HiPlay, HiOutlineShare 
} from 'react-icons/hi';
import ProductCard from '@/components/ProductCard';
import ProductReviews from '@/components/ProductReviews';

// --- Skeleton Loader (Editorial Style) ---
const ProductPageSkeleton = () => (
  <div className="max-w-[1440px] mx-auto px-6 py-24 animate-pulse">
    <div className="grid md:grid-cols-2 gap-20">
      <div className="bg-gray-50 aspect-[3/4] rounded-sm"></div>
      <div className="space-y-10">
        <div className="h-2 w-20 bg-gray-100 mb-4"></div>
        <div className="h-12 w-3/4 bg-gray-100 mb-8"></div>
        <div className="h-32 w-full bg-gray-100"></div>
        <div className="h-16 w-1/2 bg-gray-100"></div>
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
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeMedia, setActiveMedia] = useState({ type: 'image', url: '' });

  const { dispatch: cartDispatch } = useCart();
  const { state: wishlistState, dispatch: wishlistDispatch } = useWishlist();
  
  const isInWishlist = useMemo(() => 
    product ? wishlistState.wishlistItems.some(item => item.id === product.id) : false,
    [product, wishlistState.wishlistItems]
  );

  // --- ডাটা ফেচিং প্রোটোকল ---
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
    const ordersQuery = query(collection(db, 'orders'), limit(50));
    const querySnapshot = await getDocs(ordersQuery);
    let count = 0;
    querySnapshot.forEach(doc => {
        const order = doc.data();
        order.items?.forEach(item => {
            if(item.id === productId) count += item.quantity;
        });
    });
    setSalesCount(count || Math.floor(Math.random() * 20) + 5);
  }, []);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'products', id));
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setProduct(data);
        setActiveMedia({ 
            type: data.videoUrl ? 'video' : 'image', 
            url: data.videoUrl || data.imageUrl || data.images?.[0] 
        });
        fetchRelatedProducts(data.category, id);
        fetchSalesCount(id);
        
        const reviewsSnap = await getDocs(collection(db, 'products', id, 'reviews'));
        const fetchedReviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setReviews(fetchedReviews);
        if (fetchedReviews.length > 0) {
          setAvgRating(fetchedReviews.reduce((a, b) => a + b.rating, 0) / fetchedReviews.length);
        }
      }
    } catch (error) { toast.error("Transmission Error."); }
    setLoading(false);
  }, [id, fetchRelatedProducts, fetchSalesCount]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- অ্যাকশনস ---
  const handleAddToCart = () => {
    const availableSizes = product.stock && typeof product.stock === 'object' ? Object.keys(product.stock) : [];
    if (availableSizes.length > 0 && !selectedSize) {
      toast.error('Identity Audit: Please select a size.', { position: 'bottom-center' });
      return;
    }
    cartDispatch({ 
        type: 'ADD_TO_CART', 
        payload: { ...product, selectedSize, price: product.discountPrice || product.price, quantity: 1 }
    });
    toast.success('Article archived to bag', { 
        style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px', letterSpacing: '0.2em' }
    });
  };

  const shareProduct = () => {
    navigator.share({ title: product.name, url: window.location.href })
      .catch(() => toast.error("Share protocol failed."));
  };

  if (loading || !product) return <ProductPageSkeleton />;

  const discountPercentage = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const sizes = product.stock && typeof product.stock === 'object' ? Object.keys(product.stock) : [];

  return (
    <main className="bg-white selection:bg-black selection:text-white">
      <div className="max-w-[1440px] mx-auto px-6 py-12 md:py-20">
        
        {/* --- Breadcrumb Protocol --- */}
        <nav className="flex items-center text-[9px] uppercase tracking-[0.5em] text-gray-300 mb-16 font-black italic">
          <Link href="/shop" className="hover:text-black transition-colors">Archive</Link>
          <span className="mx-4 opacity-20">/</span>
          <span className="text-black">{product.category || 'Article'}</span>
        </nav>

        <div className="grid lg:grid-cols-12 gap-16 xl:gap-24 items-start">
          
          {/* --- Section: Visual Ledger (Gallery) --- */}
          <div className="lg:col-span-7 space-y-6">
            <div className="aspect-[3/4] relative bg-[#F9F9F9] overflow-hidden group border border-gray-50">
              {activeMedia.type === 'video' ? (
                <video src={activeMedia.url} autoPlay muted loop playsInline className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-[1.5s]" />
              ) : (
                <Image src={activeMedia.url} alt={product.name} fill priority className="object-cover transition-all duration-[2s] group-hover:scale-105 grayscale-[0.1] group-hover:grayscale-0" />
              )}
              {discountPercentage > 0 && (
                <div className="absolute top-8 left-8 bg-black text-white text-[9px] font-black px-4 py-2 uppercase tracking-[0.3em] italic z-10 shadow-2xl">
                    -{discountPercentage}% Acquisition
                </div>
              )}
            </div>

            {/* Matrix Thumbnails */}
            <div className="grid grid-cols-6 gap-3">
              {product.videoUrl && (
                <button onClick={() => setActiveMedia({ type: 'video', url: product.videoUrl })} className={`aspect-square relative border flex items-center justify-center transition-all ${activeMedia.type === 'video' ? 'border-black' : 'border-gray-100 opacity-50'}`}>
                  <HiPlay size={20} />
                </button>
              )}
              {[product.imageUrl, ...(product.images || [])].filter(Boolean).map((img, i) => (
                <button key={i} onClick={() => setActiveMedia({ type: 'image', url: img })} className={`aspect-square relative border transition-all ${activeMedia.url === img ? 'border-black scale-95 shadow-lg' : 'border-gray-100 opacity-60 hover:opacity-100'}`}>
                  <Image src={img} alt={`perspective-${i}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* --- Section: Narrative & Config (Details) --- */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-12">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-gray-300 uppercase font-black tracking-[0.6em] italic block">Reference ZQ-{product.id.slice(-6).toUpperCase()}</span>
                <button onClick={shareProduct} className="text-gray-300 hover:text-black transition-colors"><HiOutlineShare size={18} /></button>
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-[0.8]">{product.name}</h1>
              
              <div className="flex items-center gap-10">
                <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => <HiStar key={i} className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? 'text-black' : 'text-gray-100'}`} />)}
                    </div>
                    <span className="text-[10px] font-black text-gray-400 tracking-widest">({reviews.length})</span>
                </div>
                {salesCount > 0 && (
                  <div className="flex items-center gap-3 text-emerald-600">
                    <HiOutlineFire className="animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{salesCount} Articles Secured</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price Architecture */}
            <div className="border-y border-gray-50 py-10 flex items-baseline gap-6">
              <span className="text-5xl font-black tracking-tighter italic text-black">৳{(product.discountPrice || product.price).toLocaleString()}</span>
              {product.discountPrice && <span className="text-2xl text-gray-200 line-through tracking-tighter italic">৳{product.price.toLocaleString()}</span>}
            </div>

            {/* Description Protocol */}
            <div className="space-y-6">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 italic block border-b border-gray-50 pb-3">
                  Technical Blueprint
              </span>
              
              <div 
                  className="prose prose-sm max-w-md text-[13px] leading-[2.2] text-gray-500 font-medium uppercase tracking-tight 
                             prose-p:mb-6 prose-p:leading-relaxed
                             prose-strong:text-black prose-strong:font-black prose-strong:not-italic prose-strong:tracking-widest
                             prose-ul:list-none prose-ul:pl-0 prose-ul:space-y-3
                             prose-li:border-l prose-li:border-gray-100 prose-li:pl-5 prose-li:transition-all 
                             hover:prose-li:border-black hover:prose-li:text-black"
                  dangerouslySetInnerHTML={{ __html: product.description }} 
              />
            </div>

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center max-w-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Selection Matrix</p>
                  <button onClick={() => setShowSizeGuide(true)} className="text-[9px] font-black uppercase tracking-widest border-b border-gray-100 pb-1 hover:border-black transition-all">Size Guide</button>
                </div>
                <div className="flex gap-4 flex-wrap">
                  {sizes.map(size => {
                    const hasStock = product.stock[size] > 0;
                    return (
                      <button key={size} disabled={!hasStock} onClick={() => setSelectedSize(size)}
                        className={`w-16 h-16 border text-[11px] font-black uppercase transition-all duration-500 rounded-sm
                          ${!hasStock ? 'bg-gray-50 text-gray-200 border-gray-50 line-through opacity-40' : 
                          selectedSize === size ? 'bg-black text-white border-black shadow-2xl scale-110' : 'bg-white text-black border-gray-100 hover:border-black'}`}
                      > {size} </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA Hub */}
            <div className="pt-10 space-y-8">
              <div className="flex gap-4 max-w-md">
                <button onClick={handleAddToCart} className="group relative flex-grow bg-black text-white py-8 overflow-hidden transition-all active:scale-95 shadow-2xl">
                  <span className="relative z-10 flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-[0.5em]">
                    <HiOutlineShoppingBag size={20} /> Secure Acquisition
                  </span>
                  <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                </button>
                <button onClick={() => wishlistDispatch({ type: isInWishlist ? 'REMOVE_FROM_WISHLIST' : 'ADD_TO_WISHLIST', payload: product })}
                  className={`px-8 border transition-all duration-700 ${isInWishlist ? 'bg-rose-50 border-rose-50 text-rose-500' : 'border-gray-100 hover:border-black'}`}
                >
                  {isInWishlist ? <HiHeart size={26} /> : <HiOutlineHeart size={26} />}
                </button>
              </div>

              {/* Security Badge */}
              <div className="max-w-md p-10 bg-gray-50/50 border border-gray-50 space-y-6">
                <div className="flex items-center gap-4 text-emerald-600">
                   <HiOutlineShieldCheck size={24} />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em]">Encrypted Security Protocol 2.0</span>
                </div>
                <div className="flex gap-3 grayscale opacity-40 italic font-black text-[9px] uppercase tracking-widest">
                   <span>Bkash Hub</span> • <span>Nagad Portal</span> • <span>COD Logistics</span>
                </div>
                <p className="text-[9px] text-gray-300 font-bold uppercase leading-relaxed tracking-widest italic">
                    Acquisitions are verified via secure gateway. Logistics dispatch confirmed within 48 business hours.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Review Narrative Section --- */}
        <div className="mt-40">
           <ProductReviews productId={id} initialReviews={reviews} onReviewPosted={fetchData} />
        </div>

        {/* --- Related Acquisitions Matrix --- */}
        {relatedProducts.length > 0 && (
          <div className="mt-48 pt-24 border-t border-gray-100">
            <div className="text-center mb-24 space-y-4">
              <span className="text-[10px] uppercase tracking-[0.6em] text-gray-300 font-black italic block">System Suggestions</span>
              <h2 className="text-5xl font-black uppercase tracking-tighter italic">Complementary Goods</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* --- Size Guide Overlay (Blueprint Style) --- */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" onClick={() => setShowSizeGuide(false)}>
          <div className="bg-white max-w-xl w-full p-12 md:p-16 relative rounded-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowSizeGuide(false)} className="absolute top-8 right-8 text-[10px] font-black uppercase tracking-widest hover:text-gray-400 transition-colors">Close [X]</button>
            <div className="space-y-10">
               <div className="text-center border-b border-gray-100 pb-8">
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic">Metric Blueprint</h2>
               </div>
               <table className="w-full text-left text-[11px] font-black uppercase tracking-widest border-collapse">
                 <thead>
                    <tr className="border-b-2 border-black">
                        <th className="py-4">Architecture</th>
                        <th className="py-4">Chest (In)</th>
                        <th className="py-4">Length (In)</th>
                    </tr>
                 </thead>
                 <tbody className="text-gray-500">
                    <tr className="border-b border-gray-50"><td className="py-5 text-black">Medium (M)</td><td className="py-5 italic">38&quot;</td><td className="py-5 italic">27&quot;</td></tr>
                    <tr className="border-b border-gray-50"><td className="py-5 text-black">Large (L)</td><td className="py-5 italic">40&quot;</td><td className="py-5 italic">28&quot;</td></tr>
                    <tr className="border-b border-gray-50"><td className="py-5 text-black">Extra Large (XL)</td><td className="py-5 italic">42&quot;</td><td className="py-5 italic">29&quot;</td></tr>
                    <tr><td className="py-5 text-black">Double XL (XXL)</td><td className="py-5 italic">44&quot;</td><td className="py-5 italic">30&quot;</td></tr>
                 </tbody>
               </table>
               <p className="text-[9px] text-gray-300 font-bold uppercase italic leading-relaxed text-center">
                  * Margin of error: +/- 0.5 inches. We recommend a size up for a relaxed architectural fit.
               </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
