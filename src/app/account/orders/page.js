'use client';
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { generateInvoice } from "@/lib/generateInvoice";
import { HiOutlineDownload, HiOutlineArrowNarrowRight, HiOutlineShoppingBag, HiOutlinePencilAlt } from "react-icons/hi";
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
                if (!isNaN(date.getTime())) {
                    timestampDate = date;
                }
            }
            return { 
                id: doc.id, 
                ...data,
                timestamp: timestampDate
            };
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
    toast.success("Thank you for your review!");
  };

  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-[0.5em] text-[9px] font-black italic">Syncing Your History</p>
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
      <Link href="/login" className="block w-full bg-black text-white py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-gray-900 transition-all">
        Enter Vault
      </Link>
    </div>
  );

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto py-10 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 gap-6 border-b border-gray-50 pb-8">
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-[0.5em] text-gray-400 font-black">Personal Portfolio</span>
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic">Order Archives</h1>
        </div>
        <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
           Active Traces: {orders.length}
        </div>
      </div>

      <div className="space-y-6">
        {orders.length > 0 ? orders.map((order, idx) => (
          <div key={order.id} className="group relative bg-white border border-gray-50 p-8 md:p-12 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-700 rounded-sm overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-[0.02] text-9xl font-black italic pointer-events-none select-none uppercase tracking-tighter group-hover:scale-110 transition-transform duration-1000">
              #{idx + 1}
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
               {/* ... Meta and Valuation ... */}
            </div>

            {/* Items and Review Section */}
            <div className="relative z-10 mt-8 pt-8 border-t border-gray-100/50">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-4">Items in this order</h3>
                <div className="space-y-4">
                    {order.items?.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50/30 rounded-sm">
                            <div className="flex items-center gap-4">
                                <img src={item.imageUrl} alt={item.name} className="w-12 h-16 object-cover rounded-sm"/>
                                <div>
                                    <p className="font-bold text-sm tracking-wider">{item.name || item.title}</p>
                                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                </div>
                            </div>
                            {order.status === 'Delivered' && (
                                <div>
                                    {item.reviewed ? (
                                        <span className="text-xs font-bold text-emerald-600 tracking-wider">Review Submitted</span>
                                    ) : (
                                        <button 
                                            onClick={() => setSelectedReviewItem({ orderId: order.id, item })}
                                            className="flex items-center gap-2 py-2 px-4 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-white transition-all rounded-sm border border-transparent hover:border-gray-100"
                                        >
                                            <HiOutlinePencilAlt/>
                                            Write Review
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )) : (
          <div className="py-32 flex flex-col items-center justify-center text-center bg-gray-50/50 border border-dashed border-gray-100">
             <div className="w-12 h-[1px] bg-gray-200 mb-6"></div>
             <p className="text-[10px] uppercase tracking-[0.4em] text-gray-300 font-black italic">No acquisitions found in history</p>
             <Link href="/shop" className="mt-10 text-[9px] font-black uppercase tracking-[0.3em] border-b border-black pb-1 hover:text-gray-400 hover:border-gray-200 transition-all">Start Curating</Link>
          </div>
        )}
      </div>

      {selectedReviewItem && (
          <ReviewForm 
              item={selectedReviewItem.item}
              orderId={selectedReviewItem.orderId}
              user={user} 
              onClose={() => setSelectedReviewItem(null)} 
              onSuccess={handleReviewSuccess}
          />
      )}
    </div>
  );
}
