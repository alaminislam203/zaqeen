'use client';
import Link from 'next/link';
import { RiInstagramLine, RiFacebookCircleLine, RiPinterestLine } from 'react-icons/ri';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-24 pb-12 selection:bg-black selection:text-white">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
          
          {/* Brand Manifesto */}
          <div className="md:col-span-4 space-y-8">
            <h2 className="text-3xl font-black tracking-[0.5em] uppercase italic leading-none">Zaqeen</h2>
            <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-[0.2em] font-medium max-w-xs">
              Curating confidence through minimalist aesthetics and premium craftsmanship. A testament to boutique lifestyle.
            </p>
            {/* Social Links */}
            <div className="flex gap-6 pt-4 text-gray-300">
               <a href="#" className="hover:text-black transition-colors"><RiInstagramLine size={20} /></a>
               <a href="#" className="hover:text-black transition-colors"><RiFacebookCircleLine size={20} /></a>
               <a href="#" className="hover:text-black transition-colors"><RiPinterestLine size={20} /></a>
            </div>
          </div>

          {/* Nav: Curations */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-black italic">Archive</h4>
            <ul className="space-y-5 text-[9px] text-gray-400 uppercase tracking-[0.3em] font-bold">
              <li className="hover:text-black transition-all"><Link href="/shop">The Shop</Link></li>
              <li className="hover:text-black transition-all"><Link href="/shop?category=new">New Arrivals</Link></li>
              <li className="hover:text-black transition-all"><Link href="/shop?category=best">Masterpieces</Link></li>
              <li className="hover:text-black transition-all"><Link href="/about">Philosophy</Link></li>
            </ul>
          </div>

          {/* Nav: Concierge */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-black italic">Concierge</h4>
            <ul className="space-y-5 text-[9px] text-gray-400 uppercase tracking-[0.3em] font-bold">
              <li className="hover:text-black transition-all"><Link href="/shipping-info">Logistics</Link></li>
              <li className="hover:text-black transition-all"><Link href="/return-policy">Policy</Link></li>
              <li className="hover:text-black transition-all"><Link href="/track-order">Trace Journey</Link></li>
              <li className="hover:text-black transition-all"><Link href="/how-to-buy">Manual</Link></li>
              <li className="hover:text-black transition-all"><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Newsletter Access */}
          <div className="md:col-span-4 space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-black italic">Intelligence</h4>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Sign up for early access to limited curations.</p>
            <div className="flex border-b border-gray-100 pb-3 group focus-within:border-black transition-all">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className="bg-transparent outline-none text-[10px] w-full placeholder:text-gray-200 font-black tracking-widest" 
              />
              <button className="text-[10px] font-black tracking-widest hover:italic">JOIN</button>
            </div>
          </div>
        </div>

        {/* Legal & Security Footer */}
        <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[8px] text-gray-300 uppercase tracking-[0.5em] font-black italic">
            &copy; {new Date().getFullYear()} Zaqeen Ventures — All Rights Reserved.
          </p>
          
          {/* Trust Signals */}
          <div className="flex items-center gap-8 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             <span className="text-[7px] font-black tracking-[0.3em] uppercase">Secure Payments</span>
             {/* Replace with actual payment SVG icons if available */}
             <div className="flex gap-4 items-center">
                <div className="w-8 h-4 bg-gray-100 rounded-sm"></div>
                <div className="w-8 h-4 bg-gray-100 rounded-sm"></div>
                <div className="w-8 h-4 bg-gray-100 rounded-sm"></div>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
