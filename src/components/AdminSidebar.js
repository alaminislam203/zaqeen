'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
    HiOutlineHome, HiOutlineShoppingBag, HiOutlineCube, HiOutlineUserGroup, 
    HiOutlineTicket, HiOutlineCog, HiOutlineLogout, HiOutlineTag, 
    HiOutlineChatAlt2, HiOutlineChat, HiOutlineCloudUpload,
    HiOutlineChartBar, HiOutlinePhotograph, HiOutlineMailOpen,
    HiChevronLeft, HiChevronRight 
} from 'react-icons/hi';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const AdminSidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [unreadChats, setUnreadChats] = useState(0);
    const [pendingOrders, setPendingOrders] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const chatQuery = query(collection(db, 'chats'), where('isUnreadForAdmin', '==', true));
        const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => setUnreadChats(snapshot.size));

        const orderQuery = query(collection(db, 'orders'), where('status', '==', 'Pending'));
        const unsubscribeOrder = onSnapshot(orderQuery, (snapshot) => setPendingOrders(snapshot.size));

        return () => { unsubscribeChat(); unsubscribeOrder(); };
    }, []);

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/login');
    };

    // সব নেভিগেশন আইটেম এখানে গোছানো হয়েছে
    const navItems = [
        { label: 'Operational Hub', items: [
            { href: '/admin', icon: <HiOutlineHome size={20} />, text: 'Dashboard' },
            { href: '/admin/analytics', icon: <HiOutlineChartBar size={20} />, text: 'Analytics' }, // নিউ অপশন
        ]},
        { label: 'Commerce Engine', items: [
            { href: '/admin/orders', icon: <HiOutlineShoppingBag size={20} />, text: 'Orders', notification: pendingOrders },
            { href: '/admin/products', icon: <HiOutlineCube size={20} />, text: 'Products' },
            { href: '/admin/bulk-upload', icon: <HiOutlineCloudUpload size={20} />, text: 'Bulk Upload' }, // আপনার রিকোয়েস্ট করা অপশন
            { href: '/admin/categories', icon: <HiOutlineTag size={20} />, text: 'Categories' },
        ]},
        { label: 'Client Engagement', items: [
            { href: '/admin/live-chat', icon: <HiOutlineChat size={20} />, text: 'Live Chat', notification: unreadChats, isImportant: true },
            { href: '/admin/messages', icon: <HiOutlineChatAlt2 size={20} />, text: 'Inbox' },
            { href: '/admin/customers', icon: <HiOutlineUserGroup size={20} />, text: 'Collectors' },
        ]},
        { label: 'Marketing & Assets', items: [
            { href: '/admin/coupons', icon: <HiOutlineTicket size={20} />, text: 'Promotions' },
            { href: '/admin/media', icon: <HiOutlinePhotograph size={20} />, text: 'Media Vault' }, // ভবিষ্যতে ইমেজের জন্য
            { href: '/admin/newsletter', icon: <HiOutlineMailOpen size={20} />, text: 'Broadcasting' }, // ভবিষ্যতের জন্য
        ]},
        { label: 'System Control', items: [
            { href: '/admin/settings', icon: <HiOutlineCog size={20} />, text: 'Protocols' },
        ]}
    ];

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-gray-50 flex flex-col h-screen sticky top-0 transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] group`}>
            
            {/* Toggle Switch */}
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-12 bg-black text-white rounded-full p-1.5 shadow-2xl hover:scale-110 transition-all z-50 opacity-0 group-hover:opacity-100"
            >
                {isCollapsed ? <HiChevronRight size={14} /> : <HiChevronLeft size={14} />}
            </button>

            {/* Logo Architecture */}
            <div className={`py-12 flex flex-col items-center justify-center transition-all duration-500`}>
                <h1 className="text-3xl font-black tracking-tighter text-black uppercase italic leading-none">
                    {isCollapsed ? 'Z' : 'ZQ'}
                </h1>
                {!isCollapsed && (
                    <span className="text-[8px] font-black text-gray-300 tracking-[0.8em] uppercase mt-3 italic">Command Hub</span>
                )}
            </div>

            {/* Navigation Matrix */}
            <nav className="flex-grow overflow-y-auto overflow-x-hidden px-4 custom-scrollbar pb-10">
                {navItems.map((group, gIdx) => (
                    <div key={gIdx} className="mb-10">
                        {!isCollapsed && (
                            <p className="text-[8px] font-black text-gray-200 uppercase tracking-[0.4em] mb-5 px-3 italic">
                                {group.label}
                            </p>
                        )}
                        <ul className="space-y-1.5">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.href}>
                                        <Link 
                                            href={item.href} 
                                            className={`relative flex items-center gap-4 px-3 py-3.5 transition-all duration-500 rounded-sm
                                            ${isActive ? 'bg-black text-white shadow-xl translate-x-1' : 'text-gray-400 hover:bg-gray-50 hover:text-black'}
                                            ${isCollapsed ? 'justify-center px-0' : ''}`}
                                            title={isCollapsed ? item.text : ''}
                                        >
                                            <div className="relative shrink-0">
                                                {item.icon}
                                                {isCollapsed && item.notification > 0 && (
                                                    <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                                                )}
                                            </div>

                                            {!isCollapsed && (
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{item.text}</span>
                                                    {item.notification > 0 && (
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${item.isImportant ? 'bg-rose-500 animate-pulse text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                            {item.notification}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {isActive && !isCollapsed && (
                                                <div className="absolute left-0 w-1 h-4 bg-white rounded-r-full"></div>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Termination Protocol (Logout) */}
            <div className="p-4 mt-auto border-t border-gray-50 bg-[#FAFAFA]">
                <button 
                    onClick={handleLogout}
                    className={`flex items-center gap-4 px-4 py-4 rounded-sm text-gray-300 hover:text-rose-600 transition-all w-full group/btn ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                    <HiOutlineLogout size={22} className="group-hover/btn:-translate-x-1 transition-transform" />
                    {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Terminate Session</span>}
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;