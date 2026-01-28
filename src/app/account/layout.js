'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineUserCircle, HiOutlineShoppingBag, HiOutlineHeart, HiOutlineCog, HiOutlineLogout } from 'react-icons/hi';
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';

export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Portfolio", path: "/account", icon: HiOutlineUserCircle },
    { name: "Acquisitions", path: "/account/orders", icon: HiOutlineShoppingBag },
    { name: "Wishlist", path: "/account/wishlist", icon: HiOutlineHeart },
    { name: "Preferences", path: "/account/settings", icon: HiOutlineCog },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Identity Secured. Session Ended.");
      router.push("/");
    } catch (err) {
      toast.error("Logout interrupted.");
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD]">
  
      
      <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-24">
        <div className="flex flex-col lg:flex-row gap-16 xl:gap-24 items-start">
          
          {/* Sidebar: Navigation Engine */}
          <aside className="w-full lg:w-[280px] lg:sticky lg:top-32 shrink-0">
            <div className="mb-12">
               <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold italic block mb-3">Concierge</span>
               <h2 className="text-2xl font-black uppercase tracking-tighter italic text-gray-900 border-l-4 border-black pl-4">
                  My Studio
               </h2>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    className={`group relative flex items-center gap-4 px-6 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 overflow-hidden ${
                      isActive ? "text-white" : "text-gray-400 hover:text-black"
                    }`}
                  >
                    {/* Background Slide Effect */}
                    <div className={`absolute inset-0 bg-black transition-transform duration-500 -z-10 ${
                      isActive ? "translate-x-0" : "-translate-x-full group-hover:translate-x-[-95%]"
                    }`}></div>

                    <item.icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                    <span className="relative">{item.name}</span>
                  </Link>
                );
              })}
              
              <div className="pt-8 mt-8 border-t border-gray-100">
                <button 
                  onClick={handleLogout} 
                  className="group flex items-center gap-4 px-6 py-5 w-full text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 hover:bg-rose-50 transition-all duration-500 border border-transparent hover:border-rose-100"
                >
                  <HiOutlineLogout className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  Sign Out
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Content: The Stage */}
          <div className="flex-1 w-full animate-fadeIn min-h-[600px]">
            <div className="bg-white border border-gray-50 p-8 md:p-14 shadow-[0_20px_60px_rgba(0,0,0,0.02)] rounded-sm">
              {children}
            </div>
            
            {/* Contextual Support Info */}
            <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-6 opacity-30 px-2">
               <p className="text-[9px] uppercase tracking-widest font-bold">Zaqeen Core Membership v2.0</p>
               <div className="flex gap-8">
                  <Link href="/help" className="text-[9px] uppercase tracking-widest font-bold hover:opacity-100">Client Service</Link>
                  <Link href="/terms" className="text-[9px] uppercase tracking-widest font-bold hover:opacity-100">Legal Archives</Link>
               </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}