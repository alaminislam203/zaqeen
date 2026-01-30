'use client';
import { useCart } from '@/context/AuthContext'; // আপনার কন্টেক্সট পাথ অনুযায়ী ঠিক করে নিন
import Link from 'next/link';
import Image from 'next/image';
import { 
    HiOutlineShoppingBag, HiOutlineTrash, HiOutlinePlus, 
    HiOutlineMinus, HiArrowNarrowRight, HiOutlineShieldCheck 
} from 'react-icons/hi';
import { RiSecurePaymentLine, RiTruckLine, RiExchangeLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, dispatch, totalPrice } = useCart();

  const handleUpdateQuantity = (item, quantity) => {
    if (quantity < 1) {
      handleRemoveItem(item);
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { ...item, quantity } });
  };

  const handleRemoveItem = (item) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: item });
    toast.error('Article removed from your portfolio', {
        style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px', letterSpacing: '0.1em' }
    });
  };

  // লজিস্টিকস ক্যালকুলেশন
  const shippingThreshold = 5000;
  const shippingCost = totalPrice >= shippingThreshold || totalPrice === 0 ? 0 : 150;
  const grandTotal = totalPrice + shippingCost;
  const progressToFree = Math.min((totalPrice / shippingThreshold) * 100, 100);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-black selection:bg-black selection:text-white">
      <main className="max-w-[1440px] mx-auto px-6 lg:px-16 py-16 md:py-32">
        
        {/* --- Header: Architectural Identity --- */}
        <header className="mb-20 md:mb-32 border-b border-gray-50 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <span className="text-[10px] uppercase tracking-[0.8em] text-gray-300 font-black italic block">Review Selection</span>
                    <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.8]">The Portfolio</h1>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 px-6 py-2 rounded-full border border-gray-100">
                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
                    <span className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-500">
                        {cart.length} {cart.length === 1 ? 'Article' : 'Articles'} Authenticated
                    </span>
                </div>
            </div>
        </header>

        {cart.length === 0 ? (
          <div className="py-40 flex flex-col items-center text-center animate-fadeIn">
            <div className="relative mb-12">
                <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                    <HiOutlineShoppingBag className="w-12 h-12 text-gray-100" />
                </div>
                <div className="absolute top-0 right-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[11px] font-black italic">0</div>
            </div>
            <h2 className="text-[11px] uppercase tracking-[0.6em] font-black italic mb-12 text-gray-300">Your curation is currently void</h2>
            <Link href="/shop" className="group relative px-20 py-7 bg-black text-white text-[10px] font-black uppercase tracking-[0.6em] overflow-hidden transition-all shadow-2xl active:scale-95">
              <span className="relative z-10">Initiate Discovery</span>
              <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24 items-start">
            
            {/* --- Left: Article Ledger --- */}
            <div className="lg:col-span-7 space-y-16">
              {cart.map((item) => (
                <div key={`${item.id}-${item.selectedSize}`} className="flex flex-col sm:flex-row gap-10 pb-16 border-b border-gray-50 group relative animate-slideUp">
                  
                  {/* Visual Frame */}
                  <div className="relative w-full sm:w-56 aspect-[3/4] bg-[#f9f9f9] overflow-hidden shrink-0 border border-gray-50 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                    <Image 
                      src={item.imageUrl || "/placeholder.png"} 
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-[2.5s] group-hover:scale-110 grayscale-[0.3] group-hover:grayscale-0" 
                    />
                    <div className="absolute top-4 left-4 z-10">
                        <span className="bg-white/90 backdrop-blur-md px-3 py-1 text-[8px] font-black uppercase tracking-[0.3em] border border-gray-100 italic shadow-sm">Verified</span>
                    </div>
                  </div>

                  {/* Identity Details */}
                  <div className="flex-grow flex flex-col justify-between py-2">
                    <div className="space-y-8">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-widest text-gray-900 mb-2 italic leading-tight">{item.name}</h3>
                            <p className="text-[9px] uppercase tracking-[0.4em] text-gray-300 font-black italic">Article Ref: #{item.id.slice(-6).toUpperCase()}</p>
                        </div>
                        <button 
                            onClick={() => handleRemoveItem(item)} 
                            className="text-gray-200 hover:text-rose-500 transition-all hover:rotate-90 p-2"
                        >
                            <HiOutlineTrash size={22}/>
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {item.selectedSize && (
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] bg-black text-white px-4 py-2 italic">
                                Size: {item.selectedSize}
                            </span>
                        )}
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] bg-emerald-50 text-emerald-600 px-4 py-2 border border-emerald-100 italic">
                            Protocol: Ready
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-12 sm:mt-0">
                      <div className="flex items-center gap-8 border border-gray-100 px-6 py-4 rounded-sm bg-white shadow-sm transition-all hover:border-black">
                          <button onClick={() => handleUpdateQuantity(item, item.quantity - 1)} className="text-gray-300 hover:text-black transition-colors"><HiOutlineMinus size={14}/></button>
                          <span className="font-black text-sm w-8 text-center italic">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item, item.quantity + 1)} className="text-gray-300 hover:text-black transition-colors"><HiOutlinePlus size={14}/></button>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] uppercase tracking-[0.5em] text-gray-300 font-black mb-1 italic">Value</p>
                         <p className="font-black text-2xl tracking-tighter italic text-gray-900">৳{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Trust & Logistics Protocol */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-8">
                  <div className="space-y-4 group">
                      <RiTruckLine className="w-8 h-8 text-gray-100 group-hover:text-black transition-colors duration-500" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 leading-relaxed italic">Logistics <br/> Security Audited</p>
                  </div>
                  <div className="space-y-4 group">
                      <RiExchangeLine className="w-8 h-8 text-gray-100 group-hover:text-black transition-colors duration-500" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 leading-relaxed italic">Curation <br/> Exchange Code</p>
                  </div>
                  <div className="space-y-4 group">
                      <HiOutlineShieldCheck className="w-8 h-8 text-gray-100 group-hover:text-black transition-colors duration-500" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 leading-relaxed italic">Identity <br/> Privacy Shield</p>
                  </div>
              </div>
            </div>

            {/* --- Right: Financial Console --- */}
            <div className="lg:col-span-5">
               <div className="sticky top-32 bg-white border border-gray-50 p-10 md:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.02)]">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.8em] mb-16 text-center text-gray-400 italic">Financial Summary</h2>
                  
                  <div className="space-y-10 text-[11px] font-black uppercase tracking-[0.4em]">
                      <div className="flex justify-between text-gray-400 italic">
                        <p>Articles Total</p>
                        <p>৳{totalPrice.toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between text-gray-400 italic">
                        <p>Logistics Architecture</p>
                        <p>{shippingCost === 0 ? <span className="text-emerald-500">Complimentary</span> : `৳${shippingCost.toLocaleString()}`}</p>
                      </div>
                      
                      {/* Milestone Protocol */}
                      {totalPrice < shippingThreshold && totalPrice > 0 && (
                        <div className="pt-4 space-y-4">
                            <div className="flex justify-between text-[9px] tracking-[0.3em] text-emerald-600 font-black italic">
                                <span>Complimentary Logistics</span>
                                <span>৳{totalPrice} / ৳{shippingThreshold}</span>
                            </div>
                            <div className="h-[2px] bg-gray-50 overflow-hidden">
                                <div className="h-full bg-black transition-all duration-1000" style={{ width: `${progressToFree}%` }}></div>
                            </div>
                        </div>
                      )}

                      <div className="h-[1px] bg-gray-50 my-10"></div>
                      
                      <div className="flex justify-between items-end">
                        <p className="text-[12px] tracking-[0.6em] italic font-black">Investment</p>
                        <div className="text-right">
                            <p className="text-4xl font-black tracking-tighter italic leading-none">৳{grandTotal.toLocaleString()}</p>
                            <p className="text-[8px] tracking-[0.4em] text-gray-300 mt-3 italic font-black">All Duties Included</p>
                        </div>
                      </div>
                  </div>

                  <div className="mt-20 space-y-8">
                      <Link href="/checkout" className="group w-full flex items-center justify-center gap-6 bg-black text-white px-8 py-8 text-[11px] font-black uppercase tracking-[0.6em] transition-all overflow-hidden active:scale-95 shadow-2xl">
                         <span className="relative z-10 flex items-center gap-4">
                             Finalize Acquisition <HiArrowNarrowRight className="text-xl transition-transform group-hover:translate-x-4" />
                         </span>
                         <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                      </Link>
                      
                      <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-50 opacity-20 hover:opacity-100 transition-opacity cursor-default grayscale">
                         <RiSecurePaymentLine size={20} />
                         <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Secure Gateway Protocol</span>
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
