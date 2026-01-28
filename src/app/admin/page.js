'use client';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HiOutlineShoppingBag, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineUsers, HiOutlineCube } from 'react-icons/hi';
import Link from 'next/link';

// Stat Card Component
const StatCard = ({ icon, title, value, subtitle, color }) => {
  const colors = {
    sky: 'bg-sky-50 border-sky-200 text-sky-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  };
  return (
    <div className={`p-6 rounded-lg border flex items-start gap-6 ${colors[color]}`}>
        <div className="bg-white p-3 rounded-full border shadow-sm">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="text-3xl font-black tracking-tighter mt-1">{value}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-1">{subtitle}</p>
        </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qOrders = query(collection(db, 'orders'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    });

    const qProducts = query(collection(db, 'products'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch unique users from orders collection as a proxy for customer count
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const uniqueUserIds = [...new Set(querySnapshot.docs.map(doc => doc.data().userId))];
      setUsers(uniqueUserIds);
    };

    fetchUsers();

    return () => {
        unsubOrders();
        unsubProducts();
    };
  }, []);

  const completedOrders = orders.filter(o => o.status === 'Delivered').length;
  const pendingOrders = orders.length - completedOrders;
  const lowStockProducts = products.filter(p => p.stock && p.stock < 10);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-[10px] uppercase tracking-[0.4em] font-bold text-gray-400">Loading Intelligence...</p>
    </div>
  );

  return (
      <div className="min-h-screen bg-[#fcfcfc] p-4 md:p-10">
          <div className="max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter italic">Command Deck</h1>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Live Analytics & Operations</p>
                </div>
            </header>

            {/* --- Stats Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard icon={<HiOutlineShoppingBag size={24}/>} title="Total Orders" value={orders.length} subtitle="All-time" color="sky"/>
                <StatCard icon={<HiOutlineCheckCircle size={24}/>} title="Completed Orders" value={completedOrders} subtitle={`${pendingOrders} pending`} color="emerald"/>
                <StatCard icon={<HiOutlineUsers size={24}/>} title="Total Customers" value={users.length} subtitle="Unique buyers" color="indigo" />
                <StatCard icon={<HiOutlineExclamation size={24}/>} title="Low Stock" value={lowStockProducts.length} subtitle="Items needing restock" color="amber" />
            </div>

            {/* --- Low Stock Alert --- */}
            {lowStockProducts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-8 rounded-lg mb-10">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-800 flex items-center gap-3 mb-6">
                        <HiOutlineExclamation size={20} /> Inventory Alert
                    </h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {lowStockProducts.map(p => (
                            <Link
                                href={`/products/${p.id}`}
                                key={p.id}
                                className="bg-white border border-gray-100 p-4 rounded-md flex items-center gap-4 hover:shadow-lg hover:border-black transition-all group">

                                <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                    <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black tracking-tight group-hover:underline">{p.title}</p>
                                    <p className="text-[10px] font-bold text-rose-500 mt-1">{p.stock} units left</p>
                                </div>

                            </Link>
                        ))}
                    </ul>
                </div>
            )}

            {/* Quick Actions can be added here */}

          </div>
      </div>
  );
}