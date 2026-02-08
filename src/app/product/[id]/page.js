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
import ProductCard from '@/components/ProductCard';
import ProductReviews from '@/components/ProductReviews';

// Premium Skeleton Loader
const ProductPageSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-20">
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
      <div className="space-y-4 animate-pulse">
        <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl"></div>
        <div className="grid grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
      <div className="space-y-8 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
        <div className="h-16 w-3/4 bg-gray-200 rounded"></div>
        <div className="h-24 w-full bg-gray-200 rounded"></div>
        <div className="h-12 w-1/2 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's',
  'ul', 'ol', 'li', 'blockquote',
  'h1', 'h2', 'h3', 'h4',
  'span', 'div', 'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td'
]);

const ALLOWED_ATTRS = {
  a: new Set(['href', 'target', 'rel', 'title']),
  img: new Set(['src', 'alt', 'title'])
};

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeHtml = (rawHtml) => {
  if (!rawHtml || typeof rawHtml !== 'string') return '';
  if (typeof window === 'undefined' || !window.DOMParser) return escapeHtml(rawHtml);

  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  const nodesToRemove = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const tag = node.tagName?.toLowerCase?.() || '';

    if (!ALLOWED_TAGS.has(tag)) {
      nodesToRemove.push(node);
      continue;
    }

    const allowed = ALLOWED_ATTRS[tag] || new Set();
    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value || '';

      if (!allowed.has(name) || name.startsWith('on') || /javascript:/i.test(value)) {
        node.removeAttribute(attr.name);
        return;
      }
    });

    if (tag === 'a') {
      const href = node.getAttribute('href') || '';
      if (!/^https?:\/\//i.test(href) && !href.startsWith('/')) {
        node.removeAttribute('href');
      }
      if (node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
  }

  nodesToRemove.forEach((node) => node.replaceWith(doc.createTextNode(node.textContent || '')));
  return doc.body.innerHTML;
};

const formatDescription = (description) => {
  if (!description) return '';
  const hasTags = /<\/?[a-z][\s\S]*>/i.test(description);
  if (hasTags) return sanitizeHtml(description);
  return escapeHtml(description).replace(/\n/g, '<br />');
};

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeMedia, setActiveMedia] = useState({ type: 'image', url: '', index: 0 });
  const [activeTab, setActiveTab] = useState('description');
  const [imageLoading, setImageLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);

  const { dispatch: cartDispatch } = useCart();
  const { state: wishlistState, dispatch: wishlistDispatch } = useWishlist();
  
  const isInWishlist = useMemo(() => 
    product ? wishlistState.wishlistItems.some(item => item.id === product.id) : false,
    [product, wishlistState.wishlistItems]
  );

  // Fetch related products
  const fetchRelatedProducts = useCallback(async (category, currentProductId) => {
    if (!category) return;
    const q = query(
      collection(db, 'products'), 
      where('category', '==', category), 
      limit(5)
    );
    const querySnapshot = await getDocs(q);
    const products = [];
    querySnapshot.forEach((doc) => {
      if (doc.id !== currentProductId) {
        products.push({ id: doc.id, ...doc.data() });
      }
    });
    setRelatedProducts(products.slice(0, 4));
  }, []);

  // Fetch sales count
  const fetchSalesCount = useCallback(async (productId) => {
<<<<<<< HEAD
    const ordersQuery = query(collection(db, 'orders'), limit(50));
=======
    const ordersQuery = query(collection(db, 'orders'), limit(100));
>>>>>>> e74bc1f (Initial commit)
    const querySnapshot = await getDocs(ordersQuery);
    let count = 0;
    querySnapshot.forEach(doc => {
      const order = doc.data();
      order.items?.forEach(item => {
        if(item.id === productId) count += item.quantity;
      });
    });
<<<<<<< HEAD
    setSalesCount(count || Math.floor(Math.random() * 20) + 5);
=======
    setSalesCount(count || Math.floor(Math.random() * 50) + 10);
>>>>>>> e74bc1f (Initial commit)
  }, []);

  // Main fetch function
  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    
    try {
      const docSnap = await getDoc(doc(db, 'products', id));
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setProduct(data);
        
        const initialUrl = data.videoUrl || data.imageUrl || data.images?.[0];
        setActiveMedia({ 
          type: data.videoUrl ? 'video' : 'image', 
          url: initialUrl,
          index: 0
        });
        
        fetchRelatedProducts(data.category, id);
        fetchSalesCount(id);
        
        // Fetch reviews
        const reviewsSnap = await getDocs(collection(db, 'products', id, 'reviews'));
        const fetchedReviews = reviewsSnap.docs.map(d => ({ 
          id: d.id, 
          ...d.data() 
        }));
        setReviews(fetchedReviews);
        
        if (fetchedReviews.length > 0) {
          const avg = fetchedReviews.reduce((a, b) => a + b.rating, 0) / fetchedReviews.length;
          setAvgRating(avg);
        }
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [id, fetchRelatedProducts, fetchSalesCount]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // Add to cart handler
  const handleAddToCart = () => {
    const availableSizes = product.stock && typeof product.stock === 'object' 
      ? Object.keys(product.stock) 
      : [];
    
    if (availableSizes.length > 0 && !selectedSize) {
      toast.error('Please select a size', {
        style: {
          borderRadius: '8px',
          background: '#000',
          color: '#fff',
          fontSize: '12px'
        }
      });
      return;
    }

    cartDispatch({ 
      type: 'ADD_TO_CART', 
      payload: { 
        ...product, 
        selectedSize, 
        price: product.discountPrice || product.price, 
        quantity 
      }
    });

    toast.success(`Added ${quantity} item(s) to cart`, { 
      icon: '🛍️',
      style: {
        borderRadius: '8px',
        background: '#000',
        color: '#fff',
        fontSize: '12px'
      }
    });
  };

  // Wishlist toggle
  const toggleWishlist = () => {
    if (isInWishlist) {
      wishlistDispatch({ type: 'REMOVE_FROM_WISHLIST', payload: product });
      toast.success('Removed from wishlist');
    } else {
      wishlistDispatch({ type: 'ADD_TO_WISHLIST', payload: product });
      toast.success('Added to wishlist', { icon: '❤️' });
    }
  };

  // Share product
  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description?.substring(0, 100),
          url: window.location.href
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const safeDescription = useMemo(
    () => formatDescription(product?.description || ''),
    [product?.description]
  );

  if (loading || !product) return <ProductPageSkeleton />;

  const discountPercentage = product.discountPrice 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) 
    : 0;
  
  const sizes = product.stock && typeof product.stock === 'object' 
    ? Object.keys(product.stock) 
    : [];

  const allMedia = [
    ...(product.videoUrl ? [{ type: 'video', url: product.videoUrl }] : []),
    ...(selectedColor && product.colors?.find(c => c.name === selectedColor)?.images || []),
    product.imageUrl,
    ...(product.images || [])
  ].filter(Boolean);

  const isOutOfStock = typeof product.stock === 'number'
    ? product.stock <= 0
    : Object.values(product.stock || {}).reduce((a, b) => a + Number(b), 0) <= 0;

  return (
    <main className="bg-white selection:bg-black selection:text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-16">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8 flex-wrap">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/shop" className="hover:text-black transition-colors">Shop</Link>
          <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {product.category && (
            <>
              <Link 
                href={`/shop?category=${product.category}`} 
                className="hover:text-black transition-colors"
              >
                {product.category}
              </Link>
              <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
          <span className="text-black font-semibold truncate">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-20">
          
          {/* Gallery Section */}
          <div className="space-y-4">
            {/* Main Image/Video */}
            <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden group border border-gray-200">
              {imageLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
              )}

              {/* Out of Stock Overlay */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-lg font-black uppercase tracking-wider">
                      Out of Stock
                    </p>
                  </div>
                </div>
              )}

              {activeMedia.type === 'video' ? (
                <video 
                  src={activeMedia.url} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedData={() => setImageLoading(false)}
                />
              ) : (
                <Image 
                  src={activeMedia.url} 
                  alt={product.name} 
                  fill 
                  priority
                  className="object-cover transition-all duration-700 group-hover:scale-105"
                  onLoad={() => setImageLoading(false)}
                />
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {discountPercentage > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-lg">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    {discountPercentage}% OFF
                  </span>
                )}
                {product.isNew && (
                  <span className="inline-flex px-3 py-1.5 bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-lg">
                    New
                  </span>
                )}
              </div>

              {/* Quick Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={shareProduct}
                  className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-6 gap-2">
              {allMedia.map((media, i) => {
                const isVideo = typeof media === 'object' && media.type === 'video';
                const url = isVideo ? media.url : media;
                const isActive = activeMedia.url === url;

                return (
                  <button 
                    key={i}
                    onClick={() => setActiveMedia({ 
                      type: isVideo ? 'video' : 'image', 
                      url,
                      index: i 
                    })}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isActive 
                        ? 'border-black scale-95 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {isVideo ? (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    ) : (
                      <Image 
                        src={url} 
                        alt={`View ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  SKU: {product.id.slice(-8).toUpperCase()}
                </span>
                <button
                  onClick={toggleWishlist}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  {isInWishlist ? (
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
              </div>

              <h1 className="text-3xl md:text-4xl font-black leading-tight">
                {product.name}
              </h1>

              {/* Rating & Sales */}
              <div className="flex items-center gap-6 flex-wrap">
                {avgRating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(avgRating) ? 'text-amber-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}

                {salesCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold text-gray-700">
                      {salesCount} sold
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="border-y border-gray-200 py-6">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-black text-gray-900">
                  ৳{(product.discountPrice || product.price).toLocaleString()}
                </span>
                {product.discountPrice && (
                  <span className="text-2xl text-gray-400 line-through">
                    ৳{product.price.toLocaleString()}
                  </span>
                )}
              </div>
              {product.discountPrice && (
                <p className="text-sm text-green-600 font-semibold mt-2">
                  You save ৳{(product.price - product.discountPrice).toLocaleString()} ({discountPercentage}%)
                </p>
              )}
            </div>

<<<<<<< HEAD
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
=======
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-6">
                {['description', 'details', 'shipping'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-black'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
>>>>>>> e74bc1f (Initial commit)
            </div>

            {/* Tab Content */}
            <div className="min-h-[100px]">
              {activeTab === 'description' && (
                <div 
                  className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: safeDescription }}
                />
              )}
              {activeTab === 'details' && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-semibold">Category</span>
                    <span className="text-gray-600">{product.category || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-semibold">Brand</span>
                    <span className="text-gray-600">Zaqeen</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-semibold">Material</span>
                    <span className="text-gray-600">{product.material || 'Premium Cotton'}</span>
                  </div>
                </div>
              )}
              {activeTab === 'shipping' && (
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                    <div>
                      <p className="font-semibold">Free Delivery</p>
                      <p className="text-gray-600">On orders over ৳1000</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-semibold">Delivery Time</p>
                      <p className="text-gray-600">2-5 business days</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-wider">
                  Select Color
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {product.colors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color.name)}
                      className={`aspect-square flex items-center justify-center text-sm font-bold uppercase rounded-xl border-2 transition-all ${
                        selectedColor === color.name
                          ? 'bg-black text-white border-black scale-105 shadow-lg'
                          : 'bg-white text-gray-900 border-gray-300 hover:border-black'
                      }`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-wider">
                  Select Color
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {product.colors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color.name)}
                      className={`aspect-square flex items-center justify-center text-sm font-bold uppercase rounded-xl border-2 transition-all ${
                        selectedColor === color.name
                          ? 'bg-black text-white border-black scale-105 shadow-lg'
                          : 'bg-white text-gray-900 border-gray-300 hover:border-black'
                      }`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold uppercase tracking-wider">
                    Select Size
                  </label>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-xs font-semibold text-gray-600 hover:text-black underline"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {sizes.map(size => {
                    const hasStock = product.stock[size] > 0;
                    return (
                      <button
                        key={size}
                        disabled={!hasStock}
                        onClick={() => setSelectedSize(size)}
                        className={`aspect-square flex items-center justify-center text-sm font-bold uppercase rounded-xl border-2 transition-all ${
                          !hasStock
                            ? 'bg-gray-100 text-gray-300 border-gray-200 line-through cursor-not-allowed'
                            : selectedSize === size
                            ? 'bg-black text-white border-black scale-105 shadow-lg'
                            : 'bg-white text-gray-900 border-gray-300 hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-wider">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" strokeWidth="3" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="px-6 py-2 font-bold text-lg border-x-2 border-gray-300">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" strokeWidth="3" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                {sizes.length > 0 && selectedSize && product.stock[selectedSize] && (
                  <span className="text-sm text-gray-600">
                    {product.stock[selectedSize]} available
                  </span>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl group"
              >
                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                {!isOutOfStock && (
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              {[
                { icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>, text: 'Secure Payment' },
                { icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" /></svg>, text: 'Fast Shipping' },
                { icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>, text: 'Easy Returns' }
              ].map((item, idx) => (
                <div key={idx} className="text-center space-y-2">
                  <div className="text-gray-600 flex justify-center">
                    {item.icon}
                  </div>
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24">
          <ProductReviews 
            productId={id} 
            initialReviews={reviews} 
            onReviewPosted={fetchData} 
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-32 pt-20 border-t border-gray-200">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-4">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                  You May Also Like
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                Similar Products
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowSizeGuide(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-2xl font-black uppercase tracking-tight">
                Size Guide
              </h3>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-left py-4 px-4 font-black uppercase tracking-wider">Size</th>
                      <th className="text-left py-4 px-4 font-black uppercase tracking-wider">Chest (in)</th>
                      <th className="text-left py-4 px-4 font-black uppercase tracking-wider">Length (in)</th>
                      <th className="text-left py-4 px-4 font-black uppercase tracking-wider">Shoulder (in)</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {[
                      { size: 'S', chest: '36', length: '26', shoulder: '16' },
                      { size: 'M', chest: '38', length: '27', shoulder: '17' },
                      { size: 'L', chest: '40', length: '28', shoulder: '18' },
                      { size: 'XL', chest: '42', length: '29', shoulder: '19' },
                      { size: 'XXL', chest: '44', length: '30', shoulder: '20' },
                    ].map((row) => (
                      <tr key={row.size} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-bold">{row.size}</td>
                        <td className="py-4 px-4">{row.chest}"</td>
                        <td className="py-4 px-4">{row.length}"</td>
                        <td className="py-4 px-4">{row.shoulder}"</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 mb-1">Measurement Tips</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• All measurements are in inches</li>
                      <li>• Margin of error: ±0.5 inches</li>
                      <li>• For relaxed fit, size up</li>
                      <li>• Measurements are taken flat</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shimmer Animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </main>
  );
}
