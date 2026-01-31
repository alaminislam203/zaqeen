'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLocationMarker, HiOutlineChatAlt2 } from 'react-icons/hi';
import { RiArrowRightLine } from 'react-icons/ri';

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contactInfo, setContactInfo] = useState({ email: 'support@zaqeen.com', address: 'Dhaka, Bangladesh' });

    useEffect(() => {
        const fetchContactInfo = async () => {
            try {
                const docRef = doc(db, 'settings', 'site_config');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setContactInfo({
                        email: data.contactEmail || 'support@zaqeen.com',
                        address: data.contactAddress || 'Dhaka, Bangladesh'
                    });
                }
            } catch (err) {
                console.error("Config fetch failed", err);
            }
        };
        fetchContactInfo();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            toast.error('Identity protocol incomplete: fill all fields.');
            return;
        }
        setIsSubmitting(true);
        const loadingToast = toast.loading("Transmitting Message...");
        try {
            await addDoc(collection(db, 'contacts'), {
                ...formData,
                status: 'Pending',
                createdAt: serverTimestamp()
            });
            toast.success('Message archived. Our concierge will respond shortly.', { id: loadingToast });
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            toast.error('Transmission failure. Check connection.', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-white selection:bg-black selection:text-white">
            <div className="max-w-[1440px] mx-auto px-6 py-20 md:py-32 animate-fadeIn">
                
                {/* --- Editorial Header --- */}
                <header className="mb-24 md:mb-40 border-b border-gray-50 pb-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                        <div className="space-y-4">
                            <span className="text-[10px] uppercase tracking-[0.8em] text-gray-300 font-black italic block">Communication Hub</span>
                            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none text-black">Contact Archive</h1>
                        </div>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.3em] max-w-sm italic leading-relaxed">
                            যেকোনো জিজ্ঞাসা বা সহযোগিতার জন্য আমাদের কনসিয়ার্জ পোর্টালে বার্তা পাঠান। আমাদের টিম আপনার প্রতিটি বার্তার মূল্যায়ন করে।
                        </p>
                    </div>
                </header>

                <div className="grid lg:grid-cols-12 gap-20 xl:gap-32">
                    {/* --- Information Ledger --- */}
                    <div className="lg:col-span-5 space-y-20 order-2 lg:order-1">
                        <div className="space-y-16">
                            <div className="group space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all duration-500">
                                        <HiOutlineMail size={24} />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] italic">Direct Transmission</h3>
                                </div>
                                <div className="pl-1 text-left">
                                    <p className="text-lg font-black tracking-widest text-black underline decoration-gray-100 underline-offset-8">
                                        {contactInfo.email}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-4 italic">২৪ ঘণ্টার মধ্যে উত্তর প্রদানের নিশ্চয়তা</p>
                                </div>
                            </div>

                            <div className="group space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all duration-500">
                                        <HiOutlineLocationMarker size={24} />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] italic">Headquarters</h3>
                                </div>
                                <div className="pl-1 text-left">
                                    <p className="text-lg font-black tracking-widest text-black italic">
                                        {contactInfo.address}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-4 italic">ডিজিটাল ও লজিস্টিক সেন্টার</p>
                                </div>
                            </div>

                            <div className="group space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all duration-500">
                                        <HiOutlineChatAlt2 size={24} />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] italic">Live Concierge</h3>
                                </div>
                                <div className="pl-1 text-left">
                                    <p className="text-lg font-black tracking-widest text-black italic">WhatsApp Support Available</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-4 italic underline cursor-pointer">চ্যাট শুরু করুন</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Contact Portal Form --- */}
                    <div className="lg:col-span-7 order-1 lg:order-2">
                        <div className="bg-[#fdfdfd] border border-gray-50 p-8 md:p-16 rounded-sm shadow-[0_40px_100px_rgba(0,0,0,0.02)]">
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic mb-12">Initiate Message</h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 italic ml-1">Identifier Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="আপনার নাম" className="w-full bg-transparent border-b border-gray-100 py-4 text-[11px] font-bold tracking-widest focus:border-black outline-none transition-all uppercase italic" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 italic ml-1">Digital Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="আপনার ইমেইল" className="w-full bg-transparent border-b border-gray-100 py-4 text-[11px] font-bold tracking-widest focus:border-black outline-none transition-all lowercase italic" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 italic ml-1">Inquiry Protocol</label>
                                    <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="বার্তার বিষয়" className="w-full bg-transparent border-b border-gray-100 py-4 text-[11px] font-bold tracking-widest focus:border-black outline-none transition-all uppercase italic" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 italic ml-1">Narrative Message</label>
                                    <textarea name="message" value={formData.message} onChange={handleChange} placeholder="আপনার বার্তাটি লিখুন..." rows="5" className="w-full bg-gray-50/50 border border-gray-50 p-6 text-[11px] font-bold tracking-widest focus:border-black focus:bg-white outline-none transition-all italic rounded-sm"></textarea>
                                </div>
                                <div className="md:col-span-2 pt-6">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting} 
                                        className="group relative w-full md:w-auto bg-black text-white px-16 py-6 overflow-hidden shadow-2xl transition-all active:scale-95 disabled:opacity-30"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] italic">
                                            {isSubmitting ? 'Transmitting...' : 'Send Transmission'}
                                            <RiArrowRightLine className="text-xl group-hover:translate-x-2 transition-transform duration-500" />
                                        </span>
                                        <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* --- Status Branding --- */}
                <div className="mt-32 flex items-center justify-center gap-6 opacity-30 select-none pointer-events-none">
                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
                    <p className="text-[9px] uppercase tracking-[0.5em] font-black italic">Zaqeen Concierge Protocol 2026</p>
                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
                </div>
            </div>
        </main>
    );
}
