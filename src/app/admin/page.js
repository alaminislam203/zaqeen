'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HiOutlineShoppingBag, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineUsers, HiOutlineCube, HiOutlineTrendingUp } from 'react-icons/hi';
import Link from 'next/link';

// --- Stat Card Architecture ---
const StatCard = ({ icon, title, value, subtitle, trend }) => (
  <div className="bg-white border border-gray-50 p-8 rounded-sm shadow-[0_30px_80px_rgba(0,0,0,0.02)] group hover:border-black transition-all duration-700">
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-gray-50 rounded-full text-black group-hover:bg-black group-hover:text-white transition-all duration-500">
        {icon}
      </div>
      {trend && (
        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 italic mb-1">{title}</p>
      <p className="text-4xl font-black tracking-tighter italic">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-3 border-t border-gray-50 pt-3 italic">{subtitle}</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Orders Listener
    const unsubOrders = onSnapshot(query(collection(db, 'orders')), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Products Listener
    const unsubProducts = onSnapshot(query(collection(db, 'products')), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Unique Customers logic
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "orders"));
      const uniqueIds = [...new Set(snap.docs.map(d => d.data().userId))];
      setUsers(uniqueIds);
    };

    fetchUsers();
    return () => { unsubOrders(); unsubProducts(); };
  }, []);

  // --- Financial Intelligence ---
  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
    
    const completed = orders.filter(o => o.status === 'Delivered').length;
    const lowStock = products.filter(p => {
        if (typeof p.stock === 'number') return p.stock < 10;
        if (typeof p.stock === 'object') {
            return Object.values(p.stock).some(s => Number(s) < 5);
        }
        return false;
    });

    return { totalRevenue, completed, lowStock };
  }, [orders, products]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-[9px] uppercase tracking-[0.6em] font-black italic text-gray-300">Synchronizing Intel...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#FDFDFD] p-6 md:p-12 selection:bg-black selection:text-white">
      <div className="max-w-[1440px] mx-auto">
        
        {/* --- Header Protocol --- */}
        <header className="mb-16 border-b border-gray-50 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-[0.8em] text-gray-300 font-black italic block">Operational Core</span>
                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic leading-none text-black">Command Deck</h1>
                </div>
                <div className="flex items-center gap-4 bg-black text-white px-6 py-3 rounded-sm shadow-2xl">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] uppercase tracking-[0.4em] font-black italic">System Online</span>
                </div>
            </div>
        </header>

        {/* --- Analytical Matrix --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <StatCard 
                icon={<HiOutlineTrendingUp size={22}/>} 
                title="Total Revenue" 
                value={`৳${stats.totalRevenue.toLocaleString()}`} 
                subtitle="Gross Investment"
                trend="+12% Vol"
            />
            <StatCard 
                icon={<HiOutlineShoppingBag size={22}/>} 
                title="Acquisition Log" 
                value={orders.length} 
                subtitle={`${orders.length - stats.completed} Pending Audit`} 
            />
            <StatCard 
                icon={<HiOutlineUsers size={22}/>} 
                title="Collector Base" 
                value={users.length} 
                subtitle="Unique Verified Users" 
            />
            <StatCard 
                icon={<HiOutlineExclamation size={22}/>} 
                title="Stock Anomalies" 
                value={stats.lowStock.length} 
                subtitle="Critically Low Inventory" 
                color="amber"
            />
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
            
            {/* --- Phase 01: Inventory Alerts --- */}
            <section className="lg:col-span-8 space-y-10">
                {stats.lowStock.length > 0 && (
                    <div className="bg-white border border-gray-100 p-10 rounded-sm">
                        <header className="flex justify-between items-center mb-10 border-b border-gray-50 pb-6">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-black italic flex items-center gap-4">
                                <HiOutlineExclamation className="text-rose-500 animate-bounce" size={20} /> Inventory Breach
                            </h2>
                            <Link href="/admin/products" className="text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-black transition-all">Restock All</Link>
                        </header>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {stats.lowStock.map(p => (
                                <Link
                                    href={`/admin/products/edit/${p.id}`}
                                    key={p.id}
                                    className="group flex items-center gap-6 p-4 border border-transparent hover:border-black transition-all duration-500 bg-gray-50/50"
                                >
                                    <div className="w-16 h-16 bg-white overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all duration-700">
                                        <img src={p.imageUrl || p.images?.[0]} alt={p.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-black truncate italic">{p.name}</p>
                                        <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-tighter">Only {typeof p.stock === 'number' ? p.stock : 'Limited'} Units Remain</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Phase 02: Recent Protocol Log (Orders) --- */}
                <div className="bg-white border border-gray-50 p-10 rounded-sm shadow-sm">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-black italic mb-10 border-b border-gray-50 pb-6">Recent Transmissions</h2>
                    <div className="space-y-6">
                        {orders.slice(0, 5).map(order => (
                            <div key={order.id} className="flex justify-between items-center py-4 border-b border-gray-50 group hover:px-4 transition-all">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest italic">#{order.orderId || order.id.slice(0,8)}</p>
                                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter">{order.deliveryInfo?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black italic">৳{order.totalAmount?.toLocaleString()}</p>
                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${order.status === 'Delivered' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link href="/admin/orders" className="block text-center mt-10 text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 hover:text-black transition-all">View All Protocols</Link>
                </div>
            </section>

            {/* --- Right Column: Command Shortcuts --- */}
            <aside className="lg:col-span-4 space-y-8">
                <div className="bg-black p-10 text-white rounded-sm space-y-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-[3s]"><HiOutlineTrendingUp size={120} /></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.6em] italic text-gray-500 border-b border-white/5 pb-4">Global Matrix</h3>
                    <div className="space-y-6">
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Curation Status</p>
                            <p className="text-xl font-black italic">Operational 99.8%</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">Pending Audit</p>
                            <p className="text-xl font-black italic">{orders.length - stats.completed} Orders</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 p-8 space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] italic text-gray-300">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <Link href="/admin/products/add" className="p-5 border border-gray-50 text-[10px] font-black uppercase tracking-[0.4em] italic hover:bg-black hover:text-white transition-all text-center">New Article</Link>
                        <Link href="/admin/coupons" className="p-5 border border-gray-50 text-[10px] font-black uppercase tracking-[0.4em] italic hover:bg-black hover:text-white transition-all text-center">Incentive Hub</Link>
                        <Link href="/admin/live-chat" className="p-5 border border-gray-100 text-[10px] font-black uppercase tracking-[0.4em] italic hover:bg-black hover:text-white transition-all text-center">Transmissions</Link>
                    </div>
                </div>
            </aside>
        </div>

        {/* --- Footer Signature --- */}
        <footer className="mt-32 pt-12 border-t border-gray-50 text-center">
            <p className="text-[9px] uppercase tracking-[0.6em] font-black italic text-gray-200">Governance Architecture v2.6.0</p>
        </footer>
      </div>
    </main>
  );
}
