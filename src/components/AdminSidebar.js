'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
    HiOutlineHome, HiOutlineShoppingBag, HiOutlineCube, HiOutlineUserGroup, 
    HiOutlineTicket, HiOutlineCog, HiOutlineLogout, HiOutlineTag, 
    HiOutlineChatAlt2, HiOutlineChat,
    HiChevronLeft, HiChevronRight // কলাপস আইকন
} from 'react-icons/hi';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const AdminSidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [unreadChats, setUnreadChats] = useState(0);
    const [pendingOrders, setPendingOrders] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false); // কলাপস স্টেট

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

    const navItems = [
        { href: '/admin', icon: <HiOutlineHome size={22} />, text: 'Dashboard' },
        { href: '/admin/orders', icon: <HiOutlineShoppingBag size={22} />, text: 'Orders', notification: pendingOrders },
        { href: '/admin/products', icon: <HiOutlineCube size={22} />, text: 'Products' },
        { href: '/admin/categories', icon: <HiOutlineTag size={22} />, text: 'Categories' },
        { href: '/admin/customers', icon: <HiOutlineUserGroup size={22} />, text: 'Customers' },
        { href: '/admin/coupons', icon: <HiOutlineTicket size={22} />, text: 'Coupons' },
        { href: '/admin/messages', icon: <HiOutlineChatAlt2 size={22} />, text: 'Messages' },
        { href: '/admin/live-chat', icon: <HiOutlineChat size={22} />, text: 'Live Chat', notification: unreadChats, isImportant: true },
        { href: '/admin/settings', icon: <HiOutlineCog size={22} />, text: 'Settings' },
    ];

    return (
        <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 p-4 transition-all duration-500 ease-in-out`}>
            
            {/* Collapse Toggle Button */}
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-10 bg-black text-white rounded-full p-1 shadow-xl hover:scale-110 transition-transform z-50"
            >
                {isCollapsed ? <HiChevronRight size={14} /> : <HiChevronLeft size={14} />}
            </button>

            {/* Logo Section */}
            <div className={`mb-12 transition-all duration-500 ${isCollapsed ? 'text-center' : 'px-4'}`}>
                <h1 className="text-2xl font-black tracking-tighter text-black uppercase italic leading-none">
                    {isCollapsed ? 'Z' : 'ZQ'}
                </h1>
                {!isCollapsed && <p className="text-[9px] font-black text-gray-400 tracking-[0.5em] uppercase mt-1">Admin</p>}
            </div>

            {/* Nav Items */}
            <nav className="flex-grow overflow-hidden">
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link 
                                    href={item.href} 
                                    className={`group flex items-center gap-4 px-3 py-3 rounded-sm transition-all duration-300
                                    ${isActive ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-50 hover:text-black'}
                                    ${isCollapsed ? 'justify-center' : ''}`}
                                    title={isCollapsed ? item.text : ''}
                                >
                                    <div className="relative">
                                        {item.icon}
                                        {/* কলাপস অবস্থায় নোটিফিকেশন ডট */}
                                        {isCollapsed && item.notification > 0 && (
                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                                        )}
                                    </div>

                                    {!isCollapsed && (
                                        <div className="flex justify-between items-center w-full">
                                            <span className="text-[10px] font-black uppercase tracking-widest italic">{item.text}</span>
                                            {item.notification > 0 && (
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${item.isImportant ? 'bg-rose-500 animate-pulse' : 'bg-gray-200 text-black'}`}>
                                                    {item.notification}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div className="mt-auto pt-4 border-t border-gray-50">
                <button 
                    onClick={handleLogout}
                    className={`flex items-center gap-4 px-3 py-3 rounded-sm text-gray-400 hover:text-rose-600 transition-all w-full ${isCollapsed ? 'justify-center' : ''}`}
                    title="Logout"
                >
                    <HiOutlineLogout size={22} />
                    {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest italic">Terminate</span>}
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
