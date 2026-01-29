'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { generateInvoice } from '@/lib/generateInvoice';
import { HiOutlineDownload, HiOutlineArrowNarrowLeft, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi';
import { RiShieldCheckLine, RiWhatsappLine } from 'react-icons/ri';

export default function OrderConfirmationPage() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!orderId) return;

        const fetchOrder = async () => {
            try {
                const docRef = doc(db, 'orders', orderId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setOrder({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError('Order Identity Not Found');
                }
            } catch (err) {
                setError('Failed to fetch order details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    // হোয়াটসঅ্যাপ মেসেজ লিংক (অর্ডার আপডেট দ্রুত পাওয়ার জন্য)
    const whatsappLink = order ? `https://wa.me/88017XXXXXXXX?text=Hello Zaqeen, I just secured an acquisition! Reference ID: #${order.orderId}` : '#';

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="uppercase tracking-[0.5em] text-[10px] font-black italic">Archiving Your Acquisition</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-rose-500 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest">{error}</h2>
            <Link href="/shop" className="text-[10px] underline uppercase tracking-widest">Back to Gallery</Link>
        </div>
    );

    return (
        <main className="min-h-screen bg-[#FDFDFD] selection:bg-black selection:text-white">
            <div className="max-w-4xl mx-auto px-6 py-16 md:py-32 animate-fadeIn">

                <div className="bg-white border border-gray-50 shadow-[0_40px_100px_rgba(0,0,0,0.03)] rounded-sm p-10 md:p-20 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 opacity-[0.02] text-9xl font-black italic select-none">ZAQEEN</div>

                    <div className="relative z-10 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-full mb-8">
                            <RiShieldCheckLine className="w-10 h-10 text-emerald-500 animate-pulse"/>
                        </div>
                        <span className="block text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold mb-3 italic">Verified Acquisition</span>
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-gray-900 italic leading-none">Curation Logged</h1>
                        <p className="text-[11px] text-gray-400 font-medium mt-6 tracking-widest leading-relaxed max-w-sm mx-auto">
                            Gratitude for your belief in Zaqeen, <span className="text-black font-black uppercase">{order.deliveryInfo?.name || 'Collector'}</span>. Your articles are currently undergoing audit-ready protocols.
                        </p>
                    </div>

                    {/* Order Meta Data */}
                    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 py-12 border-t border-b border-gray-50">
                        <div className="text-center md:text-left">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2 italic">Ref. Identity</p>
                            <p className="text-sm font-black tracking-widest text-gray-900">#{order.orderId}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2 italic">Date Logged</p>
                            <p className="text-sm font-black tracking-widest text-gray-900">
                                {order.timestamp?.toDate ? new Date(order.timestamp.toDate()).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : 'Processing'}
                            </p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2 italic">Payment Status</p>
                            <p className={`text-sm font-black tracking-widest uppercase ${order.paymentInfo?.status === 'Unpaid' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {order.paymentInfo?.status || 'Pending'}
                            </p>
                        </div>
                    </div>

                    {/* Delivery Timeline Image/Diagram Placeholder */}
                    <div className="mt-12">
                        
                    </div>

                    {/* Logistic Notification */}
                    <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50/50 p-8 border border-gray-50">
                        <div className="flex items-center gap-4">
                            <HiOutlineClock className="text-gray-400 w-5 h-5" />
                            <p className="text-[9px] uppercase tracking-widest font-black text-gray-500">Logistics dispatch within 24-48 business hours.</p>
                        </div>
                        <a href={whatsappLink} target="_blank" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors">
                            <RiWhatsappLine size={16}/> Connect to Concierge
                        </a>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-6">
                        <Link href="/shop" className="w-full md:w-auto px-12 py-5 border border-gray-100 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-gray-50 transition-all text-center">
                            Discover More
                        </Link>
                        <button 
                            onClick={() => order && generateInvoice(order)} 
                            className="group relative w-full md:w-auto bg-black text-white px-12 py-5 overflow-hidden shadow-2xl transition-all"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.4em]">
                                <HiOutlineDownload size={18} /> Download INVOICE
                            </span>
                            <div className="absolute inset-0 bg-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        </button>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="mt-16 flex justify-center">
                    <Link href="/account" className="group flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-black transition-all">
                        <HiOutlineArrowNarrowLeft className="text-lg transition-transform group-hover:-translate-x-2" />
                        Access Your Portfolio
                    </Link>
                </div>
            </div>
        </main>
    );
}
