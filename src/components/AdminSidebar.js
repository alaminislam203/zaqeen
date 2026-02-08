'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const AdminSidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [unreadChats, setUnreadChats] = useState(0);
    const [pendingOrders, setPendingOrders] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [openGroups, setOpenGroups] = useState({});
    const [stats, setStats] = useState({ products: 0, customers: 0, revenue: 0 });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const sidebarRef = useRef(null);

    // Real-time notifications and stats
    useEffect(() => {
        const chatQuery = query(collection(db, 'chats'), where('isUnreadForAdmin', '==', true));
        const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
            setUnreadChats(snapshot.size);
        });

        const orderQuery = query(collection(db, 'orders'), where('status', '==', 'Pending'));
        const unsubscribeOrder = onSnapshot(orderQuery, (snapshot) => {
            setPendingOrders(snapshot.size);
        });

        // Stats collection
        const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
            setStats(prev => ({ ...prev, products: snapshot.size }));
        });

        const unsubscribeCustomers = onSnapshot(collection(db, 'users'), (snapshot) => {
            setStats(prev => ({ ...prev, customers: snapshot.size }));
        });

        return () => { 
            unsubscribeChat(); 
            unsubscribeOrder(); 
            unsubscribeProducts();
            unsubscribeCustomers();
        };
    }, []);

    // Initialize all groups as open
    useEffect(() => {
        const initialState = {};
        navItems.forEach((_, index) => {
            initialState[index] = true;
        });
        setOpenGroups(initialState);
    }, []);

    // Toggle group expansion
    const toggleGroup = (index) => {
        setOpenGroups(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/login');
        setShowLogoutConfirm(false);
    };

    // Navigation items with enhanced structure
    const navItems = [
        { 
            label: 'Operational Hub', 
            icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>,
            items: [
                { 
                    href: '/admin', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, 
                    text: 'Dashboard',
                    description: 'Overview & Metrics'
                },
                { 
                    href: '/admin/analytics', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, 
                    text: 'Analytics',
                    description: 'Data Insights'
                },
            ]
        },
        { 
            label: 'Commerce Engine', 
            icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>,
            items: [
                { 
                    href: '/admin/orders', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>, 
                    text: 'Orders', 
                    notification: pendingOrders,
                    description: 'Manage Orders'
                },
                { 
                    href: '/admin/products', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, 
                    text: 'Products',
                    description: 'Catalog Management'
                },
                { 
                    href: '/admin/bulk-upload', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>, 
                    text: 'Bulk Upload',
                    description: 'Mass Import'
                },
                { 
                    href: '/admin/categories', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, 
                    text: 'Categories',
                    description: 'Organize Products'
                },
            ]
        },
        { 
            label: 'Client Engagement', 
            icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" /></svg>,
            items: [
                { 
                    href: '/admin/live-chat', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, 
                    text: 'Live Chat', 
                    notification: unreadChats, 
                    isImportant: true,
                    description: 'Real-time Support'
                },
                { 
                    href: '/admin/messages', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, 
                    text: 'Inbox',
                    description: 'Email Messages'
                },
                { 
                    href: '/admin/customers', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, 
                    text: 'Collectors',
                    description: 'Customer Base'
                },
            ]
        },
        { 
            label: 'Marketing & Assets', 
            icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>,
            items: [
                { 
                    href: '/admin/coupons', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>, 
                    text: 'Promotions',
                    description: 'Discount Codes'
                },
                { 
                    href: '/admin/media', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, 
                    text: 'Media Vault',
                    description: 'Asset Library'
                },
                { 
                    href: '/admin/newsletter', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>, 
                    text: 'Broadcasting',
                    description: 'Email Campaigns'
                },
            ]
        },
        { 
            label: 'System Control', 
            icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>,
            items: [
                { 
                    href: '/admin/settings', 
                    icon: <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, 
                    text: 'Protocols',
                    description: 'Configuration'
                },
            ]
        }
    ];

    return (
        <>
            <aside 
                ref={sidebarRef}
                className={`${isCollapsed ? 'w-20' : 'w-80'} bg-gradient-to-b from-[#0a0a0a] to-black text-white border-r border-white/5 flex flex-col h-screen sticky top-0 transition-all duration-700 ease-[cubic-bezier(0.4, 0, 0.2, 1)] group overflow-hidden`}
            >
                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)`
                    }}></div>
                </div>

                {/* Toggle Button */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-4 top-8 bg-gradient-to-br from-white to-gray-100 text-black rounded-full p-2 shadow-2xl hover:scale-110 transition-all duration-300 z-50 opacity-0 group-hover:opacity-100 border border-gray-200"
                    aria-label="Toggle Sidebar"
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

                {/* Logo & Branding */}
                <div className={`py-8 px-6 flex flex-col items-center justify-center transition-all duration-700 border-b border-white/5 relative`}>
                    <div className="relative group/logo">
                        <h1 className={`font-black tracking-tighter text-white uppercase leading-none transition-all duration-700 ${isCollapsed ? 'text-4xl' : 'text-5xl'}`}>
                            {isCollapsed ? 'Z' : 'ZAQEEN'}
                        </h1>
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-white/20 blur-2xl opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500 -z-10"></div>
                    </div>
                    
                    {!isCollapsed && (
                        <div className="mt-4 space-y-2 w-full animate-in fade-in slide-in-from-top-2 duration-500">
                            <span className="block text-[7px] font-black text-gray-400 tracking-[0.5em] uppercase text-center">
                                Command Center
                            </span>
                            {/* Quick stats */}
                            <div className="flex gap-2 justify-center pt-2">
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-sm" title="Products">
                                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
                                    </svg>
                                    <span className="text-[8px] font-bold text-gray-300">{stats.products}</span>
                                </div>
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-sm" title="Customers">
                                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                    </svg>
                                    <span className="text-[8px] font-bold text-gray-300">{stats.customers}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 custom-scrollbar">
                    <div className="space-y-6">
                        {navItems.map((group, gIdx) => (
                            <div key={gIdx} className="space-y-2">
                                {/* Group Header */}
                                <button
                                    onClick={() => !isCollapsed && toggleGroup(gIdx)}
                                    className={`w-full flex items-center justify-between px-3 py-2 transition-all duration-300 group/header ${
                                        isCollapsed ? 'justify-center' : 'hover:bg-white/5 rounded-sm'
                                    }`}
                                    title={isCollapsed ? group.label : ''}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-amber-400/60 group-hover/header:text-amber-400 transition-colors">
                                            {group.icon}
                                        </div>
                                        {!isCollapsed && (
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em]">
                                                {group.label}
                                            </span>
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <svg 
                                            className={`w-3 h-3 text-gray-600 transition-transform duration-300 ${
                                                openGroups[gIdx] ? 'rotate-180' : ''
                                            }`} 
                                            fill="none" 
                                            strokeWidth="2" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    )}
                                </button>

                                {/* Group Items */}
                                <div className={`space-y-1 overflow-hidden transition-all duration-500 ${
                                    !isCollapsed && openGroups[gIdx] ? 'max-h-[500px] opacity-100' : isCollapsed ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                    {group.items.map((item, iIdx) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link 
                                                key={item.href}
                                                href={item.href} 
                                                className={`relative flex items-center gap-3 px-3 py-3 transition-all duration-300 rounded-sm group/item overflow-hidden ${
                                                    isActive 
                                                        ? 'bg-white text-black shadow-lg shadow-white/10 translate-x-1' 
                                                        : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                                                } ${isCollapsed ? 'justify-center' : ''}`}
                                                title={isCollapsed ? item.text : item.description}
                                                style={{ transitionDelay: `${iIdx * 30}ms` }}
                                            >
                                                {/* Hover gradient background */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500"></div>

                                                {/* Icon */}
                                                <div className="relative shrink-0 z-10">
                                                    {item.icon}
                                                    {/* Collapsed notification dot */}
                                                    {isCollapsed && item.notification > 0 && (
                                                        <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-black ${
                                                            item.isImportant ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
                                                        }`}></span>
                                                    )}
                                                </div>

                                                {/* Text and Badge */}
                                                {!isCollapsed && (
                                                    <div className="flex justify-between items-center w-full z-10">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${
                                                                isActive ? 'text-black' : ''
                                                            }`}>
                                                                {item.text}
                                                            </span>
                                                            <span className={`text-[7px] font-medium tracking-wider ${
                                                                isActive ? 'text-gray-600' : 'text-gray-600'
                                                            }`}>
                                                                {item.description}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Notification Badge */}
                                                        {item.notification > 0 && (
                                                            <span className={`flex items-center justify-center text-[8px] font-black px-2 py-1 rounded-full min-w-[20px] ${
                                                                item.isImportant 
                                                                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' 
                                                                    : isActive
                                                                    ? 'bg-black text-white'
                                                                    : 'bg-amber-500/20 text-amber-400'
                                                            }`}>
                                                                {item.notification > 99 ? '99+' : item.notification}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* Active Indicator */}
                                                {isActive && (
                                                    <>
                                                        <div className="absolute left-0 w-1 h-full bg-black rounded-r-full"></div>
                                                        <div className="absolute right-0 w-1 h-full bg-gradient-to-l from-white/20 to-transparent"></div>
                                                    </>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </nav>

                {/* Bottom Section - User & Logout */}
                <div className="mt-auto border-t border-white/5 bg-white/[0.02] backdrop-blur-sm">
                    {/* User Info (if expanded) */}
                    {!isCollapsed && (
                        <div className="p-4 border-b border-white/5">
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-sm hover:bg-white/10 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-black text-sm shrink-0">
                                    A
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider truncate">Admin</p>
                                    <p className="text-[8px] text-gray-500 truncate">admin@zaqeen.com</p>
                                </div>
                                <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Logout Button */}
                    <div className="p-4">
                        <button 
                            onClick={() => setShowLogoutConfirm(true)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 w-full group/logout ${
                                isCollapsed ? 'justify-center' : ''
                            }`}
                            title={isCollapsed ? 'Logout' : ''}
                        >
                            <svg className="w-5 h-5 group-hover/logout:rotate-12 transition-transform shrink-0" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {!isCollapsed && (
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                    Terminate
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Bottom decorative line */}
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">Confirm Logout</h3>
                                <p className="text-xs text-gray-600 mt-0.5">Are you sure you want to sign out?</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-sm hover:bg-gray-50 transition-colors font-semibold text-sm uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors font-bold text-sm uppercase tracking-wider shadow-lg shadow-red-600/30"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </>
    );
};

export default AdminSidebar;