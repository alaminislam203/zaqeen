'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { generateInvoice } from '@/lib/generateInvoice';
import { HiOutlineDownload, HiOutlineArrowNarrowLeft, HiOutlineClock } from 'react-icons/hi';
import { RiShieldCheckLine, RiWhatsappLine } from 'react-icons/ri';

export default function OrderConfirmationPage() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [supportNumber, setSupportNumber] = useState('88017XXXXXXXX'); // Default

    useEffect(() => {
        if (!orderId) return;

        // ১. অর্ডারের ডাটা ফেচিং
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

        // ২. ডাইনামিক সাপোর্ট নম্বর ফেচিং (Settings থেকে)
        const unsubSettings = onSnapshot(doc(db, "settings", "site_config"), (doc) => {
            if (doc.exists()) setSupportNumber(doc.data().supportPhone || '88017XXXXXXXX');
        });

        return () => unsubSettings();
    }, [orderId]);

    // ডাইনামিক হোয়াটসঅ্যাপ লিঙ্ক
    const whatsappLink = order 
        ? `https://wa.me/${supportNumber.replace('+', '')}?text=Greetings Zaqeen, I have secured an acquisition. Reference: #${order.orderId}` 
        : '#';

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="uppercase tracking-[0.6em] text-[9px] font-black italic text-gray-400">Archiving Acquisition...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-rose-500 space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] italic">{error}</h2>
            <Link href="/shop" className="text-[9px] border-b border-rose-200 pb-1 uppercase tracking-widest font-bold">Return to Gallery</Link>
        </div>
    );

    return (
        <main className="min-h-screen bg-[#FDFDFD] selection:bg-black selection:text-white">
            <div className="max-w-5xl mx-auto px-6 py-20 md:py-32 animate-fadeIn">

                <div className="bg-white border border-gray-50 shadow-[0_60px_120px_rgba(0,0,0,0.02)] rounded-sm p-10 md:p-24 relative overflow-hidden">
                    {/* Background Aesthetic Watermark */}
                    <div className="absolute -top-16 -right-16 opacity-[0.03] text-[12rem] font-black italic select-none pointer-events-none">
                        ZQ
                    </div>

                    <div className="relative z-10 text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-black text-white rounded-full mb-10 shadow-2xl">
                            <RiShieldCheckLine className="w-10 h-10 animate-pulse text-emerald-400"/>
                        </div>
                        <span className="block text-[10px] uppercase tracking-[0.8em] text-gray-300 font-black mb-4 italic">Identity Verified</span>
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-black italic leading-[0.8]">Acquisition Logged</h1>
                        
                        <div className="w-12 h-[2px] bg-black mx-auto mt-12 mb-10"></div>
                        
                        <p className="text-[12px] text-gray-400 font-bold mt-6 tracking-widest leading-relaxed max-w-md mx-auto uppercase italic">
                            Gratitude, <span className="text-black">{order.deliveryInfo?.name || 'Collector'}</span>. Your articles have been entered into the Zaqeen archive for immediate audit.
                        </p>
                    </div>

                    {/* Order Audit Ledger */}
                    <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 py-16 border-t border-b border-gray-50">
                        <div className="text-center md:text-left space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 italic">Reference Key</p>
                            <p className="text-sm font-black tracking-[0.2em] text-black">#{order.orderId}</p>
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 italic">Temporal Log</p>
                            <p className="text-sm font-black tracking-[0.2em] text-black uppercase">
                                {order.timestamp?.toDate ? new Date(order.timestamp.toDate()).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : 'Real-time Syncing'}
                            </p>
                        </div>
                        <div className="text-center md:text-right space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 italic">Security Status</p>
                            <p className={`text-sm font-black tracking-[0.2em] uppercase italic ${order.paymentInfo?.status === 'Unpaid' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {order.paymentInfo?.status || 'Awaiting Verified'}
                            </p>
                        </div>
                    </div>

                    {/* Logistics Hub Interaction */}
                    <div className="mt-12 flex flex-col lg:flex-row items-center justify-between gap-8 bg-[#fcfcfc] p-8 md:p-10 border border-gray-50 group">
                        <div className="flex items-center gap-6">
                            <HiOutlineClock className="text-gray-200 w-6 h-6 group-hover:text-black transition-colors" />
                            <p className="text-[9px] uppercase tracking-[0.3em] font-black text-gray-400 italic leading-relaxed">
                                Logistics Dispatch Protocol: <br/> 24-48 Business Hours Verification.
                            </p>
                        </div>
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-black border-b border-black pb-1 hover:text-gray-400 hover:border-gray-200 transition-all italic">
                            <RiWhatsappLine className="text-emerald-500" size={18}/> Access Concierge
                        </a>
                    </div>

                    {/* Final Actions */}
                    <div className="mt-20 flex flex-col md:flex-row items-center justify-center gap-8">
                        <Link href="/shop" className="w-full md:w-auto px-16 py-6 border border-gray-100 text-[10px] font-black uppercase tracking-[0.5em] hover:bg-black hover:text-white transition-all text-center italic">
                            Explore New Blueprints
                        </Link>
                        <button 
                            onClick={() => order && generateInvoice(order)} 
                            className="group relative w-full md:w-auto bg-black text-white px-16 py-6 overflow-hidden shadow-2xl transition-all active:scale-95"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] italic">
                                <HiOutlineDownload size={20} /> Archive Invoice
                            </span>
                            <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        </button>
                    </div>
                </div>

                {/* Return Path */}
                <div className="mt-20 flex justify-center">
                    <Link href="/account" className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 hover:text-black transition-all italic">
                        <HiOutlineArrowNarrowLeft className="text-xl transition-transform group-hover:-translate-x-3" />
                        Access Identity Portfolio
                    </Link>
                </div>
            </div>
        </main>
    );
}
