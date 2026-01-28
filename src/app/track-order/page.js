'use client';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { HiOutlineSearch, HiCheck, HiOutlineCube, HiOutlineTruck, HiOutlineBadgeCheck, HiOutlineShoppingBag, HiOutlineXCircle, HiOutlineReply, HiOutlinePaperAirplane, HiOutlineClock, HiOutlineInformationCircle } from 'react-icons/hi';
import { RiLoader4Line } from 'react-icons/ri';

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statuses = [
    { label: 'Pending', icon: HiOutlineShoppingBag, desc: 'Order received, awaiting verification' },
    { label: 'Processing', icon: HiOutlineCube, desc: 'Your masterpiece is being prepared' },
    { label: 'Handed Over to Courier', icon: HiOutlinePaperAirplane, desc: 'Consignment given to logistics partner' },
    { label: 'Shipped', icon: HiOutlineTruck, desc: 'En route to your destination' },
    { label: 'Delivered', icon: HiOutlineBadgeCheck, desc: 'Successfully delivered' },
    { label: 'Delayed', icon: HiOutlineClock, desc: 'An unexpected delay occurred' },
    { label: 'Returned', icon: HiOutlineReply, desc: 'Order has been returned' },
    { label: 'Cancelled', icon: HiOutlineXCircle, desc: 'Order has been cancelled' }
  ];

  const currentStep = order ? statuses.findIndex(s => s.label === order.status) : -1;

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
        setError('No record found with this identity. Please verify.');
      }
    } catch (err) {
      setError('System connectivity issue. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-28">
        <div className="text-center max-w-xl mx-auto mb-20">
          <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold mb-4 block">Concierge Service</span>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic mb-8">Trace Journey</h1>
          
          <form onSubmit={handleTrackOrder} className="relative group">
            <div className="relative flex items-center bg-[#f9f9f9] border-none rounded-sm overflow-hidden p-1 transition-all focus-within:ring-1 ring-black shadow-sm">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="ENTER ORDER IDENTITY (E.G. ZQ123456)"
                className="w-full bg-transparent py-5 px-6 text-[11px] font-black tracking-[0.3em] outline-none uppercase placeholder:text-gray-300"
              />
              <button type="submit" disabled={loading} className="bg-black text-white p-4 transition-all hover:bg-gray-900 disabled:bg-gray-200">
                {loading ? <RiLoader4Line className="w-5 h-5 animate-spin" /> : <HiOutlineSearch className="w-5 h-5" />}
              </button>
            </div>
            {error && <p className="mt-4 text-[9px] text-rose-500 font-black uppercase tracking-widest animate-shake">{error}</p>}
          </form>
        </div>

        {order && (
          <div className="animate-fadeIn space-y-16">
            <div className="relative pt-8 pb-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                {statuses.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index <= currentStep || (order.status === 'Delayed' && step.label === 'Delayed');
                  const isCompleted = index < currentStep;

                  return (
                    <div key={step.label} className="flex md:flex-col items-center gap-4 md:gap-0 flex-1 group">
                      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-700 border ${
                        isActive ? 'bg-black border-black text-white shadow-xl shadow-black/10' : 'bg-white border-gray-100 text-gray-200'
                      }`}>
                        {isCompleted ? <HiCheck className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                        {index < statuses.length - 1 && (
                          <div className="absolute left-1/2 top-12 w-[1px] h-8 bg-gray-100 md:hidden"></div>
                        )}
                      </div>
                      <div className="md:text-center mt-0 md:mt-6">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-black' : 'text-gray-300'}`}>
                          {step.label}
                        </p>
                        <p className="text-[8px] uppercase tracking-tighter text-gray-400 mt-1 hidden md:block max-w-[120px]">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="absolute top-[62px] left-0 w-full h-[1px] bg-gray-50 -z-0 hidden md:block">
                <div 
                  className="h-full bg-black transition-all duration-[1.5s] ease-out"
                  style={{ width: `${(currentStep / (statuses.length - 3)) * 100}%` }}
                ></div>
              </div>
            </div>

            {order.note && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-sm flex items-start gap-4">
                    <HiOutlineInformationCircle className="w-6 h-6 mt-0.5 flex-shrink-0"/>
                    <div>
                        <h4 className="font-black uppercase tracking-widest text-sm">A Note From Us</h4>
                        <p className="text-xs mt-2 font-semibold leading-relaxed">{order.note}</p>
                    </div>
                </div>
            )}

            <div className="bg-[#fafafa] p-8 md:p-12 rounded-sm border border-gray-50 flex flex-col md:flex-row gap-12 justify-between">
              <div className="space-y-8 flex-1">
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Consignment Info</span>
                  <div className="flex flex-col gap-1">
                     <p className="text-xl font-black uppercase tracking-tighter italic">#{order.orderId || order.id}</p>
                     <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Logged: {order.timestamp ? new Date(order.timestamp.toDate()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="md:border-l border-gray-100 md:pl-12 flex flex-col justify-center">
                 <div className={`flex items-center gap-3 ${
                  order.status === 'Cancelled' || order.status === 'Returned' || order.status === 'Delayed' ? 'text-orange-500' : 'text-emerald-500'
                }`}>
                   <div className={`w-2 h-2 rounded-full animate-pulse ${
                     order.status === 'Cancelled' || order.status === 'Returned' || order.status === 'Delayed' ? 'bg-orange-500' : 'bg-emerald-500'
                   }`}></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">Live Status</p>
                </div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter mt-2 text-black">{order.status}</h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
