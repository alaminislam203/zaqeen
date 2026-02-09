'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function ShippingInfo() {
  const [settings, setSettings] = useState({
    shippingFee: 60,
    outsideShippingFee: 120,
    freeShippingThreshold: 2000
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rates');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'site_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            shippingFee: data.shippingFee || 60,
            outsideShippingFee: data.outsideShippingFee || 120,
            freeShippingThreshold: data.freeShippingThreshold || 2000
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const deliveryTiers = [
    {
      region: "ঢাকার ভেতরে",
      regionEn: "Inside Dhaka",
      timing: "২৪ - ৪৮ ঘণ্টা",
      timingEn: "24 - 48 Hours",
      fee: `৳${settings.shippingFee}`,
      description: "শহরের মূল কেন্দ্রগুলোতে দ্রুততম এবং প্রায়োরিটি ডেলিভারি সেবা।",
      descriptionEn: "Fastest priority delivery service to main city centers.",
      icon: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z'
    },
    {
      region: "ঢাকার বাইরে",
      regionEn: "Outside Dhaka",
      timing: "৩ - ৫ কার্যদিবস",
      timingEn: "3 - 5 Business Days",
      fee: `৳${settings.outsideShippingFee}`,
      description: "আমাদের প্রিমিয়াম লজিস্টিক পার্টনারদের মাধ্যমে দেশজুড়ে নিরাপদ ডেলিভারি।",
      descriptionEn: "Safe delivery nationwide through our premium logistics partners.",
      icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418'
    }
  ];

  const features = [
    {
      icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'কিউরেশন পিরিয়ড',
      titleEn: 'Curation Period',
      description: 'Zaqeen-এর প্রতিটি পিস পাঠানোর আগে ১২ ঘণ্টার একটি কঠোর কোয়ালিটি অডিট সম্পন্ন করা হয়।',
      descriptionEn: 'Every piece undergoes a 12-hour rigorous quality audit before shipping.'
    },
    {
      icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
      title: 'সুরক্ষিত প্যাকেজিং',
      titleEn: 'Secure Packaging',
      description: 'আপনার অর্ডারগুলো টেম্পার-এভিডেন্ট প্যাকেজিংয়ে সিল করা হয়, যা পণ্যের শতভাগ সুরক্ষা নিশ্চিত করে।',
      descriptionEn: 'Orders are sealed in tamper-evident packaging ensuring 100% product security.'
    },
    {
      icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
      title: 'ট্র্যাকিং আইডি',
      titleEn: 'Tracking ID',
      description: 'শিপিংয়ের পর একটি ইউনিক ট্র্যাকিং কোড SMS-এর মাধ্যমে পাঠানো হয়, যা দিয়ে আপনি আপনার পার্সেল ট্র্যাক করতে পারবেন।',
      descriptionEn: 'Receive a unique tracking code via SMS to monitor your parcel.'
    },
    {
      icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
      title: 'ক্যাশ অন ডেলিভারি',
      titleEn: 'Cash on Delivery',
      description: 'পণ্য হাতে পাওয়ার পর পেমেন্ট করুন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।',
      descriptionEn: 'Pay after receiving your product. No advance payment required.'
    },
    {
      icon: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
      title: 'সহজ রিটার্ন',
      titleEn: 'Easy Returns',
      description: '৭ দিনের মধ্যে সহজ রিটার্ন পলিসি। কোনো প্রশ্ন ছাড়াই পণ্য ফেরত দিন।',
      descriptionEn: 'Easy return policy within 7 days. Return products hassle-free.'
    },
    {
      icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
      title: 'দ্রুত ডেলিভারি',
      titleEn: 'Fast Delivery',
      description: 'ঢাকায় ২৪-৪৮ ঘন্টায় এবং ঢাকার বাইরে ৩-৫ দিনে পৌঁছানো হয়।',
      descriptionEn: '24-48 hours in Dhaka and 3-5 days outside Dhaka.'
    }
  ];

  const faqs = [
    {
      question: 'ডেলিভারি চার্জ কত?',
      answer: `ঢাকার ভেতরে ৳${settings.shippingFee} এবং ঢাকার বাইরে ৳${settings.outsideShippingFee}। তবে ৳${settings.freeShippingThreshold} টাকার উপরে অর্ডারে ফ্রি ডেলিভারি পাবেন।`
    },
    {
      question: 'কতদিনে পণ্য পাব?',
      answer: 'ঢাকার ভেতরে ২৪-৪৮ ঘন্টা এবং ঢাকার বাইরে ৩-৫ কার্যদিবসের মধ্যে পণ্য পৌঁছে যাবে।'
    },
    {
      question: 'অর্ডার ট্র্যাক করব কীভাবে?',
      answer: 'অর্ডার কনফার্ম হওয়ার পর আপনার মোবাইলে একটি ট্র্যাকিং নাম্বার SMS এর মাধ্যমে পাঠানো হবে। এই নাম্বার দিয়ে আপনি আমাদের ওয়েবসাইটে গিয়ে আপনার পার্সেল ট্র্যাক করতে পারবেন।'
    },
    {
      question: 'পেমেন্ট কীভাবে করব?',
      answer: 'আমরা ক্যাশ অন ডেলিভারি সুবিধা প্রদান করি। পণ্য হাতে পেয়ে পেমেন্ট করতে পারবেন। এছাড়াও bKash, Nagad এবং অনলাইন পেমেন্ট সুবিধা রয়েছে।'
    },
    {
      question: 'রিটার্ন পলিসি কী?',
      answer: 'পণ্য পাওয়ার ৭ দিনের মধ্যে কোনো সমস্যা থাকলে রিটার্ন করতে পারবেন। পণ্য অব্যবহৃত এবং মূল প্যাকেজিংয়ে থাকতে হবে।'
    },
    {
      question: 'ফ্রি শিপিং কীভাবে পাব?',
      answer: `৳${settings.freeShippingThreshold} টাকা বা তার বেশি মূল্যের অর্ডারে সম্পূর্ণ ফ্রি শিপিং পাবেন দেশের যেকোনো স্থানে।`
    }
  ];

  const tabs = [
    { id: 'rates', label: 'ডেলিভারি রেট', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' },
    { id: 'features', label: 'সুবিধাসমূহ', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'faq', label: 'সাধারণ প্রশ্ন', icon: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z' }
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
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black block mb-4">Logistics Architecture</span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-4">শিপিং ও ডেলিভারি</h1>
          <p className="text-[11px] uppercase tracking-wide text-gray-500 max-w-2xl mx-auto font-bold leading-relaxed">
            দেশজুড়ে Zaqeen-এর প্রতিটি আর্টিকেল পৌঁছানোর নিরাপদ ও দ্রুততর প্রক্রিয়া
          </p>
          <div className="w-16 h-px bg-black mx-auto mt-8 opacity-20"></div>
        </div>

        {/* Free Shipping Banner */}
        <div className="mb-12 p-6 md:p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg className="w-8 h-8 text-green-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">ফ্রি শিপিং!</h3>
          </div>
          <p className="text-sm font-bold text-green-800">
            ৳{settings.freeShippingThreshold} টাকার উপরে অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি পাবেন
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* Delivery Rates Tab */}
          {activeTab === 'rates' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {deliveryTiers.map((tier, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white border-2 border-gray-200 p-8 group hover:border-black transition-all shadow-lg hover:shadow-2xl"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-black text-white flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d={tier.icon} />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">{tier.region}</h3>
                        <p className="text-[9px] uppercase tracking-wide text-gray-500 font-bold">{tier.regionEn}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-6 border-t-2 border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wide text-gray-500">ডেলিভারি ফি</span>
                        <span className="text-xl font-black">{tier.fee}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wide text-gray-500">সময়সীমা</span>
                        <span className="text-sm font-black">{tier.timing}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed pt-4">
                        {tier.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Track Order CTA */}
              <div className="mt-12 p-8 bg-gray-900 text-white text-center">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4">আপনার অর্ডার ট্র্যাক করুন</h3>
                <p className="text-sm text-gray-400 mb-6">অর্ডার আইডি দিয়ে রিয়েল-টাইম ডেলিভারি স্ট্যাটাস দেখুন</p>
                <Link 
                  href="/track-order"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black text-[10px] font-black uppercase tracking-wide hover:bg-gray-100 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  ট্র্যাক করুন
                </Link>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-gray-200 p-6 group hover:border-black transition-all"
                >
                  <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                    </svg>
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-wide mb-2">{feature.title}</h4>
                  <p className="text-[9px] uppercase tracking-wide text-gray-400 font-bold mb-3">{feature.titleEn}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {faqs.map((faq, idx) => (
                <details 
                  key={idx} 
                  className="bg-white border border-gray-200 group"
                >
                  <summary className="p-6 cursor-pointer list-none flex items-center justify-between font-black text-sm uppercase tracking-wide hover:bg-gray-50 transition-all">
                    {faq.question}
                    <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <section className="mt-20 text-center py-16 bg-white border-2 border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] flex items-center justify-center pointer-events-none">
            <svg className="w-96 h-96" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
           
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
          <h3 className="text-xl font-black uppercase tracking-wide mb-4">আন্তর্জাতিক শিপিং</h3>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            আমরা বর্তমানে বাংলাদেশের ৬৪টি জেলায় ডেলিভারি প্রদান করছি। আন্তর্জাতিক শিপিং প্রোটোকল বর্তমানে প্রক্রিয়াধীন রয়েছে। বিশেষ কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।
          </p>
          
          <Link 
            href="/contact" 
            className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white text-[10px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            যোগাযোগ করুন
          </Link>
        </section>

        {/* Footer Badge */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 opacity-30">
            <div className="h-px w-12 bg-black"></div>
            <p className="text-[9px] uppercase tracking-wider font-black">Zaqeen Supply Chain v2.0</p>
            <div className="h-px w-12 bg-black"></div>
          </div>
          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wide">
            Confidence Delivered with Certainty
          </p>
        </div>
      </div>
    </main>
  );
}
