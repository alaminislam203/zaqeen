'use client';
import Image from 'next/image';
import Link from 'next/link';
import { HiOutlineShoppingBag, HiOutlineHeart, HiStar, HiHeart } from 'react-icons/hi';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { dispatch: cartDispatch } = useCart();
  const { state: wishlistState, dispatch: wishlistDispatch } = useWishlist();

  // Wishlist চেক
  const isInWishlist = wishlistState.wishlistItems.some(item => item.id === product.id);

  // সাইজ রিকোয়ারমেন্ট চেক
  const sizes = product.stock && typeof product.stock === 'object' ? Object.keys(product.stock) : [];
  const isSizeRequired = sizes.length > 0;

  const handleAddToCart = (e) => {
    e.preventDefault(); 
    
    if (isSizeRequired) {
      toast.error("Architecture Detail: Please select a size from the product page.");
      return;
    }

    if (product.stock <= 0) {
        toast.error("Article is currently archived (Out of stock).");
        return;
    }

    cartDispatch({ 
      type: 'ADD_TO_CART', 
      payload: { ...product, price: product.discountPrice || product.price }
    });
    toast.success("Article added to Bag", { 
        icon: '🛍️',
        style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px' }
    });
  };

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    if (isInWishlist) {
        wishlistDispatch({ type: 'REMOVE_FROM_WISHLIST', payload: product });
        toast.success('Removed from Portfolio');
    } else {
        wishlistDispatch({ type: 'ADD_TO_WISHLIST', payload: product });
        toast.success('Saved to Portfolio', { icon: '🖤' });
    }
  };

  const discountPercentage = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  return (
    <Link href={`/product/${product.id}`} className="block group bg-white selection:bg-black selection:text-white">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F9F9F9] border border-gray-50">
        
        {/* Main Image & Hover Image Logic */}
        <Image
          src={product.imageUrl || '/placeholder.svg'}
          alt={product.name || 'Zaqeen Article'}
          fill
          className={`object-cover transition-all duration-[1.5s] ease-out group-hover:scale-110 ${product.hoverImageUrl ? 'group-hover:opacity-0' : ''}`}
        />
        {product.hoverImageUrl && (
            <Image
                src={product.hoverImageUrl}
                alt={`${product.name} Perspective`}
                fill
                className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 scale-110 group-hover:scale-100 transition-all duration-[1.5s] ease-out"
            />
        )}
        
        {/* Minimalist Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-4 left-4 bg-black text-white text-[8px] font-black px-3 py-1.5 uppercase tracking-[0.2em] shadow-2xl italic">
            -{discountPercentage}% Off
          </div>
        )}

        {/* Wishlist Button - Minimalist Overlay */}
        <button 
          onClick={handleAddToWishlist} 
          className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur-md rounded-full text-black opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 z-10 hover:bg-black hover:text-white border border-gray-100">
          {isInWishlist ? <HiHeart className="w-5 h-5 text-rose-500" /> : <HiOutlineHeart className="w-5 h-5" />}
        </button>

        {/* Size Indicator - Quick View */}
        {isSizeRequired && (
            <div className="absolute bottom-16 left-0 w-full flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0 z-10 px-4">
                {sizes.slice(0, 4).map(size => (
                    <span key={size} className="bg-white/90 backdrop-blur-sm border border-gray-100 text-[8px] font-black w-8 h-8 flex items-center justify-center uppercase tracking-tighter">
                        {size}
                    </span>
                ))}
            </div>
        )}

        {/* Acquisition Button */}
        <button onClick={handleAddToCart} className="absolute bottom-0 left-0 w-full bg-black text-white py-5 text-[9px] font-black uppercase tracking-[0.4em] translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-in-out flex items-center justify-center gap-3 hover:bg-neutral-900 z-20">
          <HiOutlineShoppingBag className="w-4 h-4" />
          Quick Acquisition
        </button>
      </div>
      
      {/* Product Narrative */}
      <div className="pt-6 pb-4 text-center space-y-2">
        <div className="flex flex-col items-center">
            <span className="text-[9px] text-gray-300 uppercase font-black tracking-[0.4em] mb-1 italic">
                {product.category || 'Curated Article'}
            </span>
            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-gray-900 px-2 line-clamp-1 group-hover:italic transition-all">
                {product.name}
            </h3>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          {product.discountPrice ? (
            <>
              <span className="text-sm font-black text-black tracking-tighter">৳{product.discountPrice.toLocaleString()}</span>
              <span className="text-[10px] text-gray-300 line-through tracking-tighter">৳{product.price.toLocaleString()}</span>
            </>
          ) : (
            <span className="text-sm font-black text-black tracking-tighter">৳{product.price.toLocaleString()}</span>
          )}
        </div>

        {/* Average Rating Integration */}
        {product.avgRating && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <HiStar key={i} className={`w-3 h-3 ${i < Math.round(product.avgRating) ? 'text-black' : 'text-gray-100'}`} />
                ))}
            </div>
            <span className="text-[9px] font-black text-gray-400 tracking-widest">({product.numReviews || 0})</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
