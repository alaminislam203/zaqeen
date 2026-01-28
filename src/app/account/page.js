'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { generateInvoice } from '@/lib/generateInvoice';
import { HiOutlineLogout, HiOutlineShoppingBag, HiOutlineDownload, HiOutlineUserCircle, HiOutlineClock } from 'react-icons/hi';
import { RiFileList3Line, RiUserSettingsLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Successfully logged out");
      router.push('/');
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-[0.4em] text-[10px] font-black italic">Accessing Portfolio</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 animate-fadeIn">
        {/* Header: Personalization */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6 border-b border-gray-100 pb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold italic">Member Exclusive</span>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mt-2 italic">
              Hello, {userData?.displayName?.split(' ')[0] || userData?.name?.split(' ')[0] || 'Member'}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest font-black text-gray-400">
            <RiUserSettingsLine size={16} />
            Security Active — {user?.emailVerified ? 'Verified Account' : 'Standard Member'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
          
          {/* Left: Interactive Profile Card */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-50 p-10 rounded-sm shadow-sm sticky top-32">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 border border-gray-100">
                  <HiOutlineUserCircle size={48} />
                </div>
                <div>
                   <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">{userData?.name || 'Zaqeen Member'}</h2>
                   <p className="text-[10px] text-gray-400 mt-1 font-bold lowercase tracking-tighter">{userData?.email}</p>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-gray-50 space-y-8">
                 <div className="space-y-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 italic">Contact Identifier</p>
                    <p className="text-[11px] font-bold text-gray-600">{userData?.phone || 'Identity Pending'}</p>
                 </div>
                 <button 
                  onClick={handleLogout}
                  className="group relative w-full border border-gray-100 py-4 flex items-center justify-center gap-3 overflow-hidden transition-all hover:border-rose-500"
                >
                  <span className="relative z-10 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 group-hover:text-rose-500 transition-colors">
                    End Session
                  </span>
                  <div className="absolute inset-0 bg-rose-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Masterpiece Acquisition History */}
          <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-50">
               <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-900 flex items-center gap-3">
                  <RiFileList3Line size={18} /> Acquisition History ({orders.length})
               </h2>
               {orders.length > 0 && (
                 <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                    {orders.filter(o => o.status === 'Delivered').length} Received
                 </span>
               )}
            </div>

            {orders.length === 0 ? (
              <div className="py-32 flex flex-col items-center text-center bg-white border border-dashed border-gray-100 rounded-sm">
                <HiOutlineShoppingBag className="w-12 h-12 text-gray-100 mb-8" />
                <p className="text-[10px] uppercase tracking-[0.4em] text-gray-300 font-bold mb-8 italic">Your curation history is empty</p>
                <Link href="/shop" className="group relative px-10 py-4 bg-black text-white text-[9px] font-black uppercase tracking-[0.4em] overflow-hidden shadow-2xl">
                  <span className="relative z-10">Discover Masterpieces</span>
                  <div className="absolute inset-0 bg-gray-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {orders
                  .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                  .map(order => (
                    <div key={order.id} className="bg-white border border-gray-50 p-8 hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500 rounded-sm group overflow-hidden relative">
                      <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-4">
                             <span className="text-xs font-black tracking-widest text-gray-900 uppercase italic">Ref: #{order.orderId || order.id.slice(0, 8)}</span>
                             <div className="h-[1px] w-8 bg-gray-100"></div>
                             <p className="text-[9px] text-gray-300 uppercase font-black tracking-widest flex items-center gap-1.5">
                                <HiOutlineClock /> Logged: {order.timestamp?.toDate ? new Date(order.timestamp.toDate()).toLocaleDateString('en-GB') : 'Recent'}
                             </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-12 gap-y-4">
                             <div>
                                <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-1">Curation Value</p>
                                <p className="text-sm font-black tracking-tighter italic text-gray-800">৳{(order.totalAmount || order.total || 0).toLocaleString()}</p>
                             </div>
                             <div>
                                <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-1">Articles</p>
                                <p className="text-[11px] font-bold text-gray-600 truncate max-w-[200px]">
                                   {order.items?.map(i => i.title).join(', ')}
                                </p>
                             </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-row md:flex-col justify-between items-end gap-4 min-w-[140px]">
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${order.status === 'Delivered' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                             <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${order.status === 'Delivered' ? 'text-emerald-600' : 'text-amber-600'}`}>
                               {order.status || 'Under Review'}
                             </span>
                          </div>
                          
                          <button 
                            onClick={() => generateInvoice(order)}
                            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 hover:text-black transition-all border-b border-transparent hover:border-black pb-1"
                          >
                            <HiOutlineDownload size={14} /> Get Archive
                          </button>
                        </div>
                      </div>
                      
                      {/* Background Decoration */}
                      <div className="absolute -right-8 -bottom-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
                         <HiOutlineShoppingBag className="w-40 h-40 text-black" />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
