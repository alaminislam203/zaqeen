'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useCart } from '@/context/CartContext';
import { HiOutlineShoppingBag, HiOutlineUser, HiOutlineMenuAlt3, HiOutlineX, HiOutlineShieldCheck } from 'react-icons/hi';
import TopBar from './TopBar';
import SearchBar from './SearchBar';

const Navbar = () => {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const { cart, isHydrated } = useCart();
    const [isScrolled, setIsScrolled] = useState(false);

    // স্ক্রল করলে নেভবার শ্যাডো বা ট্রান্সপারেন্সি পরিবর্তনের জন্য
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Shop', href: '/shop' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
    ];

    const cartItemCount = isHydrated ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;

    if (pathname.startsWith('/admin')) return null;

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm' : 'bg-white'}`}>
          
            
            <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4">
                <div className="flex justify-between items-center">
                    
                    {/* লোগো: একটু বেশি স্পেসিং এবং বোল্ড টেক্সট */}
                    <div className="flex-1 hidden md:flex">
                         <nav className="flex items-center space-x-8">
                            {navLinks.map(link => (
                                <Link 
                                    key={link.name} 
                                    href={link.href} 
                                    className={`relative text-[11px] uppercase tracking-[0.2em] font-medium transition-all duration-300 group ${
                                        pathname === link.href ? 'text-black' : 'text-gray-400 hover:text-black'
                                    }`}
                                >
                                    {link.name}
                                    <span className={`absolute -bottom-1 left-0 w-full h-[1px] bg-black transition-transform duration-300 origin-left ${pathname === link.href ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* ব্র্যান্ড লোগো: সেন্ট্রাল পজিশনিং ফিল */}
                    <div className="text-2xl md:text-3xl font-black tracking-[0.4em] uppercase text-center">
                        <Link href="/" className="hover:opacity-80 transition-opacity">Zaqeen</Link>
                    </div>

                    {/* রাইট সাইড অ্যাকশনস */}
                    <div className="flex-1 flex justify-end items-center space-x-5 md:space-x-7">
                        <div className="hidden lg:block w-48 xl:w-56 transform transition-all duration-500 focus-within:w-64">
                            <SearchBar />
                        </div>

                        <div className="flex items-center space-x-4">
                            {isAdmin && (
                                <Link href="/admin" className="p-1 hover:bg-gray-50 rounded-full transition" title="Admin">
                                    <HiOutlineShieldCheck className="w-6 h-6 text-gray-700" />
                                </Link>
                            )}
                            
                            <Link href={user ? "/account" : "/login"} className="hidden sm:block p-1 hover:bg-gray-50 rounded-full transition">
                                <HiOutlineUser className="w-6 h-6 text-gray-700 hover:text-black" />
                            </Link>

                            <Link href="/cart" className="relative p-1 group">
                                <HiOutlineShoppingBag className="w-6 h-6 text-gray-700 group-hover:text-black transition-colors" />
                                {cartItemCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-black text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white">
                                        {cartItemCount}
                                    </span>
                                )}
                            </Link>

                            {/* মোবাইল মেনু টগল */}
                            <button className="md:hidden p-1 text-gray-800" onClick={() => setMenuOpen(!menuOpen)}>
                                {menuOpen ? <HiOutlineX size={28} /> : <HiOutlineMenuAlt3 size={28} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* মোবাইল সার্চ: লোগোর নিচে ছোট গ্যাপ দিয়ে */}
                <div className="mt-4 md:hidden">
                    <SearchBar />
                </div>
            </div>

            {/* মোবাইল ড্রয়ার মেনু (স্লাইড ইন ইফেক্ট) */}
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setMenuOpen(false)}>
                <div 
                    className={`absolute right-0 top-0 h-full w-[80%] max-w-sm bg-white shadow-2xl transition-transform duration-500 transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-8 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-12">
                            <span className="text-xl font-bold tracking-widest uppercase">Menu</span>
                            <button onClick={() => setMenuOpen(false)}><HiOutlineX size={24} /></button>
                        </div>
                        
                        <nav className="flex flex-col space-y-8">
                            {navLinks.map((link, index) => (
                                <Link 
                                    key={link.name} 
                                    href={link.href} 
                                    onClick={() => setMenuOpen(false)}
                                    className="text-2xl uppercase tracking-widest font-light border-b border-gray-50 pb-2"
                                    style={{ transitionDelay: `${index * 50}ms` }}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>

                        <div className="mt-auto pt-10 border-t border-gray-100">
                             <Link href={user ? "/account" : "/login"} onClick={() => setMenuOpen(false)} className="flex items-center gap-4 text-sm tracking-widest uppercase font-semibold mb-6">
                                <HiOutlineUser size={20}/> {user ? "My Profile" : "Login / Register"}
                            </Link>
                            {isAdmin && (
                                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 text-sm tracking-widest uppercase font-semibold text-rose-600">
                                    <HiOutlineShieldCheck size={20}/> Administrator Access
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;