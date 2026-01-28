'use client';

import { HiOutlineTruck, HiOutlineGlobe, HiOutlineClock, HiOutlineShieldCheck } from 'react-icons/hi';
import { RiMapPinLine, RiBox3Line } from 'react-icons/ri';

export default function ShippingInfo() {
  const deliveryTiers = [
    {
      region: "Inside Dhaka",
      timing: "24 - 48 Hours",
      fee: "৳60",
      description: "Express priority delivery within the city heart."
    },
    {
      region: "Outside Dhaka",
      timing: "3 - 5 Business Days",
      fee: "৳120",
      description: "Secure nationwide logistics via premium partners."
    }
  ];

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white">

      
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-32">
        {/* Header Section */}
        <div className="text-center mb-24">
          <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-black italic block mb-4">Logistics Architecture</span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic text-gray-900">Shipping & Delivery</h1>
          <div className="w-16 h-[1px] bg-black mx-auto mt-10 opacity-20"></div>
        </div>

        {/* Delivery Rates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-24">
          {deliveryTiers.map((tier, idx) => (
            <div key={idx} className="bg-[#fcfcfc] border border-gray-50 p-10 group hover:border-black transition-all duration-700 rounded-sm">
              <RiMapPinLine className="w-8 h-8 text-gray-300 group-hover:text-black transition-colors mb-8" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 italic">Jurisdiction</h2>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-6">{tier.region}</h3>
              <div className="space-y-4 pt-6 border-t border-gray-100">
                 <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                    <span className="text-gray-400">Logistics Fee</span>
                    <span className="text-black">{tier.fee}</span>
                 </div>
                 <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                    <span className="text-gray-400">Timeframe</span>
                    <span className="text-black">{tier.timing}</span>
                 </div>
                 <p className="text-[12px] text-gray-400 font-light pt-4 italic leading-relaxed">
                   {tier.description}
                 </p>
              </div>
            </div>
          ))}
        </div>

        {/* Logistics Commitment Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 border-y border-gray-50 py-20 mb-24">
          <div className="space-y-4">
             <HiOutlineClock className="w-6 h-6 text-black" />
             <h4 className="text-[11px] font-black uppercase tracking-[0.3em]">Curation Period</h4>
             <p className="text-[12px] font-light leading-loose text-gray-500">
               Every Zaqeen piece undergoes a 12-hour quality audit before being released for dispatch.
             </p>
          </div>
          <div className="space-y-4">
             <HiOutlineShieldCheck className="w-6 h-6 text-black" />
             <h4 className="text-[11px] font-black uppercase tracking-[0.3em]">Tamper Protection</h4>
             <p className="text-[12px] font-light leading-loose text-gray-500">
               Orders are sealed in eco-conscious, tamper-evident packaging to ensure total certainty.
             </p>
          </div>
          <div className="space-y-4">
             <RiBox3Line className="w-6 h-6 text-black" />
             <h4 className="text-[11px] font-black uppercase tracking-[0.3em]">Tracking ID</h4>
             <p className="text-[12px] font-light leading-loose text-gray-500">
               Upon dispatch, a unique identity code is shared via SMS for real-time journey tracing.
             </p>
          </div>
        </div>

        {/* Global Interest Section (Luxury Touch) */}
        <section className="text-center py-10">
           <HiOutlineGlobe className="w-10 h-10 text-gray-100 mx-auto mb-6 animate-spin-slow" />
           <h3 className="text-sm font-black uppercase tracking-[0.4em] mb-4">International Acquisitions</h3>
           <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest max-w-md mx-auto leading-loose">
             We currently serve all 64 districts of Bangladesh. International shipping protocols are in development.
           </p>
           <div className="mt-12">
              <a href="/contact" className="text-[10px] font-black uppercase tracking-[0.5em] border-b-2 border-black pb-1 hover:text-gray-400 hover:border-gray-100 transition-all">
                Speak with Concierge
              </a>
           </div>
        </section>

        {/* Footer Identity */}
        <div className="mt-32 flex items-center justify-center gap-6 opacity-30">
            <div className="h-[1px] w-12 bg-black"></div>
            <p className="text-[9px] uppercase tracking-[0.3em] font-bold">Zaqeen Supply Chain v2.0</p>
            <div className="h-[1px] w-12 bg-black"></div>
        </div>
      </div>
    </main>
  );
}
