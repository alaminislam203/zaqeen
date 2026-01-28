'use client';

import { HiOutlineSearch, HiOutlineShoppingBag, HiOutlineClipboardList, HiOutlineShieldCheck, HiOutlineTruck } from 'react-icons/hi';

const HowToBuyPage = () => {
  const steps = [
    {
      id: "01",
      title: "Explore the Archive",
      icon: HiOutlineSearch,
      desc: "Navigate through our curated collections of premium apparel. Every piece is a testament to certainty and style. Select an article to view its narrative and specifications."
    },
    {
      id: "02",
      title: "Curate Your Portfolio",
      icon: HiOutlineShoppingBag,
      desc: "Choose your desired size and essence. Click 'Add to Bag' to include the masterpiece in your personal portfolio. You may continue to discover or proceed to finalize."
    },
    {
      id: "03",
      title: "Audit Your Selection",
      icon: HiOutlineClipboardList,
      desc: "Access your bag to review the chosen identities. This is the moment to adjust quantities or refine your selection before moving toward the final acquisition."
    },
    {
      id: "04",
      title: "Secure Identity Portal",
      icon: HiOutlineShieldCheck,
      desc: "Enter the checkout terminal. Provide your delivery coordinates and contact information. Our end-to-end encrypted portal ensures your data remains private and secure."
    },
    {
      id: "05",
      title: "Acquisition & Logistics",
      icon: HiOutlineTruck,
      desc: "Finalize the transaction through our secure payment channels. Upon success, you will receive a digital invoice and a tracking identity to trace your garment's journey."
    }
  ];

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white">
 
      
      <div className="max-w-5xl mx-auto px-6 py-20 md:py-32">
        {/* Editorial Header */}
        <header className="text-center mb-24 md:mb-40">
          <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black italic block mb-4">Manual</span>
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">How to Acquire</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 mt-8 max-w-md mx-auto leading-relaxed font-bold">
            A step-by-step guide to securing Zaqeen's limited edition curations.
          </p>
          <div className="w-12 h-[1px] bg-black mx-auto mt-12 opacity-20"></div>
        </header>

        <div className="space-y-32">
          {steps.map((step, idx) => (
            <div key={step.id} className={`flex flex-col md:flex-row items-start gap-12 md:gap-24 ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
              {/* Step Number & Icon */}
              <div className="relative shrink-0">
                <div className="text-[120px] md:text-[180px] font-black text-gray-50 leading-none select-none italic">
                  {step.id}
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white shadow-2xl flex items-center justify-center rounded-full border border-gray-50 text-black">
                  <step.icon size={28} />
                </div>
              </div>

              {/* Step Content */}
              <div className="pt-4 md:pt-12 space-y-6 max-w-md">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-widest italic leading-tight">
                  {step.title}
                </h3>
                <p className="text-[13px] font-light leading-loose text-gray-500 italic">
                  {step.desc}
                </p>
                <div className="w-8 h-[2px] bg-black opacity-10"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Support Call-to-Action */}
        <footer className="mt-40 pt-20 border-t border-gray-50 text-center space-y-8">
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-400">Facing a technical anomaly?</p>
            <a href="/contact" className="inline-block px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.5em] hover:bg-gray-800 transition-all shadow-2xl">
                Contact Concierge
            </a>
        </footer>
      </div>
    </main>
  );
};

export default HowToBuyPage;
