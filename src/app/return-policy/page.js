'use client';

import { HiOutlineRefresh, HiOutlineShieldCheck, HiOutlineTruck, HiOutlineChatAlt } from 'react-icons/hi';

export default function ReturnPolicy() {
  const policies = [
    {
      title: "The 7-Day Window",
      desc: "Items must be returned within 7 days of delivery. Every garment is a masterpiece; we expect it to return in its original, pristine condition.",
      icon: HiOutlineRefresh
    },
    {
      title: "Quality Assurance",
      desc: "Product tags must remain attached. Items showing signs of wear, wash, or alteration will be returned to the client.",
      icon: HiOutlineShieldCheck
    },
    {
      title: "Logistics",
      desc: "Complimentary returns are available for manufacturing defects. For size exchanges, a nominal logistics fee may apply.",
      icon: HiOutlineTruck
    },
    {
      title: "Concierge Support",
      desc: "Our team is here to assist your exchange journey. Reach out via our concierge portal for immediate resolution.",
      icon: HiOutlineChatAlt
    }
  ];

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white">
     
      
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-32">
        {/* Header Section */}
        <div className="text-center mb-24">
          <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-black italic block mb-4">Client Certainty</span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic text-gray-900">Returns & Exchanges</h1>
          <div className="w-12 h-[1px] bg-black mx-auto mt-10"></div>
        </div>

        {/* Policy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
          {policies.map((item, idx) => (
            <div key={idx} className="group space-y-6">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all duration-500">
                <item.icon size={24} />
              </div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-900 italic">{item.title}</h2>
              <p className="text-[13px] font-light leading-loose text-gray-500 max-w-sm">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Detailed Terms (Minimalist Accordion Style) */}
        <section className="bg-[#fcfcfc] border border-gray-50 p-10 md:p-16 rounded-sm space-y-12">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest border-b border-gray-100 pb-4">Refund Methodology</h3>
            <p className="text-[12px] leading-relaxed text-gray-600 italic">
              Once approved, refunds are processed within 5-7 business days through the original payment method (bKash/Nagad/Bank).
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest border-b border-gray-100 pb-4">Exclusions</h3>
            <p className="text-[12px] leading-relaxed text-gray-600 italic">
              Archived sale items and personalized garments are ineligible for return unless a structural defect is present.
            </p>
          </div>

          <div className="pt-10 flex flex-col items-center gap-6">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Need immediate assistance?</p>
            <a href="/contact" className="text-[11px] font-black uppercase tracking-[0.4em] border-b-2 border-black pb-1 hover:text-gray-400 hover:border-gray-100 transition-all">
              Initiate a Return
            </a>
          </div>
        </section>

        {/* Status indicator */}
        <div className="mt-20 flex items-center justify-center gap-4 opacity-20">
            <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
            <p className="text-[8px] uppercase tracking-widest font-bold">Zaqeen Protocol 2026 — Verified Policy</p>
            <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
        </div>
      </div>
    </main>
  );
}
