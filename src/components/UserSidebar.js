'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    HiOutlineUser, HiOutlineShoppingBag, HiOutlineHeart, 
    HiOutlineLocationMarker, HiOutlineLogout, HiOutlineUserCircle, HiOutlineShieldCheck,
    HiMenuAlt4, HiX, HiChevronLeft 
} from 'react-icons/hi';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const UserSidebar = () => {
    const pathname = usePathname();
    const [userData, setUserData] = useState(null);
    const [isOpen, setIsOpen] = useState(false); // মোবাইলের জন্য
    const [isCollapsed, setIsCollapsed] = useState(false); // ডেস্কটপ কলাপস স্টেট

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                onSnapshot(userRef, (doc) => setUserData(doc.data()));
            }
        });
        return () => unsubscribe();
    }, []);

    const navItems = [
        { href: '/account', icon: <HiOutlineUser size={20} />, text: 'Profile' },
        { href: '/account/orders', icon: <HiOutlineShoppingBag size={20} />, text: 'Orders' },
        { href: '/account/wishlist', icon: <HiOutlineHeart size={20} />, text: 'WishList' },
        { href: '/account/portfolio', icon: <HiOutlineUserCircle size={20} />, text: 'Portfolio' },
        { href: '/account/address', icon: <HiOutlineLocationMarker size={20} />, text: 'Logistics' },
        { href: '/account/setting', icon: <HiOutlineShieldCheck size={20} />, text: 'Security' },
    ];

    const handleLogout = () => {
        auth.signOut();
        window.location.href = '/login';
    };

    return (
        <>
            {/* --- Mobile Header Trigger --- */}
            <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-50 sticky top-0 z-40">
                <span className="text-[10px] font-black uppercase tracking-widest italic">Identity Hub</span>
                <button onClick={() => setIsOpen(true)} className="p-2 bg-black text-white rounded-sm active:scale-90 transition-transform">
                    <HiMenuAlt4 size={20} />
                </button>
            </div>

            {/* --- Mobile Sidebar Overlay --- */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-500"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* --- Main Sidebar Architecture --- */}
            <div className={`
                fixed md:sticky top-0 md:top-32 left-0 h-screen md:h-fit bg-white z-[70] md:z-10
                transition-all duration-500 ease-in-out border-r md:border border-gray-50
                ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
                ${isCollapsed ? 'md:w-20' : 'md:w-72'}
            `}>
                
                {/* Desktop Collapse Toggle Button */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute -right-3 top-10 bg-black text-white rounded-full p-1 shadow-xl hover:scale-110 transition-transform z-50 border border-white/20"
                >
                    {isCollapsed ? <HiChevronLeft className="rotate-180" size={14} /> : <HiChevronLeft size={14} />}
                </button>

                {/* Close Button (Mobile Only) */}
                <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 md:hidden text-gray-400">
                    <HiX size={24} />
                </button>

                <div className={`flex flex-col h-full ${isCollapsed ? 'p-4' : 'p-10 md:p-8'}`}>
                    {/* User Info */}
                    <div className={`mb-16 space-y-4 transition-all duration-500 ${isCollapsed ? 'items-center text-center' : ''}`}>
                        <div className={`bg-black text-white rounded-full flex items-center justify-center font-black italic shadow-2xl transition-all duration-500 ${isCollapsed ? 'w-10 h-10 text-sm' : 'w-16 h-16 text-xl'}`}>
                            {userData?.name?.charAt(0) || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="animate-fadeIn">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-black leading-none truncate max-w-[180px]">
                                    {userData?.name || 'Authorized User'}
                                </h3>
                                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.4em] italic mt-2">
                                    [ Collector ]
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2 flex-grow">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link 
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    title={isCollapsed ? item.text : ''}
                                    className={`
                                        flex items-center gap-5 py-4 px-3 rounded-sm transition-all duration-500 group relative
                                        ${isActive ? 'bg-black text-white shadow-lg' : 'text-gray-300 hover:text-black hover:bg-gray-50'}
                                        ${isCollapsed ? 'justify-center' : ''}
                                    `}
                                >
                                    <span className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        {item.icon}
                                    </span>
                                    
                                    {!isCollapsed && (
                                        <span className="text-[10px] font-black uppercase tracking-[0.5em] italic whitespace-nowrap">
                                            {item.text}
                                        </span>
                                    )}

                                    {/* কলাপস অবস্থায় একটি ইন্ডিকেটর ডট */}
                                    {isActive && isCollapsed && (
                                        <div className="absolute right-1 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer / Logout */}
                    <div className="mt-16 pt-8 border-t border-gray-50">
                        <button 
                            onClick={handleLogout}
                            className={`flex items-center gap-5 text-gray-300 hover:text-rose-600 transition-all duration-500 group w-full ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? "Terminate" : ""}
                        >
                            <HiOutlineLogout size={20} className="group-hover:-translate-x-1 transition-transform" />
                            {!isCollapsed && (
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Terminate</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserSidebar;
