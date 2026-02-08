'use client';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, dispatch, totalPrice } = useCart();
  const { dispatch: wishlistDispatch } = useWishlist();
  const [removingItem, setRemovingItem] = useState(null);
  const [updatingItem, setUpdatingItem] = useState(null);

  const handleUpdateQuantity = (item, quantity) => {
    if (quantity < 1) {
      handleRemoveItem(item);
      return;
    }
    
    setUpdatingItem(item.id);
    setTimeout(() => {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { ...item, quantity } });
      setUpdatingItem(null);
    }, 200);
  };

  const handleRemoveItem = (item) => {
    setRemovingItem(item.id);
    setTimeout(() => {
      dispatch({ type: 'REMOVE_FROM_CART', payload: item });
      toast.error('Removed from cart', {
        style: {
          borderRadius: '8px',
          background: '#000',
          color: '#fff',
          fontSize: '12px'
        }
      });
      setRemovingItem(null);
    }, 300);
  };

  const moveToWishlist = (item) => {
    wishlistDispatch({ type: 'ADD_TO_WISHLIST', payload: item });
    dispatch({ type: 'REMOVE_FROM_CART', payload: item });
    toast.success('Moved to wishlist', { icon: '❤️' });
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch({ type: 'CLEAR_CART' });
      toast.success('Cart cleared');
    }
  };

  // Calculations
  const shippingThreshold = 5000;
  const shippingCost = totalPrice >= shippingThreshold || totalPrice === 0 ? 0 : 150;
  const grandTotal = totalPrice + shippingCost;
  const progressToFree = Math.min((totalPrice / shippingThreshold) * 100, 100);
  const amountToFreeShipping = Math.max(0, shippingThreshold - totalPrice);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-16">
        
        {/* Header */}
        <header className="mb-12 pb-8 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2">
                Shopping Cart
              </h1>
              <p className="text-gray-600">
                {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm font-semibold text-red-600 hover:text-red-700 underline"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Free Shipping Progress */}
          {totalPrice > 0 && totalPrice < shippingThreshold && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">
                  Add ৳{amountToFreeShipping.toLocaleString()} more for FREE shipping!
                </p>
                <span className="text-xs font-bold text-blue-600">
                  {Math.round(progressToFree)}%
                </span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 rounded-full"
                  style={{ width: `${progressToFree}%` }}
                ></div>
              </div>
            </div>
          )}
        </header>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="py-32 flex flex-col items-center text-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-16 h-16 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                0
              </div>
            </div>
            
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4">
              Your Cart is Empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Looks like you haven't added anything to your cart yet. Start shopping to find amazing products!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/shop" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg group"
              >
                Start Shopping
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              
              <Link 
                href="/account/wishlist" 
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:border-black transition-all"
              >
                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                View Wishlist
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item, index) => (
                <div 
                  key={`${item.id}-${item.selectedSize}`}
                  className={`bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-lg transition-all duration-300 ${
                    removingItem === item.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeIn 0.5s ease-out forwards'
                  }}
                >
                  <div className="flex gap-4 md:gap-6">
                    {/* Product Image */}
                    <Link 
                      href={`/product/${item.id}`}
                      className="relative w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shrink-0 group"
                    >
                      <Image
                        src={item.imageUrl || item.image || '/placeholder.png'}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link 
                          href={`/product/${item.id}`}
                          className="text-base md:text-lg font-bold hover:text-gray-600 transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {item.selectedSize && (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs font-semibold rounded-lg">
                              Size: {item.selectedSize}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            SKU: {item.id.slice(-8).toUpperCase()}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="mt-3">
                          <p className="text-xl md:text-2xl font-black">
                            ৳{(item.price * item.quantity).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            ৳{item.price.toLocaleString()} each
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                            disabled={updatingItem === item.id}
                          >
                            <svg className="w-4 h-4" fill="none" strokeWidth="3" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                          </button>
                          
                          <span className="px-3 py-2 font-bold text-lg min-w-[40px] text-center">
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                            disabled={updatingItem === item.id}
                          >
                            <svg className="w-4 h-4" fill="none" strokeWidth="3" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => moveToWishlist(item)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                            title="Move to wishlist"
                          >
                            <svg className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={() => handleRemoveItem(item)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Remove from cart"
                          >
                            <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 mt-8 p-6 bg-white rounded-2xl border border-gray-200">
                {[
                  { 
                    icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" /></svg>,
                    text: 'Fast Delivery'
                  },
                  { 
                    icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>,
                    text: 'Easy Returns'
                  },
                  { 
                    icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
                    text: 'Secure Payment'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="text-center space-y-2">
                    <div className="text-green-600 flex justify-center">{item.icon}</div>
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
                <h2 className="text-xl font-black uppercase tracking-tight mb-6 pb-4 border-b-2 border-gray-200">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                    <span className="font-bold">৳{totalPrice.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-bold">
                      {shippingCost === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `৳${shippingCost}`
                      )}
                    </span>
                  </div>

                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-bold uppercase">Total</span>
                      <span className="text-3xl font-black">৳{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl group mb-4"
                >
                  Proceed to Checkout
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>

                <Link
                  href="/shop"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:border-black transition-all"
                >
                  Continue Shopping
                </Link>

                {/* Accepted Payment Methods */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 text-center">
                    Accepted Payment Methods
                  </p>
                  <div className="flex items-center justify-center gap-3 opacity-60 grayscale">
                    <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-[8px] font-bold">
                      bKash
                    </div>
                    <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-[8px] font-bold">
                      Nagad
                    </div>
                    <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-[8px] font-bold">
                      COD
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}