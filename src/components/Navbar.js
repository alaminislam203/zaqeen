'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useCart } from '@/context/CartContext';
import TopBar from './TopBar';
import SearchBar from './SearchBar';

const Navbar = () => {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const { cart, isHydrated } = useCart();
    const [isScrolled, setIsScrolled] = useState(false);
    const [cartAnimation, setCartAnimation] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [prevCartCount, setPrevCartCount] = useState(0);
    const userMenuRef = useRef(null);

    // Scroll handler with smart navbar behavior
    useEffect(() => {
        let lastScrollY = window.scrollY;
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    setIsScrolled(currentScrollY > 20);
                    lastScrollY = currentScrollY;
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // User authentication and role check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                setIsAdmin(userDoc.exists() && (userDoc.data().isAdmin || userDoc.data().role === 'admin'));
            } else {
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Cart animation trigger
    const cartItemCount = isHydrated ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;

    useEffect(() => {
        if (cartItemCount > prevCartCount && prevCartCount !== 0) {
            setCartAnimation(true);
            setTimeout(() => setCartAnimation(false), 600);
        }
        setPrevCartCount(cartItemCount);
    }, [cartItemCount]);

    // Close user menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [menuOpen]);

    const navLinks = [
        { name: 'Home', href: '/', icon: 'home' },
        { name: 'Shop', href: '/shop', icon: 'shop', badge: 'New' },
        { name: 'About', href: '/about', icon: 'info' },
        { name: 'Contact', href: '/contact', icon: 'mail' },
    ];

    if (pathname.startsWith('/admin')) return null;

    return (
        <>
            {/* Top Bar */}
            <TopBar />

            {/* Main Navbar */}
            <header className={`sticky top-0 z-50 transition-all duration-500 ${
                isScrolled 
                    ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/[0.03] border-b border-gray-100' 
                    : 'bg-white border-b border-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="flex justify-between items-center h-20">
                        
                        {/* Left Navigation - Desktop */}
                        <div className="flex-1 hidden lg:flex">
                            <nav className="flex items-center space-x-1">
                                {navLinks.map((link, index) => (
                                    <Link 
                                        key={link.name} 
                                        href={link.href}
                                        className={`relative px-4 py-2 text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-300 group ${
                                            pathname === link.href 
                                                ? 'text-black' 
                                                : 'text-gray-500 hover:text-black'
                                        }`}
                                        style={{ transitionDelay: `${index * 30}ms` }}
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            {link.name}
                                            {link.badge && (
                                                <span className="text-[7px] bg-black text-white px-1.5 py-0.5 rounded-sm font-black">
                                                    {link.badge}
                                                </span>
                                            )}
                                        </span>
                                        
                                        {/* Active indicator */}
                                        <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-black via-gray-800 to-black transition-transform duration-500 origin-center ${
                                            pathname === link.href ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                                        }`}></span>

                                        {/* Hover background */}
                                        <span className="absolute inset-0 bg-gray-50 rounded-sm scale-0 group-hover:scale-100 transition-transform duration-300 origin-center -z-0"></span>
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Center Logo */}
                        <div className="flex-shrink-0">
                            <Link 
                                href="/" 
                                className="block group relative"
                            >
                                <div className="text-2xl md:text-3xl font-black tracking-[0.4em] uppercase transition-all duration-300 group-hover:tracking-[0.45em]">
                                    <span className="relative inline-block">
                                        ZAQEEN
                                        {/* Logo underline decoration */}
                                        <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-[1px] bg-black transition-all duration-500"></span>
                                    </span>
                                </div>
                                {/* Tagline - hidden on mobile */}
                                <p className="hidden md:block text-[6px] text-center text-gray-400 uppercase tracking-[0.3em] mt-1 font-medium">
                                    Identity • Certainty
                                </p>
                            </Link>
                        </div>

                        {/* Right Actions */}
                        <div className="flex-1 flex justify-end items-center gap-2 sm:gap-3">
                            
                            {/* Desktop Search Bar */}
                            <div className={`hidden lg:block transition-all duration-500 ${
                                searchOpen ? 'w-64 xl:w-80' : 'w-48 xl:w-56'
                            }`}>
                                <SearchBar onFocus={() => setSearchOpen(true)} onBlur={() => setSearchOpen(false)} />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 sm:gap-2">
                                
                                {/* Search Toggle - Mobile/Tablet */}
                                <button 
                                    onClick={() => setSearchOpen(!searchOpen)}
                                    className="lg:hidden p-2 hover:bg-gray-50 rounded-full transition-all duration-300 active:scale-95 group"
                                    aria-label="Search"
                                >
                                    <svg className="w-5 h-5 text-gray-700 group-hover:text-black transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>

                                {/* Admin Panel Access */}
                                {isAdmin && (
                                    <Link 
                                        href="/admin" 
                                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 rounded-full transition-all duration-300 group border border-red-100"
                                        title="Admin Panel"
                                    >
                                        <svg className="w-4 h-4 text-red-600 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-[8px] font-black uppercase tracking-wider text-red-700">Admin</span>
                                    </Link>
                                )}

                                {/* User Account Menu */}
                                <div className="hidden sm:block relative" ref={userMenuRef}>
                                    <button 
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="p-2 hover:bg-gray-50 rounded-full transition-all duration-300 active:scale-95 group relative"
                                        aria-label="User Account"
                                    >
                                        <svg className="w-5 h-5 text-gray-700 group-hover:text-black transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {user && (
                                            <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
                                        )}
                                    </button>

                                    {/* User Dropdown Menu */}
                                    {userMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {user ? (
                                                <>
                                                    <div className="px-4 py-3 border-b border-gray-100">
                                                        <p className="text-xs font-bold text-gray-900 truncate">{user.displayName || 'User'}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                                                    </div>
                                                    <Link 
                                                        href="/account" 
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        My Account
                                                    </Link>
                                                    <Link 
                                                        href="/orders" 
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                        </svg>
                                                        My Orders
                                                    </Link>
                                                    <button 
                                                        onClick={() => {
                                                            auth.signOut();
                                                            setUserMenuOpen(false);
                                                        }}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-red-50 text-red-600 transition-colors w-full text-left"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                        Sign Out
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Link 
                                                        href="/login" 
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                        </svg>
                                                        Login
                                                    </Link>
                                                    <Link 
                                                        href="/register" 
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                        </svg>
                                                        Register
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Shopping Cart */}
                                <Link 
                                    href="/cart" 
                                    className="relative p-2 hover:bg-gray-50 rounded-full transition-all duration-300 active:scale-95 group"
                                    aria-label="Shopping Cart"
                                >
                                    <svg 
                                        className={`w-5 h-5 text-gray-700 group-hover:text-black transition-all ${
                                            cartAnimation ? 'animate-bounce' : ''
                                        }`} 
                                        fill="none" 
                                        strokeWidth="2" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    
                                    {cartItemCount > 0 && (
                                        <span className={`absolute -top-1 -right-1 bg-black text-white text-[9px] font-black rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white transition-all ${
                                            cartAnimation ? 'scale-125' : 'scale-100'
                                        }`}>
                                            {cartItemCount > 99 ? '99+' : cartItemCount}
                                        </span>
                                    )}

                                    {/* Cart pulse indicator when items added */}
                                    {cartAnimation && (
                                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-black rounded-full animate-ping opacity-75"></span>
                                    )}
                                </Link>

                                {/* Mobile Menu Toggle */}
                                <button 
                                    className="lg:hidden p-2 text-gray-800 hover:bg-gray-50 rounded-full transition-all duration-300 active:scale-95" 
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    aria-label="Menu"
                                >
                                    <div className="relative w-5 h-5 flex flex-col justify-center items-center">
                                        <span className={`absolute h-0.5 w-5 bg-current transform transition-all duration-300 ${menuOpen ? 'rotate-45' : '-translate-y-1.5'}`}></span>
                                        <span className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                                        <span className={`absolute h-0.5 w-5 bg-current transform transition-all duration-300 ${menuOpen ? '-rotate-45' : 'translate-y-1.5'}`}></span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile/Tablet Search Bar - Expandable */}
                    {searchOpen && (
                        <div className="lg:hidden pb-4 animate-in slide-in-from-top-2 duration-300">
                            <SearchBar autoFocus onBlur={() => setSearchOpen(false)} />
                        </div>
                    )}
                </div>

                {/* Bottom border gradient */}
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            </header>

            {/* Mobile Drawer Menu */}
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-all duration-500 lg:hidden ${
                    menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`} 
                onClick={() => setMenuOpen(false)}
            >
                <div 
                    className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-500 transform ${
                        menuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Menu Header */}
                    <div className="relative p-6 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-xl font-black tracking-[0.3em] uppercase">Menu</span>
                                <p className="text-[8px] text-gray-500 uppercase tracking-wider mt-1">Navigation</p>
                            </div>
                            <button 
                                onClick={() => setMenuOpen(false)}
                                className="p-2 hover:bg-white rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Menu Content */}
                    <div className="flex flex-col h-[calc(100%-88px)] overflow-y-auto">
                        {/* Navigation Links */}
                        <nav className="flex flex-col p-6 space-y-2">
                            {navLinks.map((link, index) => (
                                <Link 
                                    key={link.name} 
                                    href={link.href} 
                                    onClick={() => setMenuOpen(false)}
                                    className={`group flex items-center justify-between py-4 px-4 rounded-lg transition-all duration-300 ${
                                        pathname === link.href 
                                            ? 'bg-black text-white' 
                                            : 'hover:bg-gray-50'
                                    }`}
                                    style={{ 
                                        transitionDelay: `${index * 50}ms`,
                                        transform: menuOpen ? 'translateX(0)' : 'translateX(100%)'
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-lg font-bold uppercase tracking-[0.2em] ${
                                            pathname === link.href ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {link.name}
                                        </span>
                                        {link.badge && (
                                            <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black">
                                                {link.badge}
                                            </span>
                                        )}
                                    </div>
                                    <svg 
                                        className={`w-4 h-4 transition-transform ${
                                            pathname === link.href 
                                                ? 'text-white translate-x-1' 
                                                : 'text-gray-400 group-hover:translate-x-1'
                                        }`} 
                                        fill="none" 
                                        strokeWidth="2" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </nav>

                        {/* Divider */}
                        <div className="mx-6 border-t border-gray-100"></div>

                        {/* User Section */}
                        <div className="p-6 space-y-3">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white font-bold text-sm">
                                            {user.displayName?.[0] || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{user.displayName || 'User'}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    <Link 
                                        href="/account" 
                                        onClick={() => setMenuOpen(false)} 
                                        className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span className="text-sm font-semibold uppercase tracking-wider">My Profile</span>
                                    </Link>

                                    <Link 
                                        href="/orders" 
                                        onClick={() => setMenuOpen(false)} 
                                        className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        <span className="text-sm font-semibold uppercase tracking-wider">My Orders</span>
                                    </Link>
                                </>
                            ) : (
                                <Link 
                                    href="/login" 
                                    onClick={() => setMenuOpen(false)} 
                                    className="flex items-center justify-center gap-3 py-4 px-4 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    <span className="text-sm font-black uppercase tracking-wider">Login / Register</span>
                                </Link>
                            )}
                        </div>

                        {/* Admin Access */}
                        {isAdmin && (
                            <>
                                <div className="mx-6 border-t border-gray-100"></div>
                                <div className="p-6">
                                    <Link 
                                        href="/admin" 
                                        onClick={() => setMenuOpen(false)} 
                                        className="flex items-center justify-between py-4 px-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-lg hover:from-red-100 hover:to-orange-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-black uppercase tracking-wider text-red-700">Admin Panel</span>
                                        </div>
                                        <svg className="w-4 h-4 text-red-600 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </>
                        )}

                        {/* Logout Button for Mobile */}
                        {user && (
                            <>
                                <div className="mt-auto border-t border-gray-100"></div>
                                <div className="p-6">
                                    <button 
                                        onClick={() => {
                                            auth.signOut();
                                            setMenuOpen(false);
                                        }}
                                        className="flex items-center justify-center gap-3 w-full py-3 px-4 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold"
                                    >
                                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span className="text-sm uppercase tracking-wider">Sign Out</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Decorative element */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-black via-gray-800 to-black"></div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
