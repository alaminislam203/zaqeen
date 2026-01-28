'use client';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { HiOutlineShoppingBag, HiOutlineTrash, HiOutlinePlus, HiOutlineMinus, HiArrowNarrowRight, HiOutlineShieldCheck } from 'react-icons/hi';
import { RiSecurePaymentLine, RiTruckLine, RiExchangeLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, dispatch, totalPrice } = useCart();

  const handleUpdateQuantity = (item, quantity) => {
    if (quantity < 1) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: item });
      toast.error('Identity removed from bag');
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { ...item, quantity } });
  };

  const handleRemoveItem = (item) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: item });
    toast.error('Article removed from your portfolio');
  };

  const shippingCost = totalPrice > 5000 ? 0 : 150; // ৫০০০ টাকার উপরে ফ্রি শিপিং লজিক
  const grandTotal = totalPrice + shippingCost;

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-black selection:bg-black selection:text-white">
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-16 md:py-32">
        
        {/* Header: Editorial Style */}
        <header className="mb-24 border-b border-gray-100 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black italic block">Review Your Selection</span>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">The Portfolio</h1>
                </div>
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">
                    {cart.length} {cart.length === 1 ? 'Article' : 'Articles'} Selected
                </div>
            </div>
        </header>

        {cart.length === 0 ? (
          <div className="py-40 flex flex-col items-center text-center animate-fadeIn">
            <div className="relative mb-12">
                <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                    <HiOutlineShoppingBag className="w-12 h-12 text-gray-200" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-[10px] font-bold">0</div>
            </div>
            <h2 className="text-sm uppercase tracking-[0.5em] font-black italic mb-12 text-gray-300">Your curation is currently void</h2>
            <Link href="/shop" className="group relative px-16 py-6 bg-black text-white text-[10px] font-black uppercase tracking-[0.5em] overflow-hidden shadow-2xl transition-all hover:px-20">
              <span className="relative z-10">Begin Discovery</span>
              <div className="absolute inset-0 bg-gray-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
            
            {/* Left: Product Narrative */}
            <div className="lg:col-span-7 space-y-16">
              {cart.map((item) => (
                <div key={`${item.id}-${item.selectedSize}`} className="flex flex-col sm:flex-row gap-12 pb-16 border-b border-gray-50 group relative">
                  
                  {/* Visual Frame */}
                  <div className="relative w-full sm:w-52 aspect-[3/4] bg-[#f9f9f9] overflow-hidden shrink-0 border border-gray-50 group-hover:shadow-2xl transition-all duration-700">
                    <Image 
                      src={item.imageUrl || "/placeholder.png"} 
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-[2s] group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0" 
                    />
                    <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-md px-3 py-1 text-[8px] font-black uppercase tracking-widest border border-gray-100 shadow-sm">Verified Article</span>
                    </div>
                  </div>

                  {/* Identity Details */}
                  <div className="flex-grow flex flex-col justify-between py-2">
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-widest text-gray-900 mb-1 italic">{item.name}</h3>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Premium Acquisition</p>
                        </div>
                        <button onClick={() => handleRemoveItem(item)} className="text-gray-200 hover:text-rose-500 transition-all hover:rotate-90"><HiOutlineTrash size={20}/></button>
                      </div>
                      
                      <div className="flex flex-wrap gap-4">
                        {item.selectedSize && <span className="text-[9px] font-black uppercase tracking-widest bg-gray-50 px-4 py-2 border border-gray-100">Size: {item.selectedSize}</span>}
                        <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-4 py-2 border border-emerald-100">In Stock</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-12 sm:mt-0">
                      <div className="flex items-center gap-8 border border-gray-100 px-6 py-3 rounded-sm bg-white shadow-sm">
                          <button onClick={() => handleUpdateQuantity(item, item.quantity - 1)} className="text-gray-300 hover:text-black transition-colors"><HiOutlineMinus size={14}/></button>
                          <span className="font-mono text-sm font-black w-8 text-center">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item, item.quantity + 1)} className="text-gray-300 hover:text-black transition-colors"><HiOutlinePlus size={14}/></button>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-1">Subtotal</p>
                         <p className="font-black text-2xl tracking-tighter">৳{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Trust Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                  <div className="flex items-center gap-4 group">
                      <RiTruckLine className="w-6 h-6 text-gray-200 group-hover:text-black transition-colors" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 leading-relaxed">Secure & Audited <br/> Logistics</p>
                  </div>
                  <div className="flex items-center gap-4 group">
                      <RiExchangeLine className="w-6 h-6 text-gray-200 group-hover:text-black transition-colors" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 leading-relaxed">Certainty Return <br/> Protocol</p>
                  </div>
                  <div className="flex items-center gap-4 group">
                      <HiOutlineShieldCheck className="w-6 h-6 text-gray-200 group-hover:text-black transition-colors" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 leading-relaxed">Quality Assurance <br/> Guaranteed</p>
                  </div>
              </div>
            </div>

            {/* Right: Financial Portal */}
            <div className="lg:col-span-5">
               <div className="sticky top-32 bg-white border border-gray-100 p-10 md:p-16 shadow-[0_60px_100px_rgba(0,0,0,0.04)] rounded-sm">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.6em] mb-16 text-center text-gray-400 italic">Vault Summary</h2>
                  
                  <div className="space-y-8 text-[10px] font-black uppercase tracking-[0.3em]">
                      <div className="flex justify-between text-gray-400">
                        <p>Articles Value</p>
                        <p>৳{totalPrice.toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <p>Logistics Architecture</p>
                        <p>{shippingCost === 0 ? <span className="text-emerald-500 italic">Complimentary</span> : `৳${shippingCost.toLocaleString()}`}</p>
                      </div>
                      
                      {/* Progress to Free Shipping */}
                      {totalPrice < 5000 && (
                        <div className="pt-4 space-y-3">
                            <div className="flex justify-between text-[8px] tracking-widest text-emerald-600">
                                <span>Free Shipping Milestone</span>
                                <span>৳{totalPrice} / ৳5,000</span>
                            </div>
                            <div className="h-1 bg-gray-50 overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(totalPrice / 5000) * 100}%` }}></div>
                            </div>
                        </div>
                      )}

                      <div className="h-[1px] bg-gray-50 my-10"></div>
                      
                      <div className="flex justify-between items-end">
                        <p className="text-[11px] tracking-[0.5em] italic">Final Total</p>
                        <div className="text-right">
                            <p className="text-3xl font-black tracking-tighter italic leading-none">৳{grandTotal.toLocaleString()}</p>
                            <p className="text-[8px] tracking-widest text-gray-300 mt-2 italic font-bold">Inclusive of all duties</p>
                        </div>
                      </div>
                  </div>

                  <div className="mt-16 space-y-8">
                      <Link href="/checkout" className="group w-full flex items-center justify-center gap-6 bg-black text-white px-8 py-7 text-[11px] font-black uppercase tracking-[0.6em] overflow-hidden shadow-2xl transition-all active:scale-95">
                         <span className="relative z-10">Secure Acquisition</span>
                         <HiArrowNarrowRight className="relative z-10 text-xl transition-transform group-hover:translate-x-4" />
                         
                      </Link>
                      
                      <div className="flex flex-col items-center gap-4 pt-4 border-t border-gray-50 opacity-30 grayscale transition-all hover:opacity-100 hover:grayscale-0 cursor-default">
                         <div className="flex gap-4">
                            <RiSecurePaymentLine size={20} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Zaqeen Security Protocol 2.0</span>
                         </div>
                      </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}