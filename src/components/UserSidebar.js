'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    HiOutlineUser, HiOutlineShoppingBag, HiOutlineHeart, 
    HiOutlineLocationMarker, HiOutlineLogout, HiOutlineUserCircle, HiOutlineShieldCheck,
    HiMenuAlt4, HiX 
} from 'react-icons/hi';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const UserSidebar = () => {
    const pathname = usePathname();
    const [userData, setUserData] = useState(null);
    const [isOpen, setIsOpen] = useState(false); // মোবাইলের জন্য স্টেট

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
                <button onClick={() => setIsOpen(true)} className="p-2 bg-black text-white">
                    <HiMenuAlt4 size={20} />
                </button>
            </div>

            {/* --- Sidebar Overlay (Mobile) --- */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* --- Main Sidebar Architecture --- */}
            <div className={`
                fixed md:sticky top-0 md:top-32 left-0 h-screen md:h-fit w-72 bg-white z-[70] md:z-10
                transition-transform duration-500 ease-in-out border-r md:border border-gray-50
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                
                {/* Close Button (Mobile Only) */}
                <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-6 right-6 md:hidden text-gray-400"
                >
                    <HiX size={24} />
                </button>

                <div className="p-10 md:p-8 flex flex-col h-full">
                    {/* User Info */}
                    <div className="mb-16 space-y-4">
                        <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-xl font-black italic shadow-2xl">
                            {userData?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-black leading-none">
                                {userData?.name || 'Authorized User'}
                            </h3>
                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.4em] italic">
                                [ Protocol: Collector ]
                            </p>
                        </div>
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
                                    className={`
                                        flex items-center gap-5 py-4 px-2 border-b border-transparent transition-all duration-500 group
                                        ${isActive ? 'text-black' : 'text-gray-300 hover:text-black'}
                                    `}
                                >
                                    <span className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">
                                        {item.text}
                                    </span>
                                    {isActive && <div className="w-1.5 h-1.5 bg-black rounded-full ml-auto animate-pulse"></div>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer / Logout */}
                    <div className="mt-auto pt-10 border-t border-gray-50">
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-5 text-gray-300 hover:text-rose-600 transition-all duration-500 group w-full"
                        >
                            <HiOutlineLogout size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Terminate</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserSidebar;
