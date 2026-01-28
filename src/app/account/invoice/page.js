'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { HiOutlineArrowNarrowRight, HiOutlineReceiptTax, HiOutlineClock } from 'react-icons/hi';
import { RiHistoryLine } from 'react-icons/ri';

export default function MyInvoicesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/account/login?redirect=/account/invoice');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            const fetchOrders = async () => {
                try {
                    const q = query(
                        collection(db, 'orders'), 
                        where("userId", "==", user.uid),
                        orderBy("createdAt", "desc")
                    );
                    const querySnapshot = await getDocs(q);
                    const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setOrders(userOrders);
                } catch (error) {
                    console.error("Failed to fetch orders:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchOrders();
        }
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white">
                <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="uppercase tracking-[0.4em] text-[10px] font-black italic">Accessing Archives</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFDFD]">
           
            <div className="max-w-5xl mx-auto px-6 py-16 md:py-28 animate-fadeIn">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 gap-6 border-b border-gray-100 pb-12">
                    <div className="space-y-2">
                        <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold">Personal Portfolio</span>
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">Order History</h1>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                        <RiHistoryLine size={14} />
                        Total Acquisitions: {orders.length}
                    </div>
                </div>

                {orders.length === 0 ? (
                    <div className="py-32 flex flex-col items-center text-center bg-white border border-dashed border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-8">
                            <HiOutlineReceiptTax className="w-8 h-8 text-gray-200" />
                        </div>
                        <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-gray-400 mb-8 italic">Your acquisition history is empty</h2>
                        <Link href="/shop" className="group relative px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] overflow-hidden shadow-2xl">
                            <span className="relative z-10">Start Curating</span>
                            <div className="absolute inset-0 bg-gray-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {orders.map((order, index) => (
                            <div 
                                key={order.id} 
                                className="bg-white border border-gray-100 p-8 md:p-10 hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500 rounded-sm relative group"
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[11px] font-black tracking-widest text-gray-900 uppercase">#{order.orderId || order.id.slice(0, 8)}</span>
                                            <div className="h-[1px] w-6 bg-gray-100"></div>
                                            <p className="text-[10px] text-gray-300 uppercase font-black tracking-widest flex items-center gap-1.5">
                                                <HiOutlineClock /> {new Date(order.createdAt?.toDate()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-1">Total Valuation</span>
                                                <p className="text-lg font-black tracking-tighter italic text-gray-800">৳{(order.totalAmount || order.total).toLocaleString()}</p>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                                order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${order.status === 'Delivered' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                {order.status || 'In Transit'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto">
                                        <Link 
                                            href={`/order-confirmation/${order.id}`} 
                                            className="flex items-center justify-center gap-4 border border-black py-4 px-10 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all group/btn"
                                        >
                                            Inspect Details 
                                            <HiOutlineArrowNarrowRight className="text-lg transition-transform group-hover/btn:translate-x-2" />
                                        </Link>
                                    </div>
                                </div>
                                
                                {/* Background Watermark */}
                                <div className="absolute right-10 bottom-0 opacity-[0.02] text-7xl font-black italic pointer-events-none select-none uppercase tracking-tighter -mb-4 transition-all group-hover:opacity-[0.05] group-hover:-translate-y-2">
                                    Archive
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}