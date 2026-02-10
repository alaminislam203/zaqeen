'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function PortfolioPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, pendingOrders: 0 });
    const [errors, setErrors] = useState({});
    const router = useRouter();
    
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

    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
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
                            name: data.displayName || data.name || '',
                            phone: data.phone || '',
                            address: data.address || '',
                            email: currentUser.email || '',
                            city: data.city || '',
                            postalCode: data.postalCode || ''
                        });
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            name: currentUser.displayName || '',
                            email: currentUser.email || ''
                        }));
                    }

                    await fetchUserOrders(currentUser.uid);
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    toast.error("Failed to load profile data", {
                        style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
                    });
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
                limit(20)
            );
            const snapshot = await getDocs(q);
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setOrders(ordersData);

            // Calculate stats
            const totalSpent = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
            const pendingOrders = ordersData.filter(order => 
                order.status === 'pending' || order.status === 'processing'
            ).length;
            
            setStats({
                totalOrders: ordersData.length,
                totalSpent: totalSpent,
                pendingOrders: pendingOrders
            });
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'নাম আবশ্যক';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'নাম কমপক্ষে ২ অক্ষরের হতে হবে';
        }

        if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
            newErrors.phone = 'সঠিক ফোন নাম্বার লিখুন';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (!user) {
            toast.error("Please login first", {
                style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
            });
            return;
        }

        if (!validateForm()) {
            toast.error("দয়া করে সব ফিল্ড সঠিকভাবে পূরণ করুন", {
                style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
            });
            return;
        }

        setUpdating(true);
        const loadingToast = toast.loading("Updating profile...");

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: formData.name.trim(),
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                postalCode: formData.postalCode.trim(),
                updatedAt: new Date()
            });
            
            toast.success("Profile updated successfully!", { 
                id: loadingToast,
                style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
            });
        } catch (error) {
            toast.error("Failed to update profile", { 
                id: loadingToast,
                style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
            });
            console.error("Update error:", error);
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error("সব ফিল্ড পূরণ করুন", {
                style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
            });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("নতুন পাসওয়ার্ড মিলছে না", {
                style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
            });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", {
                style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
            });
            return;
        }

        setUpdating(true);
        const loadingToast = toast.loading("Updating password...");

        try {
            const credential = EmailAuthProvider.credential(
                user.email,
                passwordData.currentPassword
            );
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, passwordData.newPassword);
            
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success("Password updated successfully", { 
                id: loadingToast,
                style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
            });
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                toast.error("বর্তমান পাসওয়ার্ড ভুল", { 
                    id: loadingToast,
                    style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
                });
            } else if (error.code === 'auth/weak-password') {
                toast.error("পাসওয়ার্ড আরও শক্তিশালী করুন", { 
                    id: loadingToast,
                    style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
                });
            } else {
                toast.error("Failed to update password", { 
                    id: loadingToast,
                    style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
                });
            }
            console.error("Password update error:", error);
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            processing: 'bg-blue-50 text-blue-700 border-blue-200',
            shipped: 'bg-purple-50 text-purple-700 border-purple-200',
            delivered: 'bg-green-50 text-green-700 border-green-200',
            cancelled: 'bg-red-50 text-red-700 border-red-200'
        };
        return colors[status] || colors.pending;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const tabs = [
        { 
            id: 'profile', 
            label: 'প্রোফাইল', 
            icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' 
        },
        { 
            id: 'orders', 
            label: 'অর্ডার', 
            icon: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' 
        },
        { 
            id: 'security', 
            label: 'সিকিউরিটি', 
            icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' 
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-[9px] uppercase tracking-[0.4em] font-black text-gray-400">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4">
                <div className="max-w-md w-full text-center space-y-8">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-12 h-12 text-gray-300" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-3">অ্যাকাউন্ট রিকোয়ার্ড</h2>
                        <p className="text-gray-600">আপনার প্রোফাইল দেখতে লগইন করুন</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/account/login"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white text-[11px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                            লগইন করুন
                        </Link>
                        <Link
                            href="/account/signup"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black border-2 border-black text-[11px] font-black uppercase tracking-wider hover:bg-black hover:text-white transition-all"
                        >
                            সাইন আপ করুন
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                
                {/* Header */}
                <div className="mb-12">
                    <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black block mb-4">My Account</span>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">আমার অ্যাকাউন্ট</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold">Verified Account</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">Member since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).getFullYear() : '2026'}</span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white border-2 border-gray-200 p-8 hover:border-black transition-all group">
                        <svg className="w-10 h-10 text-gray-300 group-hover:text-black transition-colors mb-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <p className="text-[10px] font-black uppercase tracking-wide text-gray-500 mb-2">মোট অর্ডার</p>
                        <p className="text-4xl font-black">{stats.totalOrders}</p>
                    </div>

                    <div className="bg-white border-2 border-gray-200 p-8 hover:border-black transition-all group">
                        <svg className="w-10 h-10 text-gray-300 group-hover:text-black transition-colors mb-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                        </svg>
                        <p className="text-[10px] font-black uppercase tracking-wide text-gray-500 mb-2">মোট খরচ</p>
                        <p className="text-4xl font-black">৳{stats.totalSpent.toLocaleString()}</p>
                    </div>

                    <div className="bg-white border-2 border-gray-200 p-8 hover:border-black transition-all group">
                        <svg className="w-10 h-10 text-gray-300 group-hover:text-black transition-colors mb-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[10px] font-black uppercase tracking-wide text-gray-500 mb-2">পেন্ডিং</p>
                        <p className="text-4xl font-black">{stats.pendingOrders}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-8 border-b border-gray-200">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-black text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                                </svg>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="animate-fadeIn">
                    
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleUpdate} className="space-y-8">
                            {/* User Info Card */}
                            <div className="bg-white border-2 border-gray-200 p-8 flex items-center gap-6">
                                <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-3xl font-black">
                                    {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight mb-1">{formData.name || 'User'}</h3>
                                    <p className="text-sm text-gray-600">{formData.email}</p>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                        নাম *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 bg-white border-2 ${
                                            errors.name ? 'border-red-500' : 'border-gray-200'
                                        } focus:border-black outline-none transition-all text-sm font-bold`}
                                        placeholder="আপনার নাম"
                                    />
                                    {errors.name && (
                                        <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                        </svg>
                                        ফোন
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 bg-white border-2 ${
                                            errors.phone ? 'border-red-500' : 'border-gray-200'
                                        } focus:border-black outline-none transition-all text-sm font-bold`}
                                        placeholder="+880 1234-567890"
                                    />
                                    {errors.phone && (
                                        <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.phone}
                                        </p>
                                    )}
                                </div>

                                {/* City */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                        শহর
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                        placeholder="ঢাকা"
                                    />
                                </div>

                                {/* Postal Code */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                        পোস্টাল কোড
                                    </label>
                                    <input
                                        type="text"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                        placeholder="1200"
                                    />
                                </div>

                                {/* Address */}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                        </svg>
                                        ঠিকানা
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold resize-none"
                                        placeholder="বাসা, রাস্তা, এলাকা"
                                    ></textarea>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={updating}
                                className="group relative w-full md:w-auto px-12 py-5 bg-black text-white text-[11px] font-black uppercase tracking-wider overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {updating ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            আপডেট করা হচ্ছে...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            আপডেট করুন
                                        </>
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            </button>
                        </form>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div className="space-y-6">
                            {orders.length === 0 ? (
                                <div className="bg-white border-2 border-gray-200 p-20 text-center">
                                    <svg className="w-20 h-20 mx-auto text-gray-200 mb-6" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-gray-400 mb-2">কোনো অর্ডার নেই</h3>
                                    <p className="text-sm text-gray-500 mb-6">শপিং শুরু করুন এবং আপনার অর্ডার এখানে দেখুন</p>
                                    <Link
                                        href="/shop"
                                        className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white text-[11px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                        </svg>
                                        শপিং শুরু করুন
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map(order => (
                                        <div key={order.id} className="bg-white border-2 border-gray-200 p-6 hover:border-black transition-all">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <p className="text-sm font-black uppercase tracking-wide">
                                                            অর্ডার #{order.id.slice(-8).toUpperCase()}
                                                        </p>
                                                        <span className={`text-[9px] font-black uppercase px-3 py-1 border-2 ${getStatusColor(order.status)}`}>
                                                            {order.status === 'pending' ? 'পেন্ডিং' :
                                                             order.status === 'processing' ? 'প্রসেসিং' :
                                                             order.status === 'shipped' ? 'শিপড' :
                                                             order.status === 'delivered' ? 'ডেলিভারড' :
                                                             'ক্যান্সেলড'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-wide text-gray-500 mb-1">মোট</p>
                                                    <p className="text-3xl font-black">৳{order.total?.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {order.items && order.items.length > 0 && (
                                                <div className="border-t-2 border-gray-100 pt-4 mt-4">
                                                    <p className="text-[10px] font-black uppercase tracking-wide text-gray-500 mb-3">
                                                        আইটেম ({order.items.length})
                                                    </p>
                                                    <div className="space-y-2">
                                                        {order.items.slice(0, 3).map((item, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                                <span className="font-bold">{item.name || item.title}</span>
                                                                <span className="text-gray-600">×{item.quantity}</span>
                                                            </div>
                                                        ))}
                                                        {order.items.length > 3 && (
                                                            <p className="text-xs text-gray-500 italic">+{order.items.length - 3} আরো আইটেম</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t-2 border-gray-100">
                                                <Link
                                                    href={`/track-order?id=${order.id}`}
                                                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wide hover:underline"
                                                >
                                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                    </svg>
                                                    অর্ডার ট্র্যাক করুন
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <form onSubmit={handlePasswordChange} className="space-y-8 max-w-2xl">
                            <div className="bg-amber-50 border-2 border-amber-200 p-6 flex gap-4">
                                <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-wide text-amber-800 mb-2">সিকিউরিটি নোট</p>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        পাসওয়ার্ড পরিবর্তন করতে আপনার বর্তমান পাসওয়ার্ড প্রয়োজন। নতুন পাসওয়ার্ড অবশ্যই শক্তিশালী এবং অনন্য হতে হবে।
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Current Password */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                        বর্তমান পাসওয়ার্ড *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword.current ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold pr-12"
                                            placeholder="বর্তমান পাসওয়ার্ড"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                        >
                                            {showPassword.current ? (
                                                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                        নতুন পাসওয়ার্ড *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword.new ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold pr-12"
                                            placeholder="নতুন পাসওয়ার্ড"
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                        >
                                            {showPassword.new ? (
                                                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                        </svg>
                                        পাসওয়ার্ড নিশ্চিত করুন *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword.confirm ? 'text' : 'password'}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold pr-12"
                                            placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                        >
                                            {showPassword.confirm ? (
                                                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={updating}
                                className="group relative w-full md:w-auto px-12 py-5 bg-black text-white text-[11px] font-black uppercase tracking-wider overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {updating ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            আপডেট করা হচ্ছে...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                            </svg>
                                            পাসওয়ার্ড আপডেট করুন
                                        </>
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
