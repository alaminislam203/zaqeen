'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';

const ProductCard = ({ product, index = 0 }) => {
  const { dispatch: cartDispatch } = useCart();
  const { state: wishlistState, dispatch: wishlistDispatch } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isInWishlist = mounted && wishlistState.wishlistItems.some(item => item.id === product.id);

  // Stock and size logic
  const sizes = product.stock && typeof product.stock === 'object' ? Object.keys(product.stock) : [];
  const totalStock = typeof product.stock === 'number' 
    ? product.stock 
    : Object.values(product.stock || {}).reduce((a, b) => a + Number(b), 0);
  
  const isOutOfStock = totalStock <= 0;
  const isSizeRequired = sizes.length > 0;
  const isLowStock = totalStock > 0 && totalStock <= 5;

  const handleAddToCart = (e) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (isOutOfStock) {
      toast.error("Product is out of stock", {
        style: { 
          borderRadius: '8px', 
          background: '#000', 
          color: '#fff', 
          fontSize: '12px' 
        }
      });
      return;
    }

    if (isSizeRequired) {
      toast.error("Please select a size", {
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
        price: product.discountPrice || product.price, 
        quantity: 1 
      }
    });

    toast.success("Added to cart", { 
      icon: (
        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      style: { 
        borderRadius: '8px', 
        background: '#000', 
        color: '#fff', 
        fontSize: '12px' 
      }
    });
  };

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!mounted) return;

    if (isInWishlist) {
      wishlistDispatch({ type: 'REMOVE_FROM_WISHLIST', payload: product });
      toast.success('Removed from wishlist', {
        style: { 
          borderRadius: '8px', 
          background: '#000', 
          color: '#fff', 
          fontSize: '12px' 
        }
      });
    } else {
      wishlistDispatch({ type: 'ADD_TO_WISHLIST', payload: product });
      toast.success('Added to wishlist', { 
        icon: (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        ),
        style: { 
          borderRadius: '8px', 
          background: '#000', 
          color: '#fff', 
          fontSize: '12px' 
        }
      });
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  const discountPercentage = product.discountPrice 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) 
    : 0;

  return (
    <div 
      className="group relative bg-white transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl">
          
          {/* Loading Skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-sm font-black uppercase tracking-wider text-gray-900 px-6 py-2 border-2 border-gray-900 rounded-lg">
                Sold Out
              </span>
            </div>
          )}

          {/* Main Image */}
          <Image
            src={product.imageUrl || '/placeholder.svg'}
            alt={product.name || 'Product'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-all duration-700 ease-out ${
              isHovered && !product.hoverImageUrl ? 'scale-110' : 'scale-100'
            } ${product.hoverImageUrl && isHovered ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Hover Image */}
          {product.hoverImageUrl && (
            <Image
              src={product.hoverImageUrl}
              alt={`${product.name} - Alternate view`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover absolute inset-0 transition-all duration-700 ease-out ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              }`}
            />
          )}
          
          {/* Badges Container */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
            {/* Discount Badge */}
            {discountPercentage > 0 && !isOutOfStock && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-lg">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                {discountPercentage}% OFF
              </span>
            )}

            {/* New Badge */}
            {product.isNew && (
              <span className="inline-flex px-3 py-1.5 bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-lg">
                New
              </span>
            )}

            {/* Low Stock Badge */}
            {isLowStock && !isOutOfStock && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-lg">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {totalStock} Left
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            {/* Wishlist Button */}
            <button 
              onClick={handleAddToWishlist} 
              className={`p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg transform transition-all duration-300 border border-gray-200 ${
                isHovered ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
              } hover:scale-110 hover:bg-white group/wishlist`}
              style={{ transitionDelay: '50ms' }}
            >
              {isInWishlist ? (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700 group-hover/wishlist:text-red-500 transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>

            {/* Quick View Button */}
            <button 
              onClick={handleQuickView}
              className={`p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg transform transition-all duration-300 border border-gray-200 ${
                isHovered ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
              } hover:scale-110 hover:bg-white group/view`}
              style={{ transitionDelay: '100ms' }}
            >
              <svg className="w-5 h-5 text-gray-700 group-hover/view:text-black transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>

          {/* Available Sizes */}
          {isSizeRequired && !isOutOfStock && (
            <div className={`absolute bottom-20 left-0 right-0 flex justify-center gap-2 px-4 transition-all duration-500 ${
              isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              {sizes.slice(0, 6).map(size => {
                const hasStock = product.stock[size] > 0;
                return (
                  <span 
                    key={size} 
                    className={`w-9 h-9 flex items-center justify-center text-[10px] font-bold uppercase rounded-lg transition-all ${
                      hasStock 
                        ? 'bg-white/95 backdrop-blur-sm border-2 border-gray-900 text-gray-900 shadow-lg' 
                        : 'bg-gray-100/50 border border-gray-300 text-gray-400 line-through'
                    }`}
                  >
                    {size}
                  </span>
                );
              })}
            </div>
          )}

          {/* Add to Cart Button */}
          {!isOutOfStock && (
            <button 
              onClick={handleAddToCart} 
              className={`absolute bottom-0 left-0 right-0 bg-black text-white py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-500 hover:bg-gray-900 z-20 ${
                isHovered ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Add to Cart
            </button>
          )}
        </div>
        
        {/* Product Info */}
        <div className="pt-5 pb-2 space-y-3">
          {/* Category */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              {product.category || 'Product'}
            </span>
            {product.avgRating > 0 && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-semibold text-gray-700">
                  {product.avgRating.toFixed(1)}
                </span>
                <span className="text-[10px] text-gray-400">
                  ({product.numReviews || 0})
                </span>
              </div>
            )}
          </div>

          {/* Product Name */}
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-black transition-colors min-h-[40px]">
            {product.name}
          </h3>
          
          {/* Price */}
          <div className="flex items-center gap-3">
            {product.discountPrice ? (
              <>
                <span className="text-lg font-black text-gray-900">
                  ৳{product.discountPrice.toLocaleString()}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ৳{product.price.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-lg font-black text-gray-900">
                ৳{product.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {!isOutOfStock && totalStock <= 10 && (
            <p className="text-[10px] font-semibold text-orange-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Only {totalStock} left in stock
            </p>
          )}
        </div>
      </Link>

      {/* Shimmer Animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default ProductCard;