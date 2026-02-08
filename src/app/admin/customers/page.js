'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [expandedCustomer, setExpandedCustomer] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => {
                const data = doc.data();
                let createdAtDate = null;
                
                if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                    createdAtDate = data.createdAt.toDate();
                } else if (data.createdAt) {
                    const date = new Date(data.createdAt);
                    if (!isNaN(date.getTime())) {
                        createdAtDate = date;
                    }
                }
                
                return {
                    id: doc.id,
                    ...data,
                    createdAt: createdAtDate
                };
            });
            setCustomers(usersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching customers:", error);
            toast.error("Failed to load customer data");
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Filter and sort customers
    const filteredCustomers = useMemo(() => {
        let filtered = [...customers];

        // Search filter
        if (searchTerm.trim()) {
            filtered = filtered.filter(customer => 
                customer.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.phone?.includes(searchTerm)
            );
        }

        // Role filter
        if (filterRole !== 'all') {
            filtered = filtered.filter(customer => 
                (customer.role || 'customer') === filterRole
            );
        }

        // Sorting
        filtered.sort((a, b) => {
            switch(sortBy) {
                case 'name':
                    return (a.displayName || '').localeCompare(b.displayName || '');
                case 'email':
                    return (a.email || '').localeCompare(b.email || '');
                case 'date':
                default:
                    return (b.createdAt || 0) - (a.createdAt || 0);
            }
        });

        return filtered;
    }, [customers, searchTerm, filterRole, sortBy]);

    // Statistics
    const stats = useMemo(() => {
        const totalCustomers = customers.length;
        const admins = customers.filter(c => c.role === 'admin').length;
        const regularCustomers = totalCustomers - admins;
        const recentJoins = customers.filter(c => {
            if (!c.createdAt) return false;
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return c.createdAt >= weekAgo;
        }).length;

        return { totalCustomers, admins, regularCustomers, recentJoins };
    }, [customers]);

    const handleRoleChange = async (id, currentRole) => {
        const newRole = currentRole === 'admin' ? 'customer' : 'admin';
        if (window.confirm(`Change user role to ${newRole}?`)) {
            const loadingToast = toast.loading('Updating role...');
            try {
                await updateDoc(doc(db, 'users', id), { role: newRole });
                toast.success('Role updated successfully', { 
                    id: loadingToast,
                    style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
                });
            } catch (error) {
                toast.error('Failed to update role', { id: loadingToast });
                console.error(error);
            }
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm("Delete this user? This action cannot be undone.")) {
            const loadingToast = toast.loading('Deleting user...');
            try {
                await deleteDoc(doc(db, 'users', id));
                toast.success('User deleted successfully', { 
                    id: loadingToast,
                    style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
                });
            } catch (error) {
                toast.error('Failed to delete user', { id: loadingToast });
                console.error(error);
            }
        }
    };

    const handleSelectCustomer = (id) => {
        setSelectedCustomers(prev => 
            prev.includes(id) 
                ? prev.filter(customerId => customerId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedCustomers.length === filteredCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(filteredCustomers.map(c => c.id));
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return date.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Role', 'Joined Date'];
        const rows = filteredCustomers.map(customer => [
            customer.displayName || 'N/A',
            customer.email || 'N/A',
            customer.phone || 'N/A',
            customer.role || 'customer',
            formatDate(customer.createdAt)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        toast.success('Customers exported successfully', {
            style: { borderRadius: '0px', background: '#000', color: '#fff' }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-[9px] uppercase tracking-[0.4em] font-black text-gray-400">Loading Customers...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8 lg:p-12 selection:bg-black selection:text-white">
            <div className="max-w-[1600px] mx-auto">
                
                {/* Header */}
                <header className="mb-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-400 block">User Management</span>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter">Customers</h1>
                        </div>

                        <button
                            onClick={exportToCSV}
                            className="px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center gap-3 shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Export CSV
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white border border-gray-200 p-6">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Total Users</p>
                            <p className="text-3xl font-black">{stats.totalCustomers}</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-6">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Customers</p>
                            <p className="text-3xl font-black text-blue-600">{stats.regularCustomers}</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-6">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Admins</p>
                            <p className="text-3xl font-black text-purple-600">{stats.admins}</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-6">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">New (7 days)</p>
                            <p className="text-3xl font-black text-green-600">{stats.recentJoins}</p>
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
                                placeholder="Search by name, email, or phone..."
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

                        {/* Role Filter */}
                        <select 
                            value={filterRole} 
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="px-6 py-3 bg-white border border-gray-200 focus:border-black outline-none text-[10px] font-black uppercase tracking-wide cursor-pointer"
                        >
                            <option value="all">All Roles ({customers.length})</option>
                            <option value="customer">Customers ({stats.regularCustomers})</option>
                            <option value="admin">Admins ({stats.admins})</option>
                        </select>

                        {/* Sort By */}
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-6 py-3 bg-white border border-gray-200 focus:border-black outline-none text-[10px] font-black uppercase tracking-wide cursor-pointer"
                        >
                            <option value="date">Sort: Newest</option>
                            <option value="name">Sort: Name</option>
                            <option value="email">Sort: Email</option>
                        </select>
                    </div>
                </header>

                {/* Bulk Actions */}
                {selectedCustomers.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-wide">
                            {selectedCustomers.length} customer{selectedCustomers.length > 1 ? 's' : ''} selected
                        </p>
                        <button
                            onClick={() => setSelectedCustomers([])}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-[9px] font-black uppercase tracking-wide hover:bg-gray-300 transition-all"
                        >
                            Clear Selection
                        </button>
                    </div>
                )}

                {/* Customers Table */}
                <div className="bg-white border border-gray-200 shadow-lg overflow-hidden">
                    {filteredCustomers.length === 0 ? (
                        <div className="text-center py-20">
                            <svg className="w-24 h-24 mx-auto text-gray-200 mb-4" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                            <p className="text-[11px] font-black uppercase tracking-wide text-gray-400 mb-2">No customers found</p>
                            <p className="text-[9px] text-gray-400">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-black text-white text-[9px] uppercase tracking-wider">
                                        <th className="p-4 font-black">
                                            <input
                                                type="checkbox"
                                                checked={selectedCustomers.length === filteredCustomers.length}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                        </th>
                                        <th className="p-4 font-black">Customer</th>
                                        <th className="p-4 font-black">Contact</th>
                                        <th className="p-4 font-black text-center">Joined</th>
                                        <th className="p-4 font-black text-center">Role</th>
                                        <th className="p-4 font-black"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredCustomers.map((customer) => (
                                        <React.Fragment key={customer.id}>
                                            <tr className={`group transition-all hover:bg-gray-50 ${expandedCustomer === customer.id ? 'bg-gray-50' : ''}`}>
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCustomers.includes(customer.id)}
                                                        onChange={() => handleSelectCustomer(customer.id)}
                                                        className="w-4 h-4 cursor-pointer"
                                                    />
                                                </td>

                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-black to-neutral-800 text-white flex items-center justify-center font-black text-sm">
                                                            {customer.displayName?.charAt(0)?.toUpperCase() || customer.email?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black uppercase tracking-wide">
                                                                {customer.displayName || 'Anonymous User'}
                                                            </p>
                                                            <p className="text-[9px] text-gray-500 font-bold">
                                                                ID: {customer.id.slice(0, 8)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="p-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold">{customer.email || 'N/A'}</p>
                                                        {customer.phone && (
                                                            <p className="text-[9px] text-gray-500">{customer.phone}</p>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="p-4 text-center">
                                                    <p className="text-[10px] font-bold">{formatDate(customer.createdAt)}</p>
                                                </td>

                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => handleRoleChange(customer.id, customer.role)}
                                                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wide transition-all ${
                                                            customer.role === 'admin'
                                                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {customer.role || 'customer'}
                                                    </button>
                                                </td>

                                                <td className="p-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)}
                                                            className="p-2 hover:bg-gray-100 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <svg className={`w-5 h-5 transition-transform ${expandedCustomer === customer.id ? 'rotate-180' : ''}`} fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(customer.id)}
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

                                            {/* Expanded Details */}
                                            {expandedCustomer === customer.id && (
                                                <tr className="bg-gradient-to-b from-gray-50 to-white">
                                                    <td colSpan="6" className="p-8">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div className="space-y-3">
                                                                <h4 className="text-[10px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2 pb-3 border-b border-gray-200">
                                                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                                    </svg>
                                                                    Account Info
                                                                </h4>
                                                                <div className="space-y-2 text-[10px]">
                                                                    <div>
                                                                        <p className="text-gray-500 font-bold">User ID</p>
                                                                        <p className="font-black">{customer.id}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500 font-bold">Email</p>
                                                                        <p className="font-black">{customer.email}</p>
                                                                    </div>
                                                                    {customer.phone && (
                                                                        <div>
                                                                            <p className="text-gray-500 font-bold">Phone</p>
                                                                            <p className="font-black">{customer.phone}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <h4 className="text-[10px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2 pb-3 border-b border-gray-200">
                                                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                                    </svg>
                                                                    Address
                                                                </h4>
                                                                <div className="space-y-2 text-[10px]">
                                                                    {customer.address ? (
                                                                        <>
                                                                            <p className="font-bold leading-relaxed">{customer.address}</p>
                                                                            {customer.city && <p className="text-gray-600">{customer.city}</p>}
                                                                            {customer.postalCode && <p className="text-gray-600">{customer.postalCode}</p>}
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-gray-400">No address provided</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <h4 className="text-[10px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2 pb-3 border-b border-gray-200">
                                                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                                                    </svg>
                                                                    Activity
                                                                </h4>
                                                                <div className="space-y-2 text-[10px]">
                                                                    <div>
                                                                        <p className="text-gray-500 font-bold">Joined</p>
                                                                        <p className="font-black">{formatDate(customer.createdAt)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-500 font-bold">Role</p>
                                                                        <p className="font-black uppercase">{customer.role || 'Customer'}</p>
                                                                    </div>
                                                                </div>
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
                        Showing {filteredCustomers.length} of {customers.length} customers
                    </p>
                </div>
            </div>
        </div>
    );
}