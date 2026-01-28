import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="space-y-6">
            <h2 className="text-2xl font-black tracking-[0.4em] uppercase">Zaqeen</h2>
            <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-tighter">
              Redefining confidence through minimal aesthetics and premium craftsmanship.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-6">Collections</h4>
            <ul className="space-y-4 text-[11px] text-gray-500 uppercase tracking-widest font-medium">
              <li className="hover:text-black"><Link href="/products">Summer '26</Link></li>
              <li className="hover:text-black"><Link href="/products">New Arrivals</Link></li>
              <li className="hover:text-black"><Link href="/products">Best Sellers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-4 text-[11px] text-gray-500 uppercase tracking-widest font-medium">
              <li className="hover:text-black"><Link href="/shipping-info">Shipping Info</Link></li>
              <li className="hover:text-black"><Link href="/return-policy">Return Policy</Link></li>
              <li className="hover:text-black"><Link href="/orders">Track Order</Link></li>
              <li className="hover:text-black"><Link href="/how-to-buy">How to Buy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-6">Newsletter</h4>
            <div className="flex border-b border-black pb-2">
              <input 
                type="email" 
                placeholder="ENTER YOUR EMAIL" 
                className="bg-transparent outline-none text-[10px] w-full placeholder:text-gray-300" 
              />
              <button className="text-[10px] font-bold">JOIN</button>
            </div>
          </div>
        </div>
        <div className="text-center pt-10 border-t border-gray-50">
          <p className="text-[9px] text-gray-400 uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} Zaqeen — Confidence in Every Thread.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
