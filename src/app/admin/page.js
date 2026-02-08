'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

// --- Enhanced Stat Card with Micro Animations ---
const StatCard = ({ icon, title, value, subtitle, trend, trendValue, color = 'black' }) => {
  const colorClasses = {
    black: 'group-hover:bg-black group-hover:text-white',
    emerald: 'group-hover:bg-emerald-500 group-hover:text-white',
    amber: 'group-hover:bg-amber-500 group-hover:text-white',
    rose: 'group-hover:bg-rose-500 group-hover:text-white',
    blue: 'group-hover:bg-blue-500 group-hover:text-white'
  };

  return (
    <div className="bg-white border border-gray-100 p-6 group hover:border-gray-300 hover:shadow-xl transition-all duration-500 relative overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 bg-gray-50 text-gray-700 transition-all duration-500 ${colorClasses[color]}`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 text-[8px] font-black uppercase tracking-wider ${
              trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 
              trend === 'down' ? 'bg-rose-50 text-rose-600' : 
              'bg-blue-50 text-blue-600'
            }`}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                {trend === 'up' ? (
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                ) : trend === 'down' ? (
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                )}
              </svg>
              {trendValue}
            </div>
          )}
        </div>
        
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">{title}</p>
          <p className="text-3xl font-black tracking-tight mb-2">{value}</p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">{subtitle}</p>
        </div>

        {/* Progress Bar (optional) */}
        <div className="mt-4 w-full h-1 bg-gray-100 overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${
            color === 'emerald' ? 'from-emerald-500 to-emerald-600' :
            color === 'amber' ? 'from-amber-500 to-amber-600' :
            color === 'rose' ? 'from-rose-500 to-rose-600' :
            color === 'blue' ? 'from-blue-500 to-blue-600' :
            'from-black to-neutral-800'
          } transform transition-transform duration-700 group-hover:scale-x-100 scale-x-75 origin-left`}></div>
        </div>
      </div>
    </div>
  );
};

// --- Mini Chart Component (Simple Bar Chart) ---
const MiniChart = ({ data, height = 60 }) => {
  const max = Math.max(...data);
  
  return (
    <div className="flex items-end justify-between gap-1" style={{ height: `${height}px` }}>
      {data.map((value, index) => (
        <div
          key={index}
          className="flex-1 bg-gradient-to-t from-black to-neutral-700 hover:from-amber-500 hover:to-amber-600 transition-all duration-300 min-w-[4px]"
          style={{ height: `${(value / max) * 100}%` }}
          title={`Day ${index + 1}: ${value}`}
        ></div>
      ))}
    </div>
  );
};

