'use client';

import { HiOutlineTruck, HiOutlineGlobe, HiOutlineClock, HiOutlineShieldCheck } from 'react-icons/hi';
import { RiMapPinLine, RiBox3Line } from 'react-icons/ri';
import Link from 'next/link';

export default function ShippingInfo() {
  const deliveryTiers = [
    {
      region: "ঢাকার ভেতরে",
      timing: "২৪ - ৪৮ ঘণ্টা",
      fee: "৳১২০",
      description: "শহরের মূল কেন্দ্রগুলোতে দ্রুততম এবং প্রায়োরিটি ডেলিভারি সেবা।"
    },
    {
      region: "ঢাকার বাইরে",
      timing: "৩ - ৫ কার্যদিবস",
      fee: "৳১২০",
      description: "আমাদের প্রিমিয়াম লজিস্টিক পার্টনারদের মাধ্যমে দেশজুড়ে নিরাপদ ডেলিভারি।"
    }
  ];

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-32">
        
        {/* Header Section: Editorial Style */}
        <div className="text-center mb-24">
          <span className="text-[10px] uppercase tracking-[0.6em] text-gray-300 font-black italic block mb-6">Logistics Architecture</span>
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic text-gray-900 leading-none">শিপিং ও ডেলিভারি</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 mt-10 max-w-xs mx-auto font-bold leading-relaxed italic">
            দেশজুড়ে Zaqeen-এর প্রতিটি আর্টিকেল পৌঁছানোর নিরাপদ ও দ্রুততর প্রক্রিয়া।
          </p>
          <div className="w-16 h-[1px] bg-black mx-auto mt-12 opacity-10"></div>
        </div>

        {/* Delivery Rates Grid: Minimalist Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-32">
          {deliveryTiers.map((tier, idx) => (
            <div key={idx} className="bg-[#fdfdfd] border border-gray-50 p-10 md:p-14 group hover:border-black transition-all duration-700 rounded-sm shadow-sm hover:shadow-2xl">
              <RiMapPinLine className="w-10 h-10 text-gray-200 group-hover:text-black transition-colors mb-10" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 mb-2 italic">Jurisdiction</h2>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-gray-900 mb-10 italic">
                {tier.region}
              </h3>
              
              <div className="space-y-6 pt-8 border-t border-gray-100">
                 <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                    <span className="text-gray-400 italic">Logistics Fee</span>
                    <span className="text-black">{tier.fee}</span>
                 </div>
                 <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                    <span className="text-gray-400 italic">Timeframe</span>
                    <span className="text-black">{tier.timing}</span>
                 </div>
                 <p className="text-[13px] text-gray-400 font-medium pt-4 italic leading-relaxed uppercase tracking-tight">
                   {tier.description}
                 </p>
              </div>
            </div>
          ))}
        </div>

        {/* Logistics Commitment: Technical Blueprint Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 border-y border-gray-50 py-24 mb-32">
          <div className="space-y-6 group">
             <HiOutlineClock className="w-8 h-8 text-black group-hover:scale-110 transition-transform" />
             <h4 className="text-[11px] font-black uppercase tracking-[0.4em] italic">কিউরেশন পিরিয়ড</h4>
             <p className="text-[13px] font-medium leading-loose text-gray-500 italic">
               Zaqeen-এর প্রতিটি পিস পাঠানোর আগে ১২ ঘণ্টার একটি কঠোর কোয়ালিটি অডিট সম্পন্ন করা হয়।
             </p>
          </div>
          <div className="space-y-6 group">
             <HiOutlineShieldCheck className="w-8 h-8 text-black group-hover:scale-110 transition-transform" />
             <h4 className="text-[11px] font-black uppercase tracking-[0.4em] italic">সুরক্ষিত প্যাকেজিং</h4>
             <p className="text-[13px] font-medium leading-loose text-gray-500 italic">
                আপনার অর্ডারগুলো টেম্পার-এভিডেন্ট প্যাকেজিংয়ে সিল করা হয়, যা পণ্যের শতভাগ সুরক্ষা নিশ্চিত করে।
             </p>
          </div>
          <div className="space-y-6 group">
             <RiBox3Line className="w-8 h-8 text-black group-hover:scale-110 transition-transform" />
             <h4 className="text-[11px] font-black uppercase tracking-[0.4em] italic">ট্র্যাকিং আইডি</h4>
             <p className="text-[13px] font-medium leading-loose text-gray-500 italic">
                শিপিংয়ের পর একটি ইউনিক ট্র্যাকিং কোড SMS-এর মাধ্যমে পাঠানো হয়, যা দিয়ে আপনি আপনার পার্সেল ট্র্যাক করতে পারবেন।
             </p>
          </div>
        </div>

        {/* Global Interest: Luxury Protocol Touch */}
        <section className="text-center py-16 bg-[#fcfcfc] rounded-sm border border-gray-50 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] flex items-center justify-center pointer-events-none">
              <HiOutlineGlobe size={300} />
           </div>
           
           <HiOutlineGlobe className="w-12 h-12 text-gray-200 mx-auto mb-8 animate-pulse" />
           <h3 className="text-sm md:text-base font-black uppercase tracking-[0.5em] mb-6 italic">International Acquisitions</h3>
           <p className="text-[11px] md:text-[12px] font-bold text-gray-400 uppercase tracking-[0.3em] max-w-md mx-auto leading-relaxed italic">
             আমরা বর্তমানে বাংলাদেশের ৬৪টি জেলায় ডেলিভারি প্রদান করছি। আন্তর্জাতিক শিপিং প্রোটোকল বর্তমানে প্রক্রিয়াধীন রয়েছে।
           </p>
           
           <div className="mt-16">
              <Link 
                href="/contact" 
                className="group relative inline-block px-14 py-6 bg-black text-white text-[10px] font-black uppercase tracking-[0.6em] overflow-hidden transition-all shadow-2xl active:scale-95"
              >
                <span className="relative z-10 italic">Speak with Concierge</span>
                <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </Link>
           </div>
        </section>

        {/* Brand Timeline Identity */}
        <div className="mt-32 flex flex-col items-center gap-6">
            <div className="flex items-center gap-6 opacity-30">
                <div className="h-[1px] w-16 bg-black"></div>
                <p className="text-[9px] uppercase tracking-[0.5em] font-black italic">Zaqeen Supply Chain v2.0</p>
                <div className="h-[1px] w-16 bg-black"></div>
            </div>
            <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest italic animate-pulse">
                Confidence Delivered with Certainty
            </p>
        </div>
      </div>
    </main>
  );
}
