'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, runTransaction, increment } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [verifying, setVerifying] = useState({});
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, amount, status
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setOrders(ordersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Advanced Filtering Logic
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(order => 
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deliveryInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deliveryInfo?.phone?.includes(searchTerm) ||
        order.paymentInfo?.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateRange !== 'all' && filtered.length > 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt;

        switch(dateRange) {
          case 'today':
            return orderDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'amount':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'date':
        default:
          return (b.timestamp || 0) - (a.timestamp || 0);
      }
    });

    return filtered;
  }, [orders, filterStatus, searchTerm, sortBy, dateRange]);

  // Statistics
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => 
      order.status !== 'Cancelled' ? sum + (order.totalAmount || 0) : sum, 0
    );
    const pendingCount = orders.filter(o => o.status === 'Pending').length;
    const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
    const unverifiedCount = orders.filter(o => !o.paymentVerified).length;

    return { totalRevenue, pendingCount, deliveredCount, unverifiedCount };
  }, [orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`, {
        style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
      });

      if (newStatus === 'Delivered') {
        const order = orders.find(o => o.id === orderId);
        if (order?.items) {
          await runTransaction(db, async (transaction) => {
            for (const item of order.items) {
              const productRef = doc(db, 'products', item.id);
              transaction.update(productRef, { 
                salesCount: increment(item.quantity || 1) 
              });
            }
          });
          toast.success('Sales analytics updated');
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const verifyPayment = async (orderId, transactionId) => {
    setVerifying(prev => ({ ...prev, [orderId]: true }));
    try {
      await new Promise(r => setTimeout(r, 1000));
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { paymentVerified: true });
      toast.success('Payment verified successfully', {
        style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
      });
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setVerifying(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleNoteChange = async (orderId, note) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { note });
      toast.success('Note saved', {
        style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px' }
      });
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  // Bulk Actions
  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedOrders.length === 0) return;
    
    const loadingToast = toast.loading(`Updating ${selectedOrders.length} orders...`);
    
    try {
      await Promise.all(
        selectedOrders.map(orderId => {
          const orderRef = doc(db, 'orders', orderId);
          return updateDoc(orderRef, { status: newStatus });
        })
      );
      
      toast.success(`${selectedOrders.length} orders updated`, { id: loadingToast });
      setSelectedOrders([]);
      setShowBulkActions(false);
    } catch (error) {
      toast.error('Bulk update failed', { id: loadingToast });
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Phone', 'Amount', 'Status', 'Payment Method', 'Transaction ID'];
    const rows = filteredOrders.map(order => [
      order.orderId || order.id.slice(0, 8),
      order.createdAt?.toLocaleDateString() || '',
      order.deliveryInfo?.name || '',
      order.deliveryInfo?.phone || '',
      order.totalAmount || 0,
      order.status || '',
      order.paymentInfo?.method || '',
      order.paymentInfo?.transactionId || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Orders exported successfully', {
      style: { borderRadius: '0px', background: '#000', color: '#fff' }
    });
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const config = {
      Pending: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Pending' },
      Processing: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Processing' },
      Shipped: { color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', label: 'Shipped' },
      Delivered: { color: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Delivered' },
      Returned: { color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', label: 'Returned' },
      Cancelled: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Cancelled' }
    };

    const badge = config[status] || config.Pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider border ${badge.color}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
        {badge.label}
      </span>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-[9px] uppercase tracking-[0.4em] font-black text-gray-400">Loading Orders...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8 lg:p-12 selection:bg-black selection:text-white">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Enhanced Header */}
        <header className="mb-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-400 block">Order Management</span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter">Order Archive</h1>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportToCSV}
                className="px-6 py-3 bg-black text-white text-[9px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export CSV
              </button>
              
              {selectedOrders.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-6 py-3 bg-blue-500 text-white text-[9px] font-black uppercase tracking-wider hover:bg-blue-600 transition-all"
                >
                  Bulk Actions ({selectedOrders.length})
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-200 p-6">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Total Revenue</p>
              <p className="text-2xl font-black">৳{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Pending</p>
              <p className="text-2xl font-black text-amber-600">{stats.pendingCount}</p>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Delivered</p>
              <p className="text-2xl font-black text-green-600">{stats.deliveredCount}</p>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Unverified</p>
              <p className="text-2xl font-black text-red-600">{stats.unverifiedCount}</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order ID, customer, phone, transaction ID..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 focus:border-black outline-none transition-all text-[10px] font-bold uppercase tracking-wide"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-6 py-3 bg-white border border-gray-200 focus:border-black outline-none text-[10px] font-black uppercase tracking-wide cursor-pointer"
            >
              <option value="All">All Status ({orders.length})</option>
              <option value="Pending">Pending ({orders.filter(o => o.status === 'Pending').length})</option>
              <option value="Processing">Processing ({orders.filter(o => o.status === 'Processing').length})</option>
              <option value="Shipped">Shipped ({orders.filter(o => o.status === 'Shipped').length})</option>
              <option value="Delivered">Delivered ({orders.filter(o => o.status === 'Delivered').length})</option>
              <option value="Cancelled">Cancelled ({orders.filter(o => o.status === 'Cancelled').length})</option>
            </select>

            {/* Date Range Filter */}
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="px-6 py-3 bg-white border border-gray-200 focus:border-black outline-none text-[10px] font-black uppercase tracking-wide cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            {/* Sort By */}
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-6 py-3 bg-white border border-gray-200 focus:border-black outline-none text-[10px] font-black uppercase tracking-wide cursor-pointer"
            >
              <option value="date">Sort: Date</option>
              <option value="amount">Sort: Amount</option>
              <option value="status">Sort: Status</option>
            </select>
          </div>
        </header>

        {/* Bulk Actions Panel */}
        {showBulkActions && selectedOrders.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wide">
              {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              {['Processing', 'Shipped', 'Delivered'].map(status => (
                <button
                  key={status}
                  onClick={() => handleBulkStatusChange(status)}
                  className="px-4 py-2 bg-black text-white text-[9px] font-black uppercase tracking-wide hover:bg-neutral-800 transition-all"
                >
                  Mark as {status}
                </button>
              ))}
              <button
                onClick={() => setSelectedOrders([])}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-[9px] font-black uppercase tracking-wide hover:bg-gray-300 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white border border-gray-200 shadow-lg overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-20 h-20 mx-auto text-gray-200 mb-4" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">No orders found</p>
              <p className="text-[9px] text-gray-400 mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-black text-white text-[9px] uppercase tracking-wider">
                    <th className="p-4 font-black">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="p-4 font-black">Order ID</th>
                    <th className="p-4 font-black">Customer</th>
                    <th className="p-4 font-black text-center">Amount</th>
                    <th className="p-4 font-black text-center">Payment</th>
                    <th className="p-4 font-black text-center">Status</th>
                    <th className="p-4 font-black text-center">Verified</th>
                    <th className="p-4 font-black"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr className={`group transition-all hover:bg-gray-50 ${expandedOrder === order.id ? 'bg-gray-50' : ''}`}>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="text-[11px] font-black tracking-wide text-black">
                              #{order.orderId || order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2 text-gray-400">
                              <svg className="w-3 h-3" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-[9px] font-bold">
                                {order.createdAt?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-black to-neutral-800 text-white flex items-center justify-center font-black text-sm">
                              {order.deliveryInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-wide">
                                {order.deliveryInfo?.name || 'Customer'}
                              </p>
                              <p className="text-[9px] text-gray-500 font-bold">
                                {order.deliveryInfo?.phone}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <p className="font-black text-lg">৳{(order.totalAmount || 0).toLocaleString()}</p>
                        </td>

                        <td className="p-4 text-center">
                          <div className="space-y-1">
                            <span className={`inline-block px-3 py-1 text-[8px] font-black uppercase tracking-wider ${
                              order.paymentInfo?.method === 'bkash' 
                                ? 'bg-pink-50 text-pink-600' 
                                : 'bg-green-50 text-green-600'
                            }`}>
                              {order.paymentInfo?.method || 'N/A'}
                            </span>
                            <p className="text-[9px] text-gray-400 font-mono">
                              {order.paymentInfo?.transactionId || 'N/A'}
                            </p>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <select 
                            value={order.status} 
                            onChange={(e) => handleStatusChange(order.id, e.target.value)} 
                            className="appearance-none text-[9px] font-black uppercase tracking-wide px-4 py-2 border-2 cursor-pointer transition-all focus:outline-none focus:border-black"
                            style={{
                              backgroundColor: 
                                order.status === 'Pending' ? '#fef3c7' :
                                order.status === 'Processing' ? '#dbeafe' :
                                order.status === 'Shipped' ? '#e9d5ff' :
                                order.status === 'Delivered' ? '#d1fae5' :
                                order.status === 'Cancelled' ? '#fee2e2' : '#f3f4f6',
                              borderColor:
                                order.status === 'Pending' ? '#fbbf24' :
                                order.status === 'Processing' ? '#3b82f6' :
                                order.status === 'Shipped' ? '#a855f7' :
                                order.status === 'Delivered' ? '#10b981' :
                                order.status === 'Cancelled' ? '#ef4444' : '#9ca3af',
                              color:
                                order.status === 'Pending' ? '#92400e' :
                                order.status === 'Processing' ? '#1e40af' :
                                order.status === 'Shipped' ? '#6b21a8' :
                                order.status === 'Delivered' ? '#065f46' :
                                order.status === 'Cancelled' ? '#991b1b' : '#374151'
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Returned">Returned</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td className="p-4 text-center">
                          {order.paymentVerified ? (
                            <div className="flex items-center justify-center text-green-500">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : (
                            <button 
                              onClick={() => verifyPayment(order.id, order.paymentInfo?.transactionId)} 
                              disabled={verifying[order.id]} 
                              className="group relative text-[9px] font-black uppercase tracking-wide px-4 py-2 border-2 border-gray-300 hover:border-black overflow-hidden transition-all"
                            >
                              <span className="relative z-10">
                                {verifying[order.id] ? 'Verifying...' : 'Verify'}
                              </span>
                              <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform"></div>
                              <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                {verifying[order.id] ? 'Verifying...' : 'Verify'}
                              </span>
                            </button>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} 
                            className={`p-2 transition-all duration-300 ${
                              expandedOrder === order.id 
                                ? 'rotate-180 bg-black text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {expandedOrder === order.id && (
                        <tr className="bg-gradient-to-b from-gray-50 to-white">
                          <td colSpan="8" className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              
                              {/* Order Items */}
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-wide flex items-center gap-2 pb-3 border-b border-gray-200">
                                  <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                  </svg>
                                  Order Items
                                </h4>
                                <ul className="space-y-3">
                                  {order.items?.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-start text-[10px] pb-3 border-b border-gray-100 last:border-0">
                                      <div className="space-y-1">
                                        <p className="font-black uppercase tracking-wide">{item.name}</p>
                                        <p className="text-gray-500 font-bold">
                                          Qty: {item.quantity} × ৳{item.price.toLocaleString()}
                                        </p>
                                      </div>
                                      <span className="font-black">৳{(item.price * item.quantity).toLocaleString()}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Delivery Info */}
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-wide flex items-center gap-2 pb-3 border-b border-gray-200">
                                  <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                  </svg>
                                  Delivery Information
                                </h4>
                                <div className="text-[10px] space-y-2">
                                  <p className="font-black text-sm">{order.deliveryInfo?.name}</p>
                                  <p className="text-gray-600 leading-relaxed">{order.deliveryInfo?.address}</p>
                                  <div className="flex gap-2 pt-2">
                                    <span className="px-3 py-1 bg-white border border-gray-200 font-bold">
                                      {order.deliveryInfo?.phone}
                                    </span>
                                    <span className="px-3 py-1 bg-white border border-gray-200 font-bold">
                                      {order.deliveryInfo?.city}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Admin Notes */}
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-wide flex items-center gap-2 pb-3 border-b border-gray-200">
                                  <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                  </svg>
                                  Internal Notes
                                </h4>
                                <textarea 
                                  defaultValue={order.note || ''} 
                                  onBlur={(e) => handleNoteChange(order.id, e.target.value)} 
                                  placeholder="Add notes about this order..."
                                  className="w-full h-32 bg-white p-4 text-[10px] font-bold border border-gray-200 focus:border-black outline-none transition-all resize-none"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-6 text-center">
          <p className="text-[9px] uppercase tracking-wide font-bold text-gray-400">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
      </div>
    </div>
  );
}