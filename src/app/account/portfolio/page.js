'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function PortfolioPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); // profile, orders, security
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, pendingOrders: 0 });
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        email: '',
        city: '',
        postalCode: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setFormData({
                            name: data.name || '',
                            phone: data.phone || '',
                            address: data.address || '',
                            email: currentUser.email || '',
                            city: data.city || '',
                            postalCode: data.postalCode || ''
                        });
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            email: currentUser.email || ''
                        }));
                    }

                    // Fetch user orders and stats
                    await fetchUserOrders(currentUser.uid);
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    toast.error("Failed to load profile data");
                }
            } else {
                setUser(null);
                setFormData({
                    name: '',
                    phone: '',
                    address: '',
                    email: '',
                    city: '',
                    postalCode: ''
                });
            }
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, []);

    const fetchUserOrders = async (userId) => {
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(
                ordersRef, 
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(10)
            );
            const snapshot = await getDocs(q);
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setOrders(ordersData);

            // Calculate stats
            const totalSpent = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
            const pendingOrders = ordersData.filter(order => order.status === 'pending').length;
            
            setStats({
                totalOrders: ordersData.length,
                totalSpent: totalSpent,
                pendingOrders: pendingOrders
            });
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error("Please login first");
            return;
        }

        if (!formData.name.trim()) {
            toast.error("Name is required");
            return;
        }

        setUpdating(true);
        const loadingToast = toast.loading("Updating Identity Protocol...");

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                postalCode: formData.postalCode.trim(),
                lastUpdated: new Date().toISOString()
            });
            toast.success("Profile Authenticated & Updated.", { id: loadingToast });
        } catch (error) {
            toast.error("Update Interrupted. Check Connection.", { id: loadingToast });
            console.error("Update error:", error);
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords don't match");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setUpdating(true);
        const loadingToast = toast.loading("Updating security credentials...");

        try {
            const credential = EmailAuthProvider.credential(
                user.email,
                passwordData.currentPassword
            );
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, passwordData.newPassword);
            
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success("Password updated successfully", { id: loadingToast });
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                toast.error("Current password is incorrect", { id: loadingToast });
            } else {
                toast.error("Failed to update password", { id: loadingToast });
            }
            console.error("Password update error:", error);
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            shipped: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
            delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
            cancelled: 'bg-red-500/10 text-red-600 border-red-500/20'
        };
        return colors[status] || colors.pending;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-2 border-black/20 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mt-6">Loading Identity Matrix...</p>
        </div>
    );

    if (!user) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
            <div className="relative w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-300" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            </div>
            <div className="text-center space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Authentication Required</p>
                <p className="text-[9px] text-gray-300 tracking-wider">Please login to access your portfolio</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto animate-fadeIn">
            {/* Enhanced Header */}
            <div className="mb-12 relative">
                <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-black/5 to-transparent rounded-full blur-3xl"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-300 italic block mb-2">Zaqeen Core System</span>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic mb-4">Identity Matrix</h1>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified Member Since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).getFullYear() : '2026'}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                    <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                        UID: {user?.uid.slice(-8).toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="group relative bg-gradient-to-br from-black to-neutral-900 p-6 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <svg className="w-8 h-8 text-white/60 mb-4" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">Total Orders</p>
                        <p className="text-3xl font-black text-white">{stats.totalOrders}</p>
                    </div>
                </div>

                <div className="group relative bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <svg className="w-8 h-8 text-white/60 mb-4" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                        </svg>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">Total Spent</p>
                        <p className="text-3xl font-black text-white">৳{stats.totalSpent.toFixed(2)}</p>
                    </div>
                </div>

                <div className="group relative bg-gradient-to-br from-neutral-800 to-neutral-700 p-6 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <svg className="w-8 h-8 text-white/60 mb-4" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">Pending</p>
                        <p className="text-3xl font-black text-white">{stats.pendingOrders}</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8 border-b border-gray-100">
                <div className="flex gap-1">
                    {[
                        { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                        { id: 'orders', label: 'Orders', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
                        { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group relative px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                activeTab === tab.id ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d={tab.icon} />
                                </svg>
                                {tab.label}
                            </div>
                            <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-black transition-transform duration-300 ${
                                activeTab === tab.id ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                            }`}></div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <form onSubmit={handleUpdate} className="space-y-10">
                    {/* Identity Display */}
                    <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-gradient-to-br from-gray-50/50 to-transparent border border-gray-100 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-black to-neutral-800 text-white rounded-full flex items-center justify-center text-3xl font-black italic shadow-2xl ring-4 ring-white">
                            {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="relative z-10 text-center md:text-left space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">Primary Identity</p>
                            <h2 className="text-2xl font-black uppercase tracking-wider italic">{formData.name || 'The Collector'}</h2>
                            <p className="text-[11px] font-bold text-gray-400 tracking-wide">{formData.email}</p>
                            <div className="flex items-center gap-2 justify-center md:justify-start mt-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-green-600">Active Status</span>
                            </div>
                        </div>
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                Full Name
                            </label>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-4 bg-white border border-gray-200 focus:border-black outline-none transition-all text-[11px] font-bold uppercase tracking-wide hover:border-gray-300"
                                    placeholder="IDENTIFIER NAME"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                Contact Protocol
                            </label>
                            <input 
                                type="tel" 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="w-full px-4 py-4 bg-white border border-gray-200 focus:border-black outline-none transition-all text-[11px] font-bold uppercase tracking-wide hover:border-gray-300"
                                placeholder="01XXXXXXXXX"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                City/Region
                            </label>
                            <input 
                                type="text" 
                                value={formData.city} 
                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                                className="w-full px-4 py-4 bg-white border border-gray-200 focus:border-black outline-none transition-all text-[11px] font-bold uppercase tracking-wide hover:border-gray-300"
                                placeholder="DHAKA"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                                </svg>
                                Postal Code
                            </label>
                            <input 
                                type="text" 
                                value={formData.postalCode} 
                                onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                                className="w-full px-4 py-4 bg-white border border-gray-200 focus:border-black outline-none transition-all text-[11px] font-bold uppercase tracking-wide hover:border-gray-300"
                                placeholder="1200"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                Primary Logistics Hub
                            </label>
                            <textarea 
                                rows="3"
                                value={formData.address} 
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                className="w-full px-4 py-4 bg-white border border-gray-200 focus:border-black outline-none transition-all text-[11px] font-bold uppercase tracking-wide resize-none hover:border-gray-300"
                                placeholder="HOUSE, STREET, REGION"
                            ></textarea>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6 flex flex-col sm:flex-row items-center gap-6">
                        <button 
                            type="submit" 
                            disabled={updating}
                            className="group relative px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.4em] overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl w-full sm:w-auto"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {updating ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Synchronize Profile
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        </button>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.25em] italic text-center sm:text-left">
                            <svg className="w-3 h-3 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            All data encrypted under Zaqeen security protocol
                        </p>
                    </div>
                </form>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div className="space-y-6">
                    {orders.length === 0 ? (
                        <div className="text-center py-20 space-y-4">
                            <svg className="w-20 h-20 mx-auto text-gray-200" fill="none" strokeWidth="1" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">No Orders Yet</p>
                            <p className="text-[9px] text-gray-300 tracking-wide">Start shopping to see your orders here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order.id} className="group bg-white border border-gray-100 hover:border-gray-200 transition-all p-6 hover:shadow-md">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">
                                                    Order #{order.id.slice(-8).toUpperCase()}
                                                </p>
                                                <span className={`text-[8px] font-black uppercase tracking-wider px-3 py-1 border ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-[9px] text-gray-400 tracking-wide">
                                                {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Amount</p>
                                            <p className="text-2xl font-black">৳{order.total?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    
                                    {order.items && order.items.length > 0 && (
                                        <div className="border-t border-gray-50 pt-4 mt-4">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Items ({order.items.length})</p>
                                            <div className="space-y-2">
                                                {order.items.slice(0, 3).map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 text-[10px]">
                                                        <div className="w-1 h-1 rounded-full bg-black"></div>
                                                        <span className="font-bold">{item.name}</span>
                                                        <span className="text-gray-400">×{item.quantity}</span>
                                                    </div>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <p className="text-[9px] text-gray-400 italic ml-4">+{order.items.length - 3} more items</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <form onSubmit={handlePasswordChange} className="space-y-8 max-w-2xl">
                    <div className="bg-amber-50 border border-amber-200 p-6 flex gap-4">
                        <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 mb-2">Security Protocol</p>
                            <p className="text-[9px] text-amber-700 leading-relaxed">
                                Password changes require current authentication. Ensure your new password is strong and unique.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                Current Password
                            </label>
                            <input 
                                type="password" 
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                className="w-full px-4 py-4 bg-white border border-gray-200 focus:border-black outline-none transition-all text-[11px] font-bold tracking-wide hover:border-gray-300"
                                placeholder="Enter current password"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                New Password
                            </label>
                            <input 
                                type="password" 
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                className="w-full px-4 py-4 bg-white border border-gray-200 focus:border-black outline-none transition-all text-[11px] font-bold tracking-wide hover:border-gray-300"
                                placeholder="Enter new password"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Confirm New Password
                            </label>
                            <input 
                                type="password" 
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                className="w-full px-4 py-4 bg-white border border-gray-200 focus:border-black outline-none transition-all text-[11px] font-bold tracking-wide hover:border-gray-300"
                                placeholder="Confirm new password"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={updating}
                        className="group relative px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.4em] overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            {updating ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Update Security Credentials
                                </>
                            )}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    </button>
                </form>
            )}
        </div>
    );
}