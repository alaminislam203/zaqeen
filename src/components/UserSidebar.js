'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';

const UserSidebar = () => {
    const pathname = usePathname();
    const [userData, setUserData] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [stats, setStats] = useState({ orders: 0, wishlist: 0 });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setUserData(doc.data());
                    }
                });

                // Load user stats (optional)
                // You can add real-time listeners for orders and wishlist counts
            }
        });
        return () => unsubscribe();
    }, []);

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const navItems = [
        { 
            href: '/account', 
            icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, 
            text: 'Profile',
            description: 'Personal Info'
        },
        { 
            href: '/account/orders', 
            icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>, 
            text: 'Orders',
            description: 'Order History',
            badge: stats.orders > 0 ? stats.orders : null
        },
        { 
            href: '/account/wishlist', 
            icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>, 
            text: 'Wishlist',
            description: 'Saved Items',
            badge: stats.wishlist > 0 ? stats.wishlist : null
        },
        { 
            href: '/account/portfolio', 
            icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>, 
            text: 'Portfolio',
            description: 'Your Collection'
        },
        { 
            href: '/account/address', 
            icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, 
            text: 'Addresses',
            description: 'Delivery Locations'
        },
        { 
            href: '/account/setting', 
            icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, 
            text: 'Settings',
            description: 'Security & Privacy'
        },
    ];

    const handleLogout = () => {
        toast.loading('Signing out...');
        auth.signOut().then(() => {
            toast.success('Signed out successfully');
            window.location.href = '/login';
        });
        setShowLogoutConfirm(false);
    };

    const getUserInitials = () => {
        if (userData?.name) {
            const names = userData.name.split(' ');
            if (names.length >= 2) {
                return names[0][0] + names[1][0];
            }
            return userData.name.substring(0, 2);
        }
        return 'U';
    };

    return (
        <>
            {/* Mobile Header Trigger */}
            <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-black to-gray-800 text-white flex items-center justify-center font-black text-sm">
                        {getUserInitials()}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">
                            {userData?.name || 'My Account'}
                        </h3>
                        <p className="text-[10px] text-gray-500">
                            Manage your profile
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="p-2 bg-black text-white rounded-lg active:scale-95 transition-transform shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300 animate-in fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Main Sidebar */}
            <div className={`
                fixed md:sticky top-0 md:top-0 left-0 h-screen bg-white z-[70] md:z-10
                transition-all duration-500 ease-out border-r border-gray-100 shadow-2xl md:shadow-none
                ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full md:translate-x-0'}
                ${isCollapsed ? 'md:w-20' : 'md:w-80'}
                overflow-y-auto
            `}>
                
                {/* Desktop Collapse Toggle */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute -right-4 top-10 bg-gradient-to-br from-black to-gray-900 text-white rounded-full p-2 shadow-xl hover:scale-110 transition-all z-50 border-2 border-white"
                    aria-label="Toggle sidebar"
                >
                    <svg 
                        className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
                        fill="none" 
                        strokeWidth="2.5" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Close Button (Mobile) */}
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                    <svg className="w-5 h-5" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className={`flex flex-col h-full transition-all duration-500 ${isCollapsed ? 'p-4' : 'p-6'}`}>
                    
                    {/* User Profile Section */}
                    <div className={`mb-8 pb-8 border-b border-gray-100 transition-all duration-500 ${isCollapsed ? 'items-center' : ''}`}>
                        <div className="relative mb-4">
                            <div className={`rounded-2xl bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white flex items-center justify-center font-black shadow-2xl transition-all duration-500 ${
                                isCollapsed ? 'w-12 h-12 text-lg' : 'w-20 h-20 text-3xl'
                            }`}>
                                {getUserInitials()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        
                        {!isCollapsed && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                                <h3 className="text-base font-black text-gray-900 truncate">
                                    {userData?.name || 'User'}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium">
                                    {userData?.email || 'customer@zaqeen.com'}
                                </p>
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-wider rounded-full border border-green-200">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        Active
                                    </span>
                                    {userData?.isVerified && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider rounded-full border border-blue-200">
                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1 flex-grow">
                        <div className={`text-[9px] font-black uppercase tracking-wider text-gray-400 mb-4 ${isCollapsed ? 'text-center' : 'px-3'}`}>
                            {!isCollapsed && 'Quick Access'}
                        </div>
                        
                        {navItems.map((item, index) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link 
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    title={isCollapsed ? item.text : ''}
                                    className={`
                                        relative flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all duration-300 group
                                        ${isActive 
                                            ? 'bg-black text-white shadow-lg shadow-black/20 scale-[1.02]' 
                                            : 'text-gray-600 hover:text-black hover:bg-gray-50'
                                        }
                                        ${isCollapsed ? 'justify-center px-2' : ''}
                                    `}
                                    style={{ transitionDelay: `${index * 30}ms` }}
                                >
                                    {/* Icon */}
                                    <span className={`transition-all duration-300 shrink-0 ${
                                        isActive ? 'scale-110' : 'group-hover:scale-110'
                                    }`}>
                                        {item.icon}
                                    </span>
                                    
                                    {/* Text & Badge */}
                                    {!isCollapsed && (
                                        <div className="flex-1 flex items-center justify-between min-w-0">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">
                                                    {item.text}
                                                </p>
                                                <p className={`text-[10px] font-medium truncate ${
                                                    isActive ? 'text-white/70' : 'text-gray-500'
                                                }`}>
                                                    {item.description}
                                                </p>
                                            </div>
                                            
                                            {item.badge && (
                                                <span className={`flex items-center justify-center min-w-[20px] h-5 px-2 rounded-full text-[10px] font-black ${
                                                    isActive 
                                                        ? 'bg-white text-black' 
                                                        : 'bg-black text-white'
                                                }`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Collapsed Badge Indicator */}
                                    {isCollapsed && item.badge && (
                                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                                    )}

                                    {/* Active Indicator */}
                                    {isActive && (
                                        <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full"></div>
                                    )}

                                    {/* Hover Arrow */}
                                    {!isCollapsed && (
                                        <svg 
                                            className={`w-4 h-4 transition-all ${
                                                isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                                            }`} 
                                            fill="none" 
                                            strokeWidth="2.5" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Section */}
                    <div className={`mt-8 pt-6 border-t border-gray-100 ${isCollapsed ? 'space-y-2' : 'space-y-4'}`}>
                        {!isCollapsed && (
                            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xs font-bold text-gray-900 mb-1">Need Help?</h4>
                                        <p className="text-[10px] text-gray-600 leading-relaxed">
                                            Contact our support team for assistance
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <button 
                            onClick={() => setShowLogoutConfirm(true)}
                            className={`flex items-center gap-4 text-gray-500 hover:text-red-600 transition-all duration-300 group w-full py-3 px-4 rounded-xl hover:bg-red-50 ${
                                isCollapsed ? 'justify-center' : ''
                            }`}
                            title={isCollapsed ? "Logout" : ""}
                        >
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {!isCollapsed && (
                                <span className="text-sm font-bold uppercase tracking-wider">Sign Out</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Sign Out?</h3>
                                <p className="text-xs text-gray-600 mt-1">Are you sure you want to logout?</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/30"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserSidebar;