'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { HiOutlineLocationMarker, HiOutlineTruck, HiOutlineMap, HiOutlineOfficeBuilding, HiOutlinePhone } from 'react-icons/hi';

const districts = [
    'Dhaka', 'Lakshmipur', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh',
    'Feni', 'Noakhali', 'Cumilla', 'Cox\'s Bazar', 'Brahmanbaria', 'Chandpur'
    // আপনি চাইলে আগের চেকআউট পেজের সম্পূর্ণ ৬৪ জেলার লিস্ট এখানে কপি-পেস্ট করতে পারেন
];

export default function LogisticsPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    
    const [logisticsData, setLogisticsData] = useState({
        address: '',
        city: 'Dhaka',
        phone: '',
        areaType: 'Home' // Home, Office, or Other
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setLogisticsData({
                        address: data.address || '',
                        city: data.city || 'Dhaka',
                        phone: data.phone || '',
                        areaType: data.areaType || 'Home'
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
        const loadingToast = toast.loading("Updating Logistics Blueprint...");

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                ...logisticsData,
                lastLogisticsUpdate: new Date()
            });
            toast.success("Logistics Hub Updated Successfully.", { id: loadingToast });
        } catch (error) {
            toast.error("Transmission Error. Try again.", { id: loadingToast });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn">
            {/* Header */}
            <div className="mb-16 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-300 italic block underline decoration-gray-100 underline-offset-8">Zaqeen Protocol</span>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">Logistics Hub</h1>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-4">Manage your delivery coordinate identity.</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-16">
                
                {/* Location Type Selection */}
                <div className="grid grid-cols-3 gap-4">
                    {['Home', 'Office', 'Other'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setLogisticsData({...logisticsData, areaType: type})}
                            className={`py-6 border flex flex-col items-center gap-3 transition-all duration-500 rounded-sm ${logisticsData.areaType === type ? 'bg-black text-white border-black shadow-xl' : 'bg-white text-gray-300 border-gray-50'}`}
                        >
                            {type === 'Home' && <HiOutlineMap size={20} />}
                            {type === 'Office' && <HiOutlineOfficeBuilding size={20} />}
                            {type === 'Other' && <HiOutlineLocationMarker size={20} />}
                            <span className="text-[9px] font-black uppercase tracking-widest italic">{type} Hub</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Region Selection */}
                    <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
                            <HiOutlineTruck size={14} /> Region / District
                        </label>
                        <select 
                            value={logisticsData.city}
                            onChange={(e) => setLogisticsData({...logisticsData, city: e.target.value})}
                            className="w-full bg-white border border-gray-100 p-5 text-[11px] font-black uppercase tracking-widest outline-none focus:border-black cursor-pointer appearance-none transition-all"
                        >
                            {districts.sort().map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Phone Update */}
                    <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
                            <HiOutlinePhone size={14} /> Recovery Contact
                        </label>
                        <input 
                            type="text" 
                            value={logisticsData.phone}
                            onChange={(e) => setLogisticsData({...logisticsData, phone: e.target.value})}
                            className="w-full bg-white border border-gray-100 p-5 text-[11px] font-black uppercase tracking-widest outline-none focus:border-black transition-all"
                            placeholder="01XXXXXXXXX"
                        />
                    </div>

                    {/* Full Address */}
                    <div className="md:col-span-2 space-y-4">
                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
                            <HiOutlineMap size={14} /> Technical Street Address
                        </label>
                        <textarea 
                            rows="4"
                            value={logisticsData.address}
                            onChange={(e) => setLogisticsData({...logisticsData, address: e.target.value})}
                            className="w-full bg-white border border-gray-100 p-6 text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:border-black transition-all italic leading-relaxed"
                            placeholder="ENTER FULL HOUSE, ROAD AND AREA BLUEPRINT DETAILS..."
                        ></textarea>
                    </div>
                </div>

                {/* Status Card */}
                <div className="bg-gray-50 p-8 border-l-4 border-black flex items-center gap-6 group">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-sm group-hover:scale-110 transition-transform">
                        <HiOutlineLocationMarker size={24} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Active Coordinate</h4>
                        <p className="text-[11px] font-bold text-gray-400 mt-1 italic uppercase tracking-tighter">
                            {logisticsData.address ? `${logisticsData.address}, ${logisticsData.city}` : 'No logistics data provided.'}
                        </p>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-10 flex flex-col md:flex-row items-center gap-10">
                    <button 
                        type="submit" 
                        disabled={updating}
                        className="w-full md:w-auto px-16 py-6 bg-black text-white text-[11px] font-black uppercase tracking-[0.5em] transition-all hover:bg-neutral-900 active:scale-95 disabled:opacity-50 shadow-2xl"
                    >
                        {updating ? 'Archiving...' : 'Update Logistics Protocol'}
                    </button>
                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-[0.3em] italic max-w-xs">
                        * Deliveries are coordinated via Zaqeen Secure Channels only.
                    </p>
                </div>
            </form>
        </div>
    );
}
