'use client';

import { HiOutlineRefresh, HiOutlineShieldCheck, HiOutlineTruck, HiOutlineChatAlt } from 'react-icons/hi';
import Link from 'next/link';

export default function ReturnPolicy() {
  const policies = [
    {
      title: "৭ দিনের বিনিময় প্রোটোকল",
      desc: "পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে বিনিময়ের সুযোগ রয়েছে। আমাদের প্রতিটি গার্মেন্টস একটি মাস্টারপিস; তাই আমরা আশা করি এটি তার আদি এবং নিখুঁত অবস্থায় আমাদের কাছে ফিরে আসবে।",
      icon: HiOutlineRefresh
    },
    {
      title: "কোয়ালিটি অ্যাসিউরেন্স",
      desc: "পণ্যের অরিজিনাল ট্যাগ অবশ্যই সংযুক্ত থাকতে হবে। পরনের চিহ্ন, ধোয়া হয়েছে এমন বা পরিবর্তন করা হয়েছে এমন কোনো পণ্য রিটার্ন হিসেবে গ্রহণ করা হবে না।",
      icon: HiOutlineShieldCheck
    },
    {
      title: "লজিস্টিকস ও শিপিং",
      desc: "ম্যানুফ্যাকচারিং ত্রুটির ক্ষেত্রে আমরা সম্পূর্ণ বিনামূল্যে রিটার্ন গ্রহণ করি। সাইজ পরিবর্তনের ক্ষেত্রে একটি সামান্য লজিস্টিকস ফি প্রযোজ্য হতে পারে।",
      icon: HiOutlineTruck
    },
    {
      title: "কনসিয়ার্জ সাপোর্ট",
      desc: "বিনিময় প্রক্রিয়ায় আপনাকে সহায়তার জন্য আমাদের টিম সর্বদা প্রস্তুত। যেকোনো প্রয়োজনে আমাদের কনসিয়ার্জ পোর্টালে যোগাযোগ করুন দ্রুত সমাধানের জন্য।",
      icon: HiOutlineChatAlt
    }
  ];

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-32">
        
        {/* Header Section: Editorial Style */}
        <div className="text-center mb-24">
          <span className="text-[10px] uppercase tracking-[0.6em] text-gray-300 font-black italic block mb-6">Client Certainty</span>
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic text-gray-900 leading-none">রিটার্ন ও এক্সচেঞ্জ</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 mt-10 max-w-xs mx-auto font-bold leading-relaxed">
            আপনার কেনাকাটার প্রতিটি ধাপে শতভাগ নিশ্চয়তা নিশ্চিত করাই Zaqeen-এর লক্ষ্য।
          </p>
          <div className="w-16 h-[1px] bg-black mx-auto mt-12 opacity-10"></div>
        </div>

        {/* Policy Grid Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-24 mb-32">
          {policies.map((item, idx) => (
            <div key={idx} className="group space-y-6 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white group-hover:shadow-2xl transition-all duration-700">
                <item.icon size={28} strokeWidth={1} />
              </div>
              <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-gray-900 italic border-l-2 border-transparent group-hover:border-black pl-0 group-hover:pl-4 transition-all duration-500">
                {item.title}
              </h2>
              <p className="text-[14px] font-medium leading-[2] text-gray-500 max-w-sm italic">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Detailed Methodology: Minimalist Console */}
        <section className="bg-[#fdfdfd] border border-gray-50 p-10 md:p-20 rounded-sm space-y-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
             <HiOutlineShieldCheck size={120} />
          </div>

          <div className="space-y-6 relative z-10">
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-black border-b border-gray-100 pb-4 italic">রিফান্ড মেথডোলজি</h3>
            <p className="text-[13px] leading-loose text-gray-600 italic font-medium">
              রিটার্ন অনুমোদিত হওয়ার পর, ৫-৭ কার্যদিবসের মধ্যে আপনার অরিজিনাল পেমেন্ট মেথড (বিকাশ/নগদ/ব্যাংক)-এ রিফান্ড প্রসেস করা হবে।
            </p>
          </div>

          <div className="space-y-6 relative z-10">
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-black border-b border-gray-100 pb-4 italic">বর্জনীয় বিষয়াবলী (Exclusions)</h3>
            <p className="text-[13px] leading-loose text-gray-600 italic font-medium">
              আর্কাইভ সেল আইটেম এবং পার্সোনালাইজড বা কাস্টমাইজড পোশাকগুলো রিটার্ন বা বিনিময়ের জন্য যোগ্য নয়, যদি না সেগুলোতে কোনো স্ট্রাকচারাল ত্রুটি থাকে।
            </p>
          </div>

          <div className="pt-12 flex flex-col items-center gap-8">
            <p className="text-[9px] uppercase tracking-[0.4em] font-black text-gray-300">তাত্ক্ষণিক সহায়তার প্রয়োজন?</p>
            <Link 
              href="/contact" 
              className="group relative px-16 py-6 bg-black text-white text-[10px] font-black uppercase tracking-[0.6em] overflow-hidden transition-all shadow-2xl active:scale-95"
            >
              <span className="relative z-10 italic">Initiate a Return</span>
              <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </Link>
          </div>
        </section>

        {/* Policy Status Branding */}
        <div className="mt-24 flex items-center justify-center gap-6 opacity-30">
            <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
            <p className="text-[9px] uppercase tracking-[0.5em] font-black italic">Zaqeen Protocol 2026 — Verified Archive</p>
            <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
        </div>
      </div>
    </main>
  );
}
