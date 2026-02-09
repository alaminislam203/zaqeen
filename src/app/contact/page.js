'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ContactPage() {
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        phone: '',
        subject: '', 
        message: '' 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [contactInfo, setContactInfo] = useState({ 
        email: '', 
        phone: '',
        address: '',
        businessHours: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContactInfo = async () => {
            try {
                const docRef = doc(db, 'settings', 'site_config');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setContactInfo({
                        email: data.contactEmail || 'support@zaqeen.com',
                        phone: data.contactPhone || '+880 1234-567890',
                        address: data.contactAddress || 'Dhaka, Bangladesh',
                        businessHours: data.businessHours || 'Mon-Fri: 9AM-6PM'
                    });
                }
            } catch (err) {
                console.error("Error fetching contact info:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchContactInfo();
    }, []);

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'নাম আবশ্যক';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'নাম কমপক্ষে ২ অক্ষরের হতে হবে';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'ইমেইল আবশ্যক';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'সঠিক ইমেইল লিখুন';
        }

        // Phone validation (optional)
        if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
            newErrors.phone = 'সঠিক ফোন নাম্বার লিখুন';
        }

        // Subject validation
        if (!formData.subject.trim()) {
            newErrors.subject = 'বিষয় আবশ্যক';
        }

        // Message validation
        if (!formData.message.trim()) {
            newErrors.message = 'বার্তা আবশ্যক';
        } else if (formData.message.trim().length < 10) {
            newErrors.message = 'বার্তা কমপক্ষে ১০ অক্ষরের হতে হবে';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('দয়া করে সব ফিল্ড সঠিকভাবে পূরণ করুন', {
                style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
            });
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('বার্তা পাঠানো হচ্ছে...');

        try {
            await addDoc(collection(db, 'contacts'), {
                ...formData,
                status: 'Pending',
                read: false,
                createdAt: serverTimestamp()
            });

            toast.success('আপনার বার্তা সফলভাবে পাঠানো হয়েছে! আমরা শীঘ্রই উত্তর দেব।', { 
                id: loadingToast,
                style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
            });

            // Reset form
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
            setErrors({});

        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('বার্তা পাঠাতে ব্যর্থ। আবার চেষ্টা করুন।', { 
                id: loadingToast,
                style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const contactMethods = [
        {
            icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
            title: 'ইমেইল',
            titleEn: 'Email',
            value: contactInfo.email,
            description: '২৪ ঘণ্টার মধ্যে উত্তর',
            link: `mailto:${contactInfo.email}`,
            color: 'blue'
        },
        {
            icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
            title: 'ফোন',
            titleEn: 'Phone',
            value: contactInfo.phone,
            description: 'সরাসরি যোগাযোগ',
            link: `tel:${contactInfo.phone}`,
            color: 'green'
        },
        {
            icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
            title: 'ঠিকানা',
            titleEn: 'Address',
            value: contactInfo.address,
            description: contactInfo.businessHours,
            link: null,
            color: 'purple'
        },
        {
            icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
            title: 'লাইভ চ্যাট',
            titleEn: 'Live Chat',
            value: 'WhatsApp Support',
            description: 'তাৎক্ষণিক সহায়তা',
            link: 'https://wa.me/8801234567890',
            color: 'emerald'
        }
    ];

    const faqs = [
        {
            question: 'আমি কীভাবে আমার অর্ডার ট্র্যাক করব?',
            answer: 'অর্ডার কনফার্ম হওয়ার পর আপনার ইমেইল এবং SMS-এ একটি ট্র্যাকিং নাম্বার পাঠানো হবে। এই নাম্বার দিয়ে আমাদের Track Order পেজে গিয়ে আপনার অর্ডার ট্র্যাক করতে পারবেন।'
        },
        {
            question: 'রিটার্ন পলিসি কী?',
            answer: 'পণ্য পাওয়ার ৭ দিনের মধ্যে কোনো সমস্যা থাকলে রিটার্ন করতে পারবেন। পণ্য অব্যবহৃত এবং মূল প্যাকেজিংয়ে থাকতে হবে।'
        },
        {
            question: 'পেমেন্ট মেথড কী কী?',
            answer: 'আমরা ক্যাশ অন ডেলিভারি, bKash, Nagad, এবং অনলাইন পেমেন্ট গেটওয়ে সাপোর্ট করি।'
        },
        {
            question: 'কাস্টমার সাপোর্ট কখন পাওয়া যায়?',
            answer: `আমাদের কাস্টমার সাপোর্ট টিম ${contactInfo.businessHours} পর্যন্ত উপলব্ধ থাকে। ইমেইলের উত্তর ২৪ ঘণ্টার মধ্যে দেওয়া হয়।`
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-[9px] uppercase tracking-[0.4em] font-black text-gray-400">Loading...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white selection:bg-black selection:text-white">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
                
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black block mb-4">Communication Hub</span>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-4">যোগাযোগ করুন</h1>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 max-w-2xl mx-auto font-bold leading-relaxed">
                        যেকোনো জিজ্ঞাসা বা সহযোগিতার জন্য আমাদের সাথে যোগাযোগ করুন
                    </p>
                    <div className="w-16 h-px bg-black mx-auto mt-8 opacity-20"></div>
                </div>

                {/* Contact Methods Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {contactMethods.map((method, idx) => (
                        <div key={idx} className="bg-white border-2 border-gray-200 p-6 group hover:border-black transition-all">
                            <div className={`w-14 h-14 bg-${method.color}-100 flex items-center justify-center mb-4 group-hover:bg-black transition-all`}>
                                <svg className={`w-7 h-7 text-${method.color}-600 group-hover:text-white transition-all`} fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={method.icon} />
                                </svg>
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-wide mb-1">{method.title}</h3>
                            <p className="text-[9px] uppercase tracking-wide text-gray-400 font-bold mb-3">{method.titleEn}</p>
                            {method.link ? (
                                <a 
                                    href={method.link}
                                    className="text-sm font-bold text-gray-900 hover:text-black block break-words"
                                >
                                    {method.value}
                                </a>
                            ) : (
                                <p className="text-sm font-bold text-gray-900 break-words">{method.value}</p>
                            )}
                            <p className="text-[9px] text-gray-500 mt-2">{method.description}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-12 mb-20">
                    
                    {/* Contact Form */}
                    <div className="bg-white border-2 border-gray-200 p-8 md:p-12 shadow-lg order-2 lg:order-1">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">বার্তা পাঠান</h2>
                            <p className="text-sm text-gray-600">আমরা ২৪ ঘণ্টার মধ্যে উত্তর দেব</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    আপনার নাম *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="নাম লিখুন"
                                    className={`w-full px-4 py-3 bg-white border-2 ${
                                        errors.name ? 'border-red-500' : 'border-gray-200'
                                    } focus:border-black outline-none transition-all text-sm font-bold`}
                                />
                                {errors.name && (
                                    <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                    ইমেইল *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                    className={`w-full px-4 py-3 bg-white border-2 ${
                                        errors.email ? 'border-red-500' : 'border-gray-200'
                                    } focus:border-black outline-none transition-all text-sm font-bold lowercase`}
                                />
                                {errors.email && (
                                    <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                    </svg>
                                    ফোন (ঐচ্ছিক)
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+880 1234-567890"
                                    className={`w-full px-4 py-3 bg-white border-2 ${
                                        errors.phone ? 'border-red-500' : 'border-gray-200'
                                    } focus:border-black outline-none transition-all text-sm font-bold`}
                                />
                                {errors.phone && (
                                    <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            {/* Subject */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                    </svg>
                                    বিষয় *
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="বার্তার বিষয়"
                                    className={`w-full px-4 py-3 bg-white border-2 ${
                                        errors.subject ? 'border-red-500' : 'border-gray-200'
                                    } focus:border-black outline-none transition-all text-sm font-bold`}
                                />
                                {errors.subject && (
                                    <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.subject}
                                    </p>
                                )}
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                    </svg>
                                    বার্তা *
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="আপনার বার্তা লিখুন..."
                                    rows="6"
                                    className={`w-full px-4 py-3 bg-white border-2 ${
                                        errors.message ? 'border-red-500' : 'border-gray-200'
                                    } focus:border-black outline-none transition-all text-sm font-bold resize-none`}
                                ></textarea>
                                {errors.message && (
                                    <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="group relative w-full bg-black text-white py-5 text-[11px] font-black uppercase tracking-wider overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            পাঠানো হচ্ছে...
                                        </>
                                    ) : (
                                        <>
                                            বার্তা পাঠান
                                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                            </svg>
                                        </>
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            </button>
                        </form>
                    </div>

                    {/* FAQ Section */}
                    <div className="space-y-6 order-1 lg:order-2">
                        <div className="bg-white border-2 border-gray-200 p-8 mb-6">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-6">সাধারণ প্রশ্ন</h3>
                            <div className="space-y-4">
                                {faqs.map((faq, idx) => (
                                    <details key={idx} className="group">
                                        <summary className="cursor-pointer list-none flex items-center justify-between font-bold text-sm py-3 border-b border-gray-100 hover:text-black transition-all">
                                            {faq.question}
                                            <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </summary>
                                        <div className="pt-3 pb-2 text-sm text-gray-600 leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="bg-gradient-to-br from-black to-neutral-900 text-white p-8">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-6">দ্রুত লিঙ্ক</h3>
                            <div className="space-y-3">
                                {[
                                    { name: 'ট্র্যাক অর্ডার', link: '/track-order' },
                                    { name: 'শিপিং তথ্য', link: '/shipping-info' },
                                    { name: 'রিটার্ন পলিসি', link: '/return-policy' },
                                    { name: 'প্রাইভেসি পলিসি', link: '/privacy-policy' }
                                ].map((item, idx) => (
                                    <Link 
                                        key={idx}
                                        href={item.link}
                                        className="flex items-center justify-between group hover:translate-x-2 transition-transform py-2 border-b border-white/10"
                                    >
                                        <span className="text-sm font-bold">{item.name}</span>
                                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Media */}
                <div className="text-center py-12 bg-white border-2 border-gray-200">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-6">সোশ্যাল মিডিয়ায় আমাদের ফলো করুন</h3>
                    <div className="flex justify-center gap-4">
                        {[
                            { name: 'Facebook', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z', link: '#' },
                            { name: 'Instagram', icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01', link: '#' },
                            { name: 'Twitter', icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z', link: '#' }
                        ].map((social, idx) => (
                            <a
                                key={idx}
                                href={social.link}
                                className="w-12 h-12 bg-black text-white flex items-center justify-center hover:bg-neutral-800 transition-all"
                                title={social.name}
                            >
                                <svg className="w-6 h-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={social.icon} />
                                </svg>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Footer Badge */}
                <div className="mt-16 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 opacity-30">
                        <div className="h-px w-12 bg-black"></div>
                        <p className="text-[9px] uppercase tracking-wider font-black">Zaqeen Support v2.0</p>
                        <div className="h-px w-12 bg-black"></div>
                    </div>
                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wide">
                        We're here to help 24/7
                    </p>
                </div>
            </div>
        </main>
    );
}
