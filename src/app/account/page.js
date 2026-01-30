'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { generateInvoice } from '@/lib/generateInvoice';
import { HiOutlineShoppingBag, HiOutlineDownload, HiOutlineUserCircle, HiOutlineClock } from 'react-icons/hi';
import { RiFileList3Line, RiUserSettingsLine } from 'react-icons/ri';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) setUserData(userDoc.data());
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
      const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(userOrders);
        setLoading(false);
      });
      return () => unsubscribeOrders();
    }
  }, [user]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-[0.4em] text-[10px] font-black italic">Accessing Portfolio</p>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      {/* --- Personalization Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-6 border-b border-gray-50 pb-8">
        <div>
          <span className="text-[10px] uppercase tracking-[0.5em] text-gray-300 font-black italic">Member Exclusive</span>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mt-2 italic">
            Hello, {userData?.name?.split(' ')[0] || 'Member'}
          </h1>
        </div>
        <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.2em] font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-sm">
          <RiUserSettingsLine size={14} className="text-black" />
          Protocol Active — {user?.emailVerified ? 'Verified' : 'Standard'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* --- Orders Section --- */}
        <section>
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-900 flex items-center gap-3">
                <RiFileList3Line size={18} /> Acquisition Log ({orders.length})
             </h2>
             {orders.length > 0 && (
               <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1">
                  {orders.filter(o => o.status === 'Delivered').length} Secured
               </span>
             )}
          </div>

          {orders.length === 0 ? (
            <div className="py-24 flex flex-col items-center text-center border border-dashed border-gray-100 bg-gray-50/30">
              <HiOutlineShoppingBag className="w-10 h-10 text-gray-100 mb-6" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-300 font-bold mb-8 italic">Your curation history is empty</p>
              <Link href="/shop" className="group relative px-10 py-4 bg-black text-white text-[9px] font-black uppercase tracking-[0.5em] overflow-hidden transition-all">
                <span className="relative z-10">Discover Masterpieces</span>
                <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders
                .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                .map(order => (
                  <div key={order.id} className="group relative bg-white border border-gray-100 p-6 md:p-8 hover:border-black transition-all duration-500 overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                      
                      <div className="space-y-6 flex-1">
                        <div className="flex flex-wrap items-center gap-4">
                           <span className="text-[10px] font-black tracking-[0.2em] text-black uppercase bg-gray-50 px-3 py-1">Ref: #{order.orderId || order.id.slice(0, 8)}</span>
                           <p className="text-[9px] text-gray-300 uppercase font-black tracking-widest flex items-center gap-2">
                              <HiOutlineClock /> {order.timestamp?.toDate ? new Date(order.timestamp.toDate()).toLocaleDateString('en-GB') : 'Logged Recently'}
                           </p>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                           <div>
                              <p className="text-[8px] uppercase tracking-widest text-gray-300 font-black mb-1 italic">Value</p>
                              <p className="text-sm font-black tracking-tighter italic text-gray-900">৳{(order.totalAmount || order.total || 0).toLocaleString()}</p>
                           </div>
                           <div className="col-span-1 sm:col-span-2">
                              <p className="text-[8px] uppercase tracking-widest text-gray-300 font-black mb-1 italic">Composition</p>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter truncate">
                                 {order.items?.map(i => i.name || i.title).join(' + ')}
                              </p>
                           </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-row md:flex-col justify-between items-end gap-4 md:border-l md:border-gray-50 md:pl-8">
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-bounce'}`}></div>
                           <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${order.status === 'Delivered' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {order.status || 'Verification'}
                           </span>
                        </div>
                        
                        <button 
                          onClick={() => generateInvoice(order)}
                          className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-black hover:text-gray-400 transition-all border-b border-black hover:border-transparent pb-1 italic"
                        >
                          <HiOutlineDownload size={14} /> Archive PDF
                        </button>
                      </div>

                    </div>
                    {/* Artistic Watermark for Order Card */}
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <HiOutlineShoppingBag size={120} />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
