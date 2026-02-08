'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function CouponAdmin() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive, expired
  const [mounted, setMounted] = useState(false);

  const [newCoupon, setNewCoupon] = useState({ 
    code: '', 
    type: 'percentage', 
    value: '', 
    minSpend: '', 
    maxDiscount: '',
    usageLimit: '', 
    expiryDate: '', 
    active: true,
    description: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const couponsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setCoupons(couponsData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // Filter coupons
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'active') {
      return matchesSearch && coupon.active && !isExpired(coupon.expiryDate);
    } else if (filterStatus === 'inactive') {
      return matchesSearch && !coupon.active;
    } else if (filterStatus === 'expired') {
      return matchesSearch && isExpired(coupon.expiryDate);
    }
    
    return matchesSearch;
  });

  // Statistics
  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.active && !isExpired(c.expiryDate)).length,
    expired: coupons.filter(c => isExpired(c.expiryDate)).length,
    totalUsed: coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) {
      toast.error('Please fill in required fields');
      return;
    }

    const uploadToast = toast.loading(editingCoupon ? "Updating coupon..." : "Creating coupon...");

    try {
      const couponData = {
        ...newCoupon,
        code: newCoupon.code.toUpperCase().trim(),
        value: Number(newCoupon.value),
        minSpend: newCoupon.minSpend ? Number(newCoupon.minSpend) : 0,
        maxDiscount: newCoupon.maxDiscount ? Number(newCoupon.maxDiscount) : null,
        usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : null,
      };

      if (editingCoupon) {
        await updateDoc(doc(db, 'coupons', editingCoupon.id), couponData);
        toast.success("Coupon updated successfully", { id: uploadToast });
      } else {
        await addDoc(collection(db, 'coupons'), {
          ...couponData,
          usedCount: 0,
          createdAt: serverTimestamp(),
        });
        toast.success("Coupon created successfully", { id: uploadToast });
      }
      
      setNewCoupon({ 
        code: '', type: 'percentage', value: '', minSpend: '', maxDiscount: '',
        usageLimit: '', expiryDate: '', active: true, description: '' 
      });
      setEditingCoupon(null);
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to save coupon", { id: uploadToast });
      console.error(error);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setNewCoupon({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minSpend: coupon.minSpend || '',
      maxDiscount: coupon.maxDiscount || '',
      usageLimit: coupon.usageLimit || '',
      expiryDate: coupon.expiryDate || '',
      active: coupon.active,
      description: coupon.description || ''
    });
    setIsModalOpen(true);
  };

  const toggleCouponStatus = async (id, active) => {
    try {
      await updateDoc(doc(db, 'coupons', id), { active: !active });
      toast.success(`Coupon ${!active ? 'activated' : 'deactivated'}`, {
        style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px' }
      });
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteCoupon = async (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await deleteDoc(doc(db, 'coupons', id));
        toast.success('Coupon deleted successfully', {
          style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
        });
      } catch (error) {
        toast.error('Failed to delete coupon');
      }
    }
  };

  const duplicateCoupon = (coupon) => {
    setEditingCoupon(null);
    setNewCoupon({
      code: `${coupon.code}_COPY`,
      type: coupon.type,
      value: coupon.value,
      minSpend: coupon.minSpend || '',
      maxDiscount: coupon.maxDiscount || '',
      usageLimit: coupon.usageLimit || '',
      expiryDate: coupon.expiryDate || '',
      active: false,
      description: coupon.description || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setNewCoupon({ 
      code: '', type: 'percentage', value: '', minSpend: '', maxDiscount: '',
      usageLimit: '', expiryDate: '', active: true, description: '' 
    });
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8 lg:p-12 selection:bg-black selection:text-white">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-400 block">Marketing Suite</span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter">Coupon Manager</h1>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center gap-3 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Coupon
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-200 p-6">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Total Coupons</p>
              <p className="text-3xl font-black">{stats.total}</p>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Active</p>
              <p className="text-3xl font-black text-green-600">{stats.active}</p>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Expired</p>
              <p className="text-3xl font-black text-red-600">{stats.expired}</p>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Total Used</p>
              <p className="text-3xl font-black text-blue-600">{stats.totalUsed}</p>
            </div>
          </div>

          {/* Search and Filters */}
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
                placeholder="Search coupons..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 focus:border-black outline-none transition-all text-[10px] font-bold uppercase tracking-wide"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2 bg-white border border-gray-200 p-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'inactive', label: 'Inactive' },
                { id: 'expired', label: 'Expired' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider transition-all ${
                    filterStatus === filter.id 
                      ? 'bg-black text-white' 
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Coupons Table */}
        <div className="bg-white border border-gray-200 shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Loading coupons...</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-20 h-20 mx-auto text-gray-200 mb-4" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">No coupons found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-black text-white text-[9px] uppercase tracking-wider">
                    <th className="p-4 font-black">Code</th>
                    <th className="p-4 font-black text-center">Type</th>
                    <th className="p-4 font-black text-center">Value</th>
                    <th className="p-4 font-black text-center">Min Spend</th>
                    <th className="p-4 font-black text-center">Usage</th>
                    <th className="p-4 font-black text-center">Expiry</th>
                    <th className="p-4 font-black text-center">Status</th>
                    <th className="p-4 font-black"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCoupons.map(coupon => {
                    const expired = isExpired(coupon.expiryDate);
                    const usagePercent = coupon.usageLimit 
                      ? ((coupon.usedCount || 0) / coupon.usageLimit) * 100 
                      : 0;

                    return (
                      <tr 
                        key={coupon.id} 
                        className={`group transition-all hover:bg-gray-50 ${
                          expired || !coupon.active ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-black to-neutral-800 text-white flex items-center justify-center text-xs font-black">
                              <svg className="w-6 h-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-black text-sm uppercase tracking-wide">{coupon.code}</p>
                              {coupon.description && (
                                <p className="text-[9px] text-gray-500 mt-1">{coupon.description}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <span className={`inline-block px-3 py-1 text-[8px] font-black uppercase tracking-wider ${
                            coupon.type === 'percentage' 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-purple-100 text-purple-600'
                          }`}>
                            {coupon.type === 'percentage' ? 'Percentage' : 'Fixed'}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <p className="font-black text-lg">
                            {coupon.type === 'percentage' ? `${coupon.value}%` : `৳${coupon.value}`}
                          </p>
                          {coupon.maxDiscount && coupon.type === 'percentage' && (
                            <p className="text-[9px] text-gray-400 mt-1">Max: ৳{coupon.maxDiscount}</p>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <p className="font-black text-sm">
                            {coupon.minSpend ? `৳${coupon.minSpend}` : 'No min'}
                          </p>
                        </td>

                        <td className="p-4 text-center">
                          <div className="space-y-2">
                            <p className="font-black text-sm">
                              {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                            </p>
                            {coupon.usageLimit && (
                              <div className="w-full h-1.5 bg-gray-200 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          {coupon.expiryDate ? (
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold">
                                {new Date(coupon.expiryDate).toLocaleDateString('en-GB', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </p>
                              {expired && (
                                <span className="inline-block px-2 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-wide">
                                  Expired
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] text-gray-400 font-bold">No expiry</span>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleCouponStatus(coupon.id, coupon.active)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider transition-all ${
                              coupon.active 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${coupon.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            {coupon.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(coupon)}
                              className="p-2 hover:bg-gray-100 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            <button
                              onClick={() => duplicateCoupon(coupon)}
                              className="p-2 hover:bg-gray-100 transition-colors"
                              title="Duplicate"
                            >
                              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteCoupon(coupon.id)}
                              className="p-2 hover:bg-red-50 text-red-500 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-6 text-center">
          <p className="text-[9px] uppercase tracking-wide font-bold text-gray-400">
            Showing {filteredCoupons.length} of {coupons.length} coupons
          </p>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[999] p-6 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl relative p-8 md:p-12 animate-fadeIn">
              <button 
                onClick={closeModal} 
                className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
              >
                <svg className="w-6 h-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <header className="mb-8">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                  {editingCoupon ? 'Edit Coupon' : 'New Coupon'}
                </span>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                  {editingCoupon ? 'Update Details' : 'Create Coupon'}
                </h2>
              </header>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Coupon Code */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                    Coupon Code *
                  </label>
                  <input 
                    type="text" 
                    value={newCoupon.code} 
                    onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} 
                    placeholder="e.g. WINTER25" 
                    className="w-full bg-white border-2 border-gray-200 focus:border-black p-4 text-sm font-black tracking-wider outline-none transition-all uppercase"
                    required 
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                    Description
                  </label>
                  <input 
                    type="text" 
                    value={newCoupon.description} 
                    onChange={e => setNewCoupon({...newCoupon, description: e.target.value})} 
                    placeholder="e.g. Winter Sale Discount" 
                    className="w-full bg-white border-2 border-gray-200 focus:border-black p-4 text-sm font-bold outline-none transition-all"
                  />
                </div>

                {/* Type and Value */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                      Type *
                    </label>
                    <select 
                      value={newCoupon.type} 
                      onChange={e => setNewCoupon({...newCoupon, type: e.target.value})} 
                      className="w-full bg-white border-2 border-gray-200 focus:border-black p-4 text-[10px] font-black uppercase tracking-wide outline-none cursor-pointer"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (৳)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                      Value *
                    </label>
                    <input 
                      type="number" 
                      value={newCoupon.value} 
                      onChange={e => setNewCoupon({...newCoupon, value: e.target.value})} 
                      placeholder="e.g. 20" 
                      className="w-full bg-white border-2 border-gray-200 focus:border-black p-4 text-lg font-black outline-none transition-all"
                      required 
                    />
                  </div>
                </div>

                {/* Min Spend and Max Discount */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                      Min Spend (৳)
                    </label>
                    <input 
                      type="number" 
                      value={newCoupon.minSpend} 
                      onChange={e => setNewCoupon({...newCoupon, minSpend: e.target.value})} 
                      placeholder="e.g. 1000" 
                      className="w-full bg-white border-2 border-gray-200 focus:border-black p-4 text-sm font-bold outline-none transition-all"
                    />
                  </div>
                  {newCoupon.type === 'percentage' && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                        Max Discount (৳)
                      </label>
                      <input 
                        type="number" 
                        value={newCoupon.maxDiscount} 
                        onChange={e => setNewCoupon({...newCoupon, maxDiscount: e.target.value})} 
                        placeholder="e.g. 500" 
                        className="w-full bg-white border-2 border-gray-200 focus:border-black p-4 text-sm font-bold outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Usage Limit and Expiry */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                      Usage Limit
                    </label>
                    <input 
                      type="number" 
                      value={newCoupon.usageLimit} 
                      onChange={e => setNewCoupon({...newCoupon, usageLimit: e.target.value})} 
                      placeholder="Unlimited" 
                      className="w-full bg-white border-2 border-gray-200 focus:border-black p-4 text-sm font-bold outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                      Expiry Date
                    </label>
                    <input 
                      type="date" 
                      value={newCoupon.expiryDate} 
                      onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})} 
                      className="w-full bg-white border-2 border-gray-200 focus:border-black p-4 text-sm font-bold outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200">
                  <input 
                    type="checkbox" 
                    id="active" 
                    checked={newCoupon.active} 
                    onChange={e => setNewCoupon({...newCoupon, active: e.target.checked})} 
                    className="w-5 h-5 cursor-pointer"
                  />
                  <label htmlFor="active" className="text-[10px] font-black uppercase tracking-wide cursor-pointer">
                    Activate coupon immediately
                  </label>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="group relative w-full bg-black text-white py-5 text-[11px] font-black uppercase tracking-wider shadow-lg overflow-hidden transition-all active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {editingCoupon ? (
                      <>
                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Update Coupon
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Create Coupon
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}