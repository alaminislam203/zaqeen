'use client';
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { generateInvoice } from "@/lib/generateInvoice";
import { HiOutlineDownload, HiOutlineShoppingBag, HiOutlinePencilAlt, HiOutlineClock } from "react-icons/hi";
import ReviewForm from "@/components/ReviewForm";
import toast from 'react-hot-toast';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", currentUser.uid),
          orderBy("timestamp", "desc")
        );

        const unsubOrders = onSnapshot(q, (snapshot) => {
          const fetchedOrders = snapshot.docs.map(doc => {
            const data = doc.data();
            let timestampDate = null;
            if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                timestampDate = data.timestamp.toDate();
            } else if (data.timestamp) {
                const date = new Date(data.timestamp);
                if (!isNaN(date.getTime())) timestampDate = date;
            }
            return { id: doc.id, ...data, timestamp: timestampDate };
          });
          setOrders(fetchedOrders);
          setLoading(false);
        });

        return () => unsubOrders();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleReviewSuccess = () => {
    setSelectedReviewItem(null);
    toast.success("Identity Verified: Review Submitted.", {
        style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px', letterSpacing: '0.1em' }
    });
  };

  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-[0.5em] text-[9px] font-black italic animate-pulse">Syncing Your History</p>
    </div>
  );

  if (!user) return (
    <div className="max-w-md mx-auto py-32 px-6 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
        <HiOutlineShoppingBag className="text-gray-300 w-8 h-8" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold mb-10 italic leading-relaxed">
        Join the Zaqeen circle to trace your acquisitions.
      </p>
      <Link href="/login" className="block w-full bg-black text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-neutral-900 transition-all">
        Enter Vault
      </Link>
    </div>
  );

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto px-4 lg:px-0">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 gap-6 border-b border-gray-50 pb-10">
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-[0.5em] text-gray-400 font-black italic">Personal Portfolio</span>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Acquisition Log</h1>
        </div>
        <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest font-black text-gray-400 bg-gray-50 px-5 py-2 rounded-sm border border-gray-100 italic">
           Active Traces: {orders.length}
        </div>
      </div>

      <div className="space-y-8">
        {orders.length > 0 ? orders.map((order, idx) => (
          <div key={order.id} className="group bg-white border border-gray-100 p-8 md:p-12 transition-all duration-700 hover:border-black rounded-sm relative overflow-hidden">
            {/* Index Background Decoration */}
            <div className="absolute -right-8 -bottom-10 opacity-[0.02] text-[150px] font-black italic pointer-events-none select-none group-hover:scale-110 transition-transform duration-1000">
              #{idx + 1}
            </div>

            {/* Order Status & Info */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-50 pb-8 relative z-10">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-black text-white px-3 py-1">#{order.orderId || order.id.slice(-6).toUpperCase()}</span>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-bounce'}`}></span>
                            {order.status || 'Auditing'}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">
                        <HiOutlineClock /> Logged: {order.timestamp ? order.timestamp.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <p className="text-2xl font-black italic tracking-tighter text-gray-900">৳{(order.totalAmount || order.total || 0).toLocaleString()}</p>
                    <button 
                        onClick={() => generateInvoice(order)}
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black border-b border-transparent hover:border-black transition-all pb-1 italic"
                    >
                        <HiOutlineDownload /> Archive Inbound
                    </button>
                </div>
            </div>

            {/* Items Grid */}
            <div className="mt-10 relative z-10">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 mb-6 italic">Curation Content</p>
                <div className="grid grid-cols-1 gap-4">
                    {order.items?.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row justify-between items-center p-6 bg-[#fcfcfc] border border-gray-50/50 hover:border-gray-200 transition-colors duration-500 group/item">
                            <div className="flex items-center gap-6 w-full">
                                <div className="w-16 h-20 relative overflow-hidden bg-gray-100">
                                    <img src={item.imageUrl || '/placeholder.svg'} alt={item.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700"/>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em]">{item.name || item.title}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest italic">Quantity: {item.quantity}</p>
                                </div>
                            </div>

                            <div className="w-full sm:w-auto mt-6 sm:mt-0 flex justify-end">
                                {order.status === 'Delivered' && (
                                    <>
                                        {item.reviewed ? (
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] bg-emerald-50 px-4 py-2 italic border border-emerald-100">Reviewed</span>
                                        ) : (
                                            <button 
                                                onClick={() => setSelectedReviewItem({ orderId: order.id, item })}
                                                className="w-full sm:w-auto flex items-center justify-center gap-3 py-3 px-6 text-[9px] font-black uppercase tracking-[0.4em] bg-black text-white hover:bg-neutral-800 transition-all shadow-xl active:scale-95 italic"
                                            >
                                                <HiOutlinePencilAlt size={14}/> Add Impression
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )) : (
          <div className="py-32 flex flex-col items-center justify-center text-center border border-dashed border-gray-100 bg-gray-50/30">
              <div className="w-12 h-[1px] bg-gray-200 mb-8"></div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-gray-300 font-black italic mb-10">Your acquisition history is currently empty.</p>
              <Link href="/shop" className="text-[9px] font-black uppercase tracking-[0.4em] bg-black text-white px-10 py-5 hover:bg-neutral-900 transition-all shadow-2xl">Start Your Archive</Link>
          </div>
        )}
      </div>

      {/* Review Modal Logic */}
      {selectedReviewItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 overflow-y-auto">
              <div className="animate-fadeIn w-full max-w-xl">
                 <ReviewForm 
                    item={selectedReviewItem.item}
                    orderId={selectedReviewItem.orderId}
                    user={user} 
                    onClose={() => setSelectedReviewItem(null)} 
                    onSuccess={handleReviewSuccess}
                 />
              </div>
          </div>
      )}
    </div>
  );
}
