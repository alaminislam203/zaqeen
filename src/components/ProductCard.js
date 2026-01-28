'use client';
import Image from 'next/image';
import Link from 'next/link';
import { HiOutlineShoppingBag, HiOutlineHeart, HiStar } from 'react-icons/hi';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { dispatch: cartDispatch } = useCart();
  const { state: wishlistState, dispatch: wishlistDispatch } = useWishlist();

  // Check if the product is in the wishlist
  const isInWishlist = wishlistState.wishlistItems.some(item => item.id === product.id);

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevents link trigger
    
    const isSizeRequired = product.stock && typeof product.stock === 'object' && Object.keys(product.stock).length > 0;
    
    if (isSizeRequired) {
      toast.error("Please select a size from the product page.");
      return;
    }

    const stockAvailable = product.stock > 0;
    if (!stockAvailable) {
        toast.error("This item is currently out of stock.");
        return;
    }

    cartDispatch({ 
      type: 'ADD_TO_CART', 
      payload: { ...product, price: product.discountPrice || product.price }
    });
    toast.success("Added to Bag!", { icon: '🛍️' });
  };

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    if (isInWishlist) {
        wishlistDispatch({ type: 'REMOVE_FROM_WISHLIST', payload: product });
        toast.success('Removed from Wishlist');
    } else {
        wishlistDispatch({ type: 'ADD_TO_WISHLIST', payload: product });
        toast.success('Added to Wishlist! ❤️');
    }
  };

  const discountPercentage = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  return (
    <Link href={`/product/${product.id}`} className="block group rounded-lg overflow-hidden bg-white transition-shadow duration-500 ease-in-out hover:shadow-2xl hover:shadow-gray-200/80">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={product.imageUrl || '/placeholder.svg'}
          alt={product.name || 'Product image'} // alt টেক্সট আপডেট করা হয়েছে
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-700 ease-in-out group-hover:scale-105"
        />
        
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-4 left-4 bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
            -{discountPercentage}%
          </div>
        )}

        {/* Wishlist Button - Slide-in effect */}
        <button 
          onClick={handleAddToWishlist} 
          className={`absolute top-4 right-4 p-2 bg-white/50 backdrop-blur-sm rounded-full text-gray-900 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 z-10 hover:bg-white ${isInWishlist ? 'text-rose-500' : ''}`}>
          <HiOutlineHeart className="w-6 h-6 stroke-[1.5]" />
        </button>

        {/* Quick Add Button - Rises from bottom */}
        <button onClick={handleAddToCart} className="absolute bottom-0 left-0 w-full bg-black/80 backdrop-blur-md text-white py-4 text-[10px] font-bold uppercase tracking-[0.3em] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out flex items-center justify-center gap-2 hover:bg-black z-10">
          <HiOutlineShoppingBag className="w-4 h-4" />
          Add to Bag
        </button>
      </div>
      
      {/* Product Info */}
      <div className="p-5 text-center">
        <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">{product.category || 'ZAQEEN'}</p>
        <h3 className="text-sm md:text-base font-black tracking-tighter text-gray-900 truncate group-hover:text-clip">{product.name}</h3>
        
        <div className="flex items-center justify-center gap-2 mt-2">
          {product.discountPrice ? (
            <>
              <span className="text-base font-black text-black">৳{product.discountPrice}</span>
              <span className="text-sm text-gray-300 line-through">৳{product.price}</span>
            </>
          ) : (
            <span className="text-base font-black text-black">৳{product.price}</span>
          )}
        </div>

        {/* Rating (if available) */}
        {product.rating && (
          <div className="flex items-center justify-center gap-1 mt-2 text-gray-400">
            <HiStar className="text-amber-400" />
            <span className="text-xs font-bold">{product.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