// --- Status Badge Component ---
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Pending', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    processing: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Processing', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    shipped: { color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', label: 'Shipped', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
    delivered: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Delivered', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    cancelled: { color: 'bg-rose-500/10 text-rose-600 border-rose-500/20', label: 'Cancelled', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' }
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider border ${config.color}`}>
      <svg className="w-3 h-3" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
      </svg>
      {config.label}
    </span>
  );
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year

  useEffect(() => {
    // Orders Listener with ordering
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')), 
      (snap) => {
        const ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersData);
        setLoading(false);
      }
    );

    // Products Listener
    const unsubProducts = onSnapshot(query(collection(db, 'products')), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Unique Customers
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "orders"));
      const uniqueIds = [...new Set(snap.docs.map(d => d.data().userId))];
      setUsers(uniqueIds);
    };

    // Recent Activity Log
    const fetchRecentActivity = async () => {
      const activities = [];
      
      // Recent orders
      const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5)));
      ordersSnap.forEach(doc => {
        const data = doc.data();
        activities.push({
          type: 'order',
          message: `New order from ${data.deliveryInfo?.name || 'Customer'}`,
          time: data.createdAt,
          id: doc.id
        });
      });

      setRecentActivity(activities.sort((a, b) => b.time - a.time).slice(0, 10));
    };

    fetchUsers();
    fetchRecentActivity();
    
    return () => { 
      unsubOrders(); 
      unsubProducts(); 
    };
  }, []);

  // --- Enhanced Analytics ---
  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter(o => o.status !== 'Cancelled' && o.status !== 'cancelled')
      .reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
    
    const pendingOrders = orders.filter(o => 
      o.status === 'pending' || o.status === 'Pending'
    ).length;
    
    const completedOrders = orders.filter(o => 
      o.status === 'Delivered' || o.status === 'delivered'
    ).length;
    
    const lowStock = products.filter(p => {
      if (typeof p.stock === 'number') return p.stock < 10;
      if (typeof p.stock === 'object') {
        return Object.values(p.stock).some(s => Number(s) < 5);
      }
      return false;
    });

    // Calculate trends (last 7 days vs previous 7 days)
    const now = new Date();
    const last7Days = orders.filter(o => {
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });

    const previous7Days = orders.filter(o => {
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
      return diffDays > 7 && diffDays <= 14;
    });

    const revenueGrowth = previous7Days.length > 0 
      ? (((last7Days.length - previous7Days.length) / previous7Days.length) * 100).toFixed(1)
      : 0;

    // Chart data (last 7 days)
    const chartData = Array(7).fill(0);
    last7Days.forEach(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const dayIndex = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        chartData[6 - dayIndex]++;
      }
    });

    const avgOrderValue = orders.length > 0 
      ? (totalRevenue / orders.length).toFixed(2)
      : 0;

    return { 
      totalRevenue, 
      pendingOrders, 
      completedOrders, 
      lowStock, 
      revenueGrowth,
      chartData,
      avgOrderValue,
      last7Days: last7Days.length
    };
  }, [orders, products]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-[9px] uppercase tracking-[0.4em] font-black text-gray-400">Synchronizing Command Deck...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8 lg:p-12 selection:bg-black selection:text-white">
      <div className="max-w-[1600px] mx-auto">
        
        {/* --- Enhanced Header --- */}
        <header className="mb-12 relative">
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-black/5 to-transparent rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-gray-200">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black block">Operational Core System</span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter">Command Deck</h1>
              <p className="text-[10px] text-gray-500 tracking-wide font-bold mt-2">Real-time analytics and operational intelligence</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Time Range Selector */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 p-1">
                {['week', 'month', 'year'].map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider transition-all ${
                      timeRange === range 
                        ? 'bg-black text-white' 
                        : 'text-gray-400 hover:text-black'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 bg-black text-white px-5 py-3 shadow-lg">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[9px] uppercase tracking-[0.3em] font-black">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* --- Primary Stats Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <StatCard 
            icon={
              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            }
            title="Total Revenue" 
            value={`৳${stats.totalRevenue.toLocaleString()}`} 
            subtitle={`Avg: ৳${stats.avgOrderValue} per order`}
            trend={stats.revenueGrowth > 0 ? 'up' : stats.revenueGrowth < 0 ? 'down' : 'neutral'}
            trendValue={`${stats.revenueGrowth}%`}
            color="emerald"
          />
          
          <StatCard 
            icon={
              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            }
            title="Total Orders" 
            value={orders.length} 
            subtitle={`${stats.last7Days} orders this week`}
            trend="up"
            trendValue={`${stats.last7Days}`}
            color="blue"
          />
          
          <StatCard 
            icon={
              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
            title="Active Customers" 
            value={users.length} 
            subtitle="Unique verified users"
            color="black"
          />
          
          <StatCard 
            icon={
              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
            title="Low Stock Items" 
            value={stats.lowStock.length} 
            subtitle="Requires immediate attention"
            trend={stats.lowStock.length > 0 ? 'down' : 'up'}
            trendValue={stats.lowStock.length > 0 ? 'Critical' : 'Good'}
            color="amber"
          />
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* --- Left Column (Main Content) --- */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* Chart Section */}
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em]">Weekly Performance</h2>
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Last 7 Days</span>
              </div>
              <MiniChart data={stats.chartData} height={120} />
              <div className="flex justify-between mt-4 text-[8px] font-black uppercase tracking-wider text-gray-400">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>

            {/* Low Stock Alert */}
            {stats.lowStock.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Inventory Alert
                  </h2>
                  <Link 
                    href="/admin/products" 
                    className="text-[9px] font-black uppercase tracking-wider text-amber-800 hover:text-black transition-colors flex items-center gap-1"
                  >
                    Manage Stock
                    <svg className="w-3 h-3" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {stats.lowStock.slice(0, 4).map(p => (
                    <Link
                      href={`/admin/products/edit/${p.id}`}
                      key={p.id}
                      className="group flex items-center gap-4 p-4 bg-white border border-amber-100 hover:border-amber-300 transition-all duration-300"
                    >
                      <div className="w-14 h-14 bg-gray-50 overflow-hidden shrink-0">
                        <img 
                          src={p.imageUrl || p.images?.[0] || '/placeholder.png'} 
                          alt={p.name} 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-wide text-black truncate">{p.name}</p>
                        <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase">
                          {typeof p.stock === 'number' ? `${p.stock} units` : 'Low stock'}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            <div className="bg-white border border-gray-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em]">Recent Orders</h2>
                <Link 
                  href="/admin/orders" 
                  className="text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-black transition-colors flex items-center gap-1"
                >
                  View All
                  <svg className="w-3 h-3" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
              <div className="space-y-3">
                {orders.slice(0, 8).map(order => (
                  <Link
                    href={`/admin/orders/${order.id}`}
                    key={order.id} 
                    className="group flex justify-between items-center p-4 border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wide truncate">
                          #{order.orderId || order.id.slice(0,8)}
                        </p>
                        <p className="text-[9px] text-gray-500 font-bold truncate">
                          {order.deliveryInfo?.name || 'Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-black">৳{order.totalAmount?.toLocaleString()}</p>
                        <StatusBadge status={order.status} />
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* --- Right Sidebar --- */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Status Overview */}
            <div className="bg-gradient-to-br from-black to-neutral-900 p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-5">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-6 pb-4 border-b border-white/10">System Status</h3>
              <div className="space-y-5 relative z-10">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide font-black">Order Completion</p>
                    <p className="text-sm font-black">{orders.length > 0 ? ((stats.completedOrders / orders.length) * 100).toFixed(1) : 0}%</p>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000"
                      style={{ width: `${orders.length > 0 ? (stats.completedOrders / orders.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide font-black mb-2">Pending Review</p>
                  <p className="text-2xl font-black">{stats.pendingOrders}</p>
                </div>

                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide font-black mb-2">Active Products</p>
                  <p className="text-2xl font-black">{products.length}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { href: '/admin/products/add', label: 'Add Product', icon: 'M12 4v16m8-8H4' },
                  { href: '/admin/orders', label: 'Manage Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                  { href: '/admin/coupons', label: 'Create Coupon', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
                  { href: '/admin/settings', label: 'Site Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
                ].map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="group flex items-center justify-between p-4 border border-gray-100 hover:border-black hover:bg-black hover:text-white transition-all"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wide">{action.label}</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 pb-3 border-b border-gray-100">Recent Activity</h3>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-gray-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-black">{activity.message}</p>
                      <p className="text-[8px] text-gray-400 mt-0.5">
                        {activity.time?.toDate ? activity.time.toDate().toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* --- Footer --- */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-[9px] uppercase tracking-[0.4em] font-black text-gray-300">
            Zaqeen Command Deck v3.0.0
          </p>
        </footer>
      </div>
    </main>
  );
}