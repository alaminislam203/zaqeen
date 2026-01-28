'use client';
import Link from 'next/link';
import { HiOutlineArrowNarrowRight, HiOutlineSearch } from 'react-icons/hi';
import { RiCompassDiscoverLine } from 'react-icons/ri';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white flex flex-col">

      
      <div className="flex-grow flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Artistic Background Element */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <h1 className="text-[25vw] font-black italic text-gray-50 opacity-[0.4] select-none leading-none">
                404
            </h1>
        </div>

        <div className="relative z-10 space-y-8 max-w-2xl">
          {/* Header Section */}
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black italic block">System Alert</span>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic text-gray-900 leading-none">
                Path Lost in <br/> The Archive
            </h2>
            <div className="w-12 h-[1px] bg-black mx-auto mt-8 opacity-20"></div>
          </div>

          {/* Descriptive Text */}
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold max-w-sm mx-auto leading-relaxed">
            The article or coordinates you are seeking have been moved or no longer exist within the Zaqeen ecosystem.
          </p>

          {/* Action Hub */}
          <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
                href="/shop" 
                className="group relative w-full sm:w-auto px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.5em] overflow-hidden shadow-2xl"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <RiCompassDiscoverLine size={18} /> Re-explore Shop
              </span>
              <div className="absolute inset-0 bg-gray-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </Link>

            <Link 
                href="/" 
                className="text-[10px] font-black uppercase tracking-[0.4em] border-b-2 border-black pb-1 hover:text-gray-400 hover:border-gray-100 transition-all flex items-center gap-2"
            >
              Back to Origin <HiOutlineArrowNarrowRight />
            </Link>
          </div>

          {/* Quick Help Links */}
          <div className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40">
              <Link href="/contact" className="text-[8px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity underline underline-offset-4">Concierge</Link>
              <Link href="/about" className="text-[8px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity underline underline-offset-4">The Brand</Link>
              <Link href="/shipping-info" className="text-[8px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity underline underline-offset-4">Logistics</Link>
              <Link href="/return-policy" className="text-[8px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity underline underline-offset-4">Certainty Policy</Link>
          </div>
        </div>
      </div>

      {/* Security Footer Note */}
      <footer className="py-10 text-center opacity-10">
          <p className="text-[7px] uppercase tracking-[0.8em] font-black">Zaqeen Digital Experience v2.0 — Verified Session</p>
      </footer>
    </main>
  );
}
