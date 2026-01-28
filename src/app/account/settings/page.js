"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { HiOutlineUser, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineSave } from "react-icons/hi";
import toast from 'react-hot-toast';

export default function ProfileSettings() {
  const [userData, setUserData] = useState({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const fetchUserData = async () => {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        };
        fetchUserData();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Identity required for this action.");
      return;
    }
    setLoading(true);
    const updateToast = toast.loading("Updating your profile...");
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, userData);
      toast.success("Identity updated successfully.", { id: updateToast });
    } catch (error) {
      toast.error("Update failed. Please try again.", { id: updateToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-2xl">
      {/* Header Section */}
      <div className="flex justify-between items-baseline mb-12 border-b border-gray-50 pb-8">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold">Preferences</span>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">Personal Identity</h1>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Full Name Input */}
          <div className="group space-y-2">
            <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 group-focus-within:text-black transition-colors">
              <HiOutlineUser size={14} /> Full Name
            </label>
            <input 
              type="text" 
              className="w-full bg-transparent border-b border-gray-100 py-3 text-sm font-bold tracking-tight outline-none focus:border-black transition-all placeholder:text-gray-200"
              placeholder="E.G. ABDULLAH AL ZAQEEN"
              value={userData.name || ''}
              onChange={(e) => setUserData({...userData, name: e.target.value})}
            />
          </div>

          {/* Phone Number Input */}
          <div className="group space-y-2">
            <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 group-focus-within:text-black transition-colors">
              <HiOutlinePhone size={14} /> Phone Number
            </label>
            <input 
              type="text" 
              className="w-full bg-transparent border-b border-gray-100 py-3 text-sm font-mono font-bold tracking-widest outline-none focus:border-black transition-all placeholder:text-gray-200"
              placeholder="+880 1XXX XXXXXX"
              value={userData.phone || ''}
              onChange={(e) => setUserData({...userData, phone: e.target.value})}
            />
          </div>
        </div>

        {/* Shipping Address Textarea */}
        <div className="group space-y-2">
          <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 group-focus-within:text-black transition-colors">
            <HiOutlineLocationMarker size={14} /> Default Shipping Address
          </label>
          <textarea 
            className="w-full bg-[#fcfcfc] border border-gray-50 p-6 text-[13px] font-light leading-relaxed focus:bg-white focus:border-black outline-none transition-all rounded-sm no-scrollbar min-h-[120px]"
            placeholder="Provide house, road, and area details for seamless delivery..."
            value={userData.address || ''}
            onChange={(e) => setUserData({...userData, address: e.target.value})}
          ></textarea>
        </div>

        {/* Action Button */}
        <div className="pt-6">
          <button 
            disabled={loading} 
            className="group relative w-full md:w-auto min-w-[200px] bg-black text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] overflow-hidden shadow-2xl hover:shadow-black/20 transition-all disabled:opacity-30"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? "Synchronizing..." : (
                <>
                  <HiOutlineSave size={18} /> Update Portfolio
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gray-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          </button>
        </div>
      </form>

      {/* Security Info Footnote */}
      <div className="mt-20 pt-8 border-t border-gray-50 flex items-center gap-4 opacity-30">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <p className="text-[8px] uppercase tracking-widest font-bold">Your information is encrypted within the Zaqeen ecosystem.</p>
      </div>
    </div>
  );
}