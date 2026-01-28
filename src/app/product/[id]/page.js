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
import { HiOutlineShoppingCart, HiOutlineHeart, HiOutlineChevronRight, HiOutlineHome, HiStar, HiOutlineFire, HiOutlineLockClosed } from 'react-icons/hi';
import ProductCard from '@/components/ProductCard';
import ProductReviews from '@/components/ProductReviews';

const ProductPageSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
    <div className="grid md:grid-cols-2 gap-12">
      <div className="bg-gray-200 h-[500px] rounded-lg"></div>
      <div>
        <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-gray-400 rounded w-3/4 mb-4"></div>
        <div className="h-6 bg-gray-300 rounded w-1/2 mb-6"></div>
        <div className="h-20 bg-gray-300 rounded mb-6"></div>
        <div className="h-12 bg-gray-400 rounded w-full"></div>
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

  const { dispatch: cartDispatch } = useCart();
  const { state: wishlistState, dispatch: wishlistDispatch } = useWishlist();
  const isInWishlist = product ? wishlistState.wishlistItems.some(item => item.id === product.id) : false;

  const fetchRelatedProducts = useCallback(async (category, currentProductId) => {
    if (!category) return;
    const q = query(
      collection(db, 'products'),
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

  const fetchSalesCount = useCallback(async (productId) => {
    const ordersQuery = query(collection(db, 'orders'), where('items', 'array-contains', productId));
    const querySnapshot = await getDocs(ordersQuery);
    let count = 0;
    querySnapshot.forEach(doc => {
        const order = doc.data();
        order.items.forEach(item => {
            if(item.id === productId) {
                count += item.quantity;
            }
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
      fetchRelatedProducts(productData.category, id);
      fetchSalesCount(id);
      
      const reviewsRef = collection(db, 'products', id, 'reviews');
      const reviewsSnapshot = await getDocs(reviewsRef);
      const fetchedReviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(fetchedReviews);

      if (fetchedReviews.length > 0) {
        const totalRating = fetchedReviews.reduce((acc, curr) => acc + curr.rating, 0);
        setAvgRating(totalRating / fetchedReviews.length);
      } else {
        setAvgRating(0);
      }
    } else {
      console.log('No such document!');
    }
    setLoading(false);
  }, [id, fetchRelatedProducts, fetchSalesCount]);

  useEffect(() => {
    fetchProductAndReviews();
  }, [fetchProductAndReviews]);

  const handleAddToCart = () => {
    const isSizeRequired = product.stock && typeof product.stock === 'object' && Object.keys(product.stock).length > 0;
    if (isSizeRequired && !selectedSize) {
      toast.error('Please select a size!');
      return;
    }

    const stockAvailable = isSizeRequired ? product.stock[selectedSize] > 0 : product.stock > 0;
    if (!stockAvailable) {
        toast.error('This size is out of stock.');
        return;
    }

    cartDispatch({ 
        type: 'ADD_TO_CART', 
        payload: { ...product, selectedSize, price: product.discountPrice || product.price }
    });
    toast.success('Added to your bag!', { icon: '🛍️' });
  };

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      wishlistDispatch({ type: 'REMOVE_FROM_WISHLIST', payload: product });
      toast.success('Removed from your wishlist');
    } else {
      wishlistDispatch({ type: 'ADD_TO_WISHLIST', payload: product });
      toast.success('Added to your wishlist! ❤️');
    }
  };
  
  if (loading || !product) {
    return <ProductPageSkeleton />;
  }

  const discountPercentage = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const isSizeRequired = product.stock && typeof product.stock === 'object' && Object.keys(product.stock).length > 0;

  return (
    <div className="bg-white text-gray-800">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="flex items-center text-sm text-gray-500 mb-8 font-medium">
            <Link href="/" className="hover:text-gray-800 flex items-center gap-1">
              <HiOutlineHome />
              Home
            </Link>
            <HiOutlineChevronRight className="mx-2" />
            <Link href="/shop" className="hover:text-gray-800">
              Shop
            </Link>
            {product.category && (
              <>
                <HiOutlineChevronRight className="mx-2" />
                <span className="capitalize text-gray-800 font-bold">{product.category}</span>
              </>
            )}
          </nav>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="aspect-[4/5] relative rounded-lg overflow-hidden shadow-lg shadow-gray-200/50">
              <Image 
                src={product.imageUrl || '/placeholder.svg'}
                alt={product.name}
                layout="fill"
                objectFit="cover"
              />
               {discountPercentage > 0 && (
                <div className="absolute top-5 left-5 bg-black text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                  -{discountPercentage}%
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">{product.category || 'ZAQEEN'}</p>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter mt-1">{product.name}</h1>
                
                <div className="flex items-center gap-4 mt-3 text-sm">
                    {reviews.length > 0 && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <HiStar className="w-5 h-5 text-amber-400"/>
                            <span className="font-bold text-gray-800">{avgRating.toFixed(1)}</span>
                            <span className="text-gray-400">({reviews.length} Reviews)</span>
                        </div>
                    )}
                    {reviews.length > 0 && salesCount > 0 && <div className="w-px h-4 bg-gray-200"></div>}
                    {salesCount > 0 && (
                        <div className="flex items-center gap-1.5">
                            <HiOutlineFire className="w-5 h-5 text-rose-500"/>
                            <span className="font-bold text-gray-800">{salesCount}</span>
                            <span className="text-gray-500">Sold</span>
                        </div>
                    )}
                </div>
              </div>

              <div className="flex items-baseline gap-3 pt-2">
                  {product.discountPrice ? (
                      <>
                          <span className="text-3xl font-bold text-black">৳{product.discountPrice}</span>
                          <span className="text-xl text-gray-300 line-through">৳{product.price}</span>
                      </>
                  ) : (
                      <span className="text-3xl font-bold text-black">৳{product.price}</span>
                  )}
              </div>
              
              <p className="text-sm leading-relaxed text-gray-500">{product.description}</p>

              {isSizeRequired && (
                <div className="space-y-3">
                  <p className="text-sm font-bold">Select Size:</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.keys(product.stock).map(size => {
                      const isAvailable = product.stock[size] > 0;
                      return (
                          <button 
                              key={size}
                              onClick={() => isAvailable && setSelectedSize(size)}
                              disabled={!isAvailable}
                              className={`px-4 py-2 border rounded-md text-sm font-semibold transition-all duration-200 
                                  ${!isAvailable ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through' : ''}
                                  ${selectedSize === size ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300 hover:border-black'}`
                              }
                          >
                              {size}
                          </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-4">
                <div className="flex items-stretch gap-3">
                    <button 
                    onClick={handleAddToCart}
                    className="flex-grow flex items-center justify-center gap-3 px-8 py-4 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-md hover:bg-gray-800 transition-colors shadow-lg shadow-black/20"
                    >
                    <HiOutlineShoppingCart className="h-5 w-5" />
                    Add to Bag
                    </button>
                    <button 
                    onClick={handleWishlistToggle}
                    className={`px-4 py-4 border rounded-md transition-colors ${isInWishlist ? 'bg-rose-50 border-rose-500 text-rose-500' : 'border-gray-300 hover:border-black'}`}>
                    <HiOutlineHeart className="h-6 w-6 stroke-2" />
                    </button>
                </div>
                <div className="text-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200/70">
                
                    <div className="flex items-center justify-center gap-2 font-semibold text-gray-600">
                       <HiOutlineLockClosed />
                       <span>Security Notice</span>
                    </div>
                    <p className="mt-2 leading-relaxed">All order information is saved. Legal action will be taken if any fake orders are detected.</p>
                </div>
              </div>

            </div>
          </div>

          <ProductReviews productId={id} initialReviews={reviews} onReviewPosted={fetchProductAndReviews} />

          {relatedProducts.length > 0 && (
            <div className="mt-24 pt-16 border-t border-gray-100">
                <h2 className="text-2xl font-black tracking-tighter text-center mb-10">You Might Also Like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            </div>
          )}
        </div>
    </div>
  );
}
