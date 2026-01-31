'use client';

import { HiOutlineSearch, HiOutlineShoppingBag, HiOutlineClipboardList, HiOutlineShieldCheck, HiOutlineTruck } from 'react-icons/hi';
import Link from 'next/link';

const HowToBuyPage = () => {
  const steps = [
    {
      id: "01",
      title: "আর্কাইভ অন্বেষণ করুন",
      icon: HiOutlineSearch,
      desc: "আমাদের কিউরেটেড কালেকশনগুলো ঘুরে দেখুন। প্রতিটি পলো শার্ট আমাদের দীর্ঘস্থায়ী স্টাইল এবং নির্দিষ্ট রুচির পরিচায়ক। আপনার পছন্দের আর্টিকেলের বিস্তারিত এবং স্পেসিফিকেশন দেখতে সেটিতে ক্লিক করুন।"
    },
    {
      id: "02",
      title: "পোর্টফোলিও সাজান",
      icon: HiOutlineShoppingBag,
      desc: "আপনার কাঙ্ক্ষিত সাইজ এবং কালার নির্বাচন করুন। 'Add to Bag' বাটনে ক্লিক করে মাস্টারপিসটি আপনার ব্যক্তিগত ব্যাগে যুক্ত করুন। আপনি চাইলে আরও আর্টিকেল অন্বেষণ করতে পারেন অথবা সরাসরি চেকআউটে যেতে পারেন।"
    },
    {
      id: "03",
      title: "সিলেকশন অডিট করুন",
      icon: HiOutlineClipboardList,
      desc: "আপনার ব্যাগটি একনজরে দেখে নিন। চূড়ান্ত ক্রয়ের আগে আপনার পছন্দের আইটেমগুলোর পরিমাণ পরিবর্তন বা রিফাইন করার এটাই শেষ সুযোগ।"
    },
    {
      id: "04",
      title: "সিকিউর আইডেন্টিটি পোর্টাল",
      icon: HiOutlineShieldCheck,
      desc: "আমাদের চেকআউট টার্মিনালে প্রবেশ করুন। আপনার ডেলিভারি লোকেশন এবং কন্টাক্ট ইনফরমেশন প্রদান করুন। আমাদের এন্ড-টু-এন্ড এনক্রিপ্টেড পোর্টাল আপনার ব্যক্তিগত তথ্যের সর্বোচ্চ নিরাপত্তা নিশ্চিত করে।"
    },
    {
      id: "05",
      title: "অ্যাকুইজিশন ও লজিস্টিকস",
      icon: HiOutlineTruck,
      desc: "আমাদের সুরক্ষিত পেমেন্ট চ্যানেলের মাধ্যমে লেনদেন সম্পন্ন করুন। সফলভাবে অর্ডার করার পর আপনি একটি ডিজিটাল ইনভয়েস পাবেন এবং আপনার কেনা আর্টিকেলটির শিপিং জার্নি ট্র্যাক করার জন্য একটি ট্র্যাকিং আইডি পাবেন।"
    }
  ];

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white">
      <div className="max-w-5xl mx-auto px-6 py-20 md:py-32">
        {/* Editorial Header */}
        <header className="text-center mb-24 md:mb-40">
          <span className="text-[10px] uppercase tracking-[0.6em] text-gray-300 font-black italic block mb-6">Manual Protocol</span>
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">কিভাবে সংগ্রহ করবেন</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 mt-10 max-w-lg mx-auto leading-loose font-bold italic">
            Zaqeen-এর লিমিটেড এডিশন আর্টিকেলগুলো সংগ্রহের একটি ধারাবাহিক গাইডলাইন।
          </p>
          <div className="w-16 h-[1px] bg-black mx-auto mt-12 opacity-10"></div>
        </header>

        {/* Steps Architecture */}
        <div className="space-y-32 md:space-y-48">
          {steps.map((step, idx) => (
            <div key={step.id} className={`flex flex-col md:flex-row items-center md:items-start gap-12 md:gap-24 ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
              
              {/* Step Number & Icon Design */}
              <div className="relative shrink-0 animate-fadeIn">
                <div className="text-[120px] md:text-[200px] font-black text-gray-50/70 leading-none select-none italic font-serif">
                  {step.id}
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white shadow-[0_30px_60px_rgba(0,0,0,0.1)] flex items-center justify-center rounded-full border border-gray-50 text-black group hover:scale-110 transition-transform duration-500">
                  <step.icon size={32} strokeWidth={1} />
                </div>
              </div>

              {/* Step Content */}
              <div className="pt-4 md:pt-16 space-y-8 max-w-md text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-widest italic leading-tight border-b border-gray-100 pb-4">
                  {step.title}
                </h3>
                <p className="text-[14px] font-medium leading-relaxed text-gray-500 italic">
                  {step.desc}
                </p>
                <div className="w-10 h-[1px] bg-black opacity-20 mx-auto md:mx-0"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <footer className="mt-48 pt-24 border-t border-gray-50 text-center space-y-10">
            <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.5em] font-black text-gray-300 italic">প্রযুক্তিগত সমস্যায় পড়েছেন?</p>
                <h4 className="text-xl font-black italic uppercase tracking-tighter">আমাদের কনসিয়ার্জের সাথে যোগাযোগ করুন</h4>
            </div>
            <Link 
              href="/contact" 
              className="group relative inline-block px-16 py-7 bg-black text-white text-[10px] font-black uppercase tracking-[0.6em] overflow-hidden transition-all shadow-2xl active:scale-95"
            >
              <span className="relative z-10">Contact Concierge</span>
              <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </Link>
        </footer>
      </div>
    </main>
  );
};

export default HowToBuyPage;
