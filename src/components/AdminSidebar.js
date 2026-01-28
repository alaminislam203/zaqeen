import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
    HiOutlineHome, HiOutlineShoppingBag, HiOutlineCube, HiOutlineUserGroup, 
    HiOutlineTicket, HiOutlineCog, HiOutlineLogout, HiOutlineTag, 
    HiOutlineChatAlt2, HiOutlineChat // Using HiOutlineChat for Live Chat
} from 'react-icons/hi';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const AdminSidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [unreadChats, setUnreadChats] = useState(0);

    useEffect(() => {
        // Listen for unread chat sessions
        const q = query(collection(db, 'chats'), where('isUnreadForAdmin', '==', true));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadChats(snapshot.size);
        }, (error) => {
            console.error("Error fetching unread chat count: ", error);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/login');
    };

    const navItems = [
        { href: '/admin', icon: <HiOutlineHome size={22} />, text: 'Dashboard' },
        { href: '/admin/orders', icon: <HiOutlineShoppingBag size={22} />, text: 'Orders' },
        { href: '/admin/products', icon: <HiOutlineCube size={22} />, text: 'Products' },
        { href: '/admin/categories', icon: <HiOutlineTag size={22} />, text: 'Categories' },
        { href: '/admin/customers', icon: <HiOutlineUserGroup size={22} />, text: 'Customers' },
        { href: '/admin/coupons', icon: <HiOutlineTicket size={22} />, text: 'Coupons' },
        { href: '/admin/messages', icon: <HiOutlineChatAlt2 size={22} />, text: 'Messages' },
        {
            href: '/admin/live-chat',
            icon: <HiOutlineChat size={22} />,
            text: 'Live Chat',
            notification: unreadChats > 0 ? unreadChats : null
        },
        { href: '/admin/settings', icon: <HiOutlineCog size={22} />, text: 'Settings' },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-100 flex flex-col min-h-screen p-6">
            <div className="mb-12">
                <h1 className="text-xl font-black tracking-tighter text-black uppercase italic">ZQ</h1>
                <p className="text-[9px] font-bold text-gray-400 tracking-[0.3em]">ADMIN</p>
            </div>
            <nav className="flex-grow">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link href={item.href} className={`flex items-center justify-between gap-4 px-4 py-3 my-1 rounded-lg text-sm font-bold transition-all ${pathname === item.href ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-black'}`}>
                                <div className="flex items-center gap-4">
                                    {item.icon}
                                    <span className="tracking-wider text-[11px] uppercase font-bold">{item.text}</span>
                                </div>
                                {item.notification && (
                                    <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {item.notification}
                                    </span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <div>
                <button onClick={handleLogout} className="flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-bold text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-all w-full">
                    <HiOutlineLogout size={22} />
                    <span className="tracking-wider text-[11px] uppercase font-bold">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
