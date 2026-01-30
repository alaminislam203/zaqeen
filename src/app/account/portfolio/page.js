'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { 
  HiOutlineUserCircle, 
  HiOutlineMail, 
  HiOutlinePhone, 
  HiOutlineFingerPrint, 
  HiOutlineBadgeCheck // Fixed name
} from 'react-icons/hi';

export default function PortfolioPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    
    // প্রোফাইল ডেটা স্টেট
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        email: ''
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setFormData({
                        name: data.name || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        email: currentUser.email || ''
                    });
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        const loadingToast = toast.loading("Updating Identity Protocol...");

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                lastUpdated: new Date()
            });
            toast.success("Profile Authenticated & Updated.", { id: loadingToast });
        } catch (error) {
            toast.error("Update Interrupted. Check Connection.", { id: loadingToast });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto animate-fadeIn">
            {/* --- Header Section --- */}
            <div className="mb-16 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-300 italic block">Zaqeen Core</span>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">Profile Identity</h1>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
                    <HiOutlineCheckBadge className="text-black text-lg" /> 
                    Authorized Member since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).getFullYear() : '2026'}
                </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-12">
                {/* Visual Identity Display */}
                <div className="flex flex-col sm:flex-row items-center gap-8 p-10 bg-gray-50/50 border border-gray-50 rounded-sm">
                    <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center text-3xl font-black italic shadow-2xl">
                        {formData.name?.charAt(0) || 'U'}
                    </div>
                    <div className="text-center sm:text-left space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Account Type</p>
                        <h2 className="text-xl font-black uppercase tracking-widest italic">The Collector</h2>
                        <p className="text-[11px] font-bold text-gray-300 italic lowercase">{user?.email}</p>
                    </div>
                </div>

                {/* Form Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Full Name</label>
                        <div className="relative group">
                            <HiOutlineUserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" />
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-sm focus:border-black outline-none transition-all text-[11px] font-black uppercase tracking-widest"
                                placeholder="IDENTIFIER NAME"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Contact Protocol</label>
                        <div className="relative group">
                            <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" />
                            <input 
                                type="text" 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-sm focus:border-black outline-none transition-all text-[11px] font-black uppercase tracking-widest"
                                placeholder="01XXXXXXXXX"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Primary Logistics Hub (Address)</label>
                        <div className="relative group">
                            <HiOutlineFingerPrint className="absolute left-4 top-4 text-gray-300 group-focus-within:text-black transition-colors" />
                            <textarea 
                                rows="3"
                                value={formData.address} 
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-sm focus:border-black outline-none transition-all text-[11px] font-black uppercase tracking-widest italic"
                                placeholder="HOUSE, STREET, REGION"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-6">
                    <button 
                        type="submit" 
                        disabled={updating}
                        className="group relative w-full sm:w-auto px-16 py-6 bg-black text-white text-[10px] font-black uppercase tracking-[0.5em] overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 shadow-2xl"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-4">
                            {updating ? 'Processing...' : 'Synchronize Profile'}
                        </span>
                        <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    </button>
                    <p className="text-[8px] text-gray-300 font-bold uppercase tracking-[0.3em] mt-6 italic text-center sm:text-left">
                        * All sensitive data is encrypted under Zaqeen's security protocol.
                    </p>
                </div>
            </form>
        </div>
    );
}
