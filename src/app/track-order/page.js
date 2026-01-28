'use client';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { HiOutlineSearch, HiCheck, HiOutlineCube, HiOutlineTruck, HiOutlineBadgeCheck, HiOutlineShoppingBag, HiOutlineXCircle, HiOutlineReply, HiOutlinePaperAirplane, HiOutlineClock, HiOutlineInformationCircle } from 'react-icons/hi';
import { RiLoader4Line } from 'react-icons/ri';

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // মেইন প্রগ্রেস ফ্লো (ধারাবাহিক ফ্লো)
  const mainFlow = [
    { label: 'Pending', icon: HiOutlineShoppingBag, desc: 'Awaiting verification' },
    { label: 'Processing', icon: HiOutlineCube, desc: 'Masterpiece preparation' },
    { label: 'Handed Over to Courier', icon: HiOutlinePaperAirplane, desc: 'Courier dispatch' },
    { label: 'Shipped', icon: HiOutlineTruck, desc: 'En route to you' },
    { label: 'Delivered', icon: HiOutlineBadgeCheck, desc: 'Journey complete' }
  ];

  // এক্সেপশন স্ট্যাটাস (কেবল প্রয়োজন হলে শো করবে)
  const exceptionStatuses = {
    'Delayed': { icon: HiOutlineClock, color: 'text-amber-500', bg: 'bg-amber-500', note: 'Your order is facing a temporary delay.' },
    'Returned': { icon: HiOutlineReply, color: 'text-orange-500', bg: 'bg-orange-500', note: 'The consignment has been returned.' },
    'Cancelled': { icon: HiOutlineXCircle, color: 'text-rose-500', bg: 'bg-rose-500', note: 'This acquisition has been voided.' }
  };

  const isException = order && exceptionStatuses[order.status];
  const currentStep = order ? mainFlow.findIndex(s => s.label === order.status) : -1;

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    const cleanId = orderId.trim().toUpperCase();
    if (!cleanId) {
      setError('Identity required to trace journey');
      return;
    }
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const docRef = doc(db, 'orders', cleanId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError('No record found with this identity.');
      }
    } catch (err) {
      setError('System connectivity issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] selection:bg-black selection:text-white">
      <div className="max-w-5xl mx-auto px-6 py-20 md:py-32">
        
        {/* Header & Search */}
        <div className="text-center max-w-2xl mx-auto mb-24 space-y-8">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black italic block">Logistics Terminal</span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic italic">Trace Journey</h1>
          </div>
          
          <form onSubmit={handleTrackOrder} className="relative group max-w-md mx-auto">
            <div className="relative flex items-center bg-white border border-gray-100 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] focus-within:border-black transition-all">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="ORDER IDENTITY (E.G. ZQ1234)"
                className="w-full bg-transparent py-4 px-6 text-[11px] font-black tracking-[0.3em] outline-none uppercase placeholder:text-gray-200"
              />
              <button type="submit" disabled={loading} className="bg-black text-white px-6 py-4 transition-all hover:bg-gray-800 disabled:bg-gray-200">
                {loading ? <RiLoader4Line className="w-5 h-5 animate-spin" /> : <HiOutlineSearch className="w-5 h-5" />}
              </button>
            </div>
            {error && <p className="mt-4 text-[9px] text-rose-500 font-black uppercase tracking-widest">{error}</p>}
          </form>
        </div>

        {order && (
          <div className="animate-fadeIn space-y-20">
            
            {/* dynamic Progress Tracker */}
            <div className="relative">
              {/* Exception Alert (Conditional) */}
              {isException && (
                <div className={`mb-12 p-6 border rounded-sm flex items-center gap-5 animate-pulse ${isException.bg.replace('bg-', 'bg-opacity-5 border-')}`}>
                   <div className={`${isException.bg} p-3 rounded-full text-white`}>
                      <isException.icon size={24} />
                   </div>
                   <div>
                      <h4 className={`text-[11px] font-black uppercase tracking-widest ${isException.color}`}>Attention Required</h4>
                      <p className="text-[12px] font-bold text-gray-600 mt-1 italic">{isException.note}</p>
                   </div>
                </div>
              )}

              {/* Step Flow */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
                {mainFlow.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index <= currentStep && !isException;
                  const isCompleted = index < currentStep && !isException;

                  return (
                    <div key={step.label} className="flex md:flex-col items-center gap-6 md:gap-0 flex-1 group relative">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-1000 border-2 ${
                        isActive ? 'bg-black border-black text-white shadow-2xl shadow-black/20 scale-110' : 'bg-white border-gray-50 text-gray-100'
                      }`}>
                        {isCompleted ? <HiCheck size={24} /> : <Icon size={20} />}
                        
                        {/* Mobile Connector */}
                        {index < mainFlow.length - 1 && (
                          <div className="absolute left-1/2 top-14 w-[2px] h-10 bg-gray-50 md:hidden"></div>
                        )}
                      </div>
                      
                      <div className="md:text-center mt-0 md:mt-8 space-y-1">
                        <p className={`text-[10px] font-black uppercase tracking-[0.4em] transition-colors ${isActive ? 'text-black' : 'text-gray-200'}`}>
                          {step.label}
                        </p>
                        <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Connecting Line */}
              <div className="absolute top-[28px] left-0 w-full h-[2px] bg-gray-50 -z-0 hidden md:block overflow-hidden">
                <div 
                  className="h-full bg-black transition-all duration-[2s] ease-in-out"
                  style={{ width: isException ? '0%' : `${(currentStep / (mainFlow.length - 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Order Identity Card */}
            <div className="bg-white border border-gray-100 p-10 md:p-16 rounded-sm shadow-[0_40px_100px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-12 justify-between items-center">
               <div className="space-y-6 flex-1 text-center md:text-left">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 italic">Reference Port</span>
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">#{order.orderId || order.id}</h3>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4 border-t border-gray-50">
                     <div>
                        <p className="text-[8px] font-black uppercase text-gray-300 tracking-widest">Logged On</p>
                        <p className="text-[10px] font-bold mt-1 uppercase tracking-widest">{order.timestamp ? new Date(order.timestamp.toDate()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black uppercase text-gray-300 tracking-widest">Collector</p>
                        <p className="text-[10px] font-bold mt-1 uppercase tracking-widest">{order.deliveryInfo?.name || 'Authorized Client'}</p>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col items-center md:items-end justify-center">
                  <div className={`flex items-center gap-3 px-6 py-2 rounded-full border ${isException ? 'border-orange-100 text-orange-500 bg-orange-50' : 'border-emerald-100 text-emerald-500 bg-emerald-50'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isException ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em]">Live Stream</p>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mt-4 text-black">{order.status}</h3>
               </div>
            </div>

            {/* Studio Note */}
            {order.note && (
                <div className="bg-[#111] p-10 rounded-sm space-y-4 shadow-2xl">
                    <div className="flex items-center gap-3 text-white">
                        <HiOutlineInformationCircle size={20}/>
                        <h4 className="font-black uppercase tracking-[0.4em] text-[10px]">Studio Dispatch Memo</h4>
                    </div>
                    <p className="text-xs text-gray-400 font-medium leading-loose italic max-w-2xl border-l border-gray-800 pl-6">
                        "{order.note}"
                    </p>
                </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
