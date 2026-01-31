'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { HiPlus, HiTicket, HiX, HiCheckCircle, HiOutlineClock, HiOutlineBan, HiOutlineTrendingUp, HiOutlineInformationCircle, HiOutlineScissors } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function CouponAdmin() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // Hydration ফিক্সের জন্য

  const [newCoupon, setNewCoupon] = useState({ 
    code: '', type: 'percentage', value: '', minSpend: '', usageLimit: '', expiryDate: '', active: true 
  });

  // ১. মাউন্ট চেক (Hydration Mismatch দূর করতে)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) return;
    const uploadToast = toast.loading("Publishing campaign...");

    try {
      await addDoc(collection(db, 'coupons'), {
        ...newCoupon,
        code: newCoupon.code.toUpperCase().trim(),
        value: Number(newCoupon.value),
        minSpend: newCoupon.minSpend ? Number(newCoupon.minSpend) : 0,
        usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : null,
        usedCount: 0,
        createdAt: serverTimestamp(),
      });
      
      setNewCoupon({ code: '', type: 'percentage', value: '', minSpend: '', usageLimit: '', expiryDate: '', active: true });
      setIsModalOpen(false);
      toast.success("Coupon Protocol Live!", { id: uploadToast });
    } catch (error) {
      toast.error("Transmission Breach.", { id: uploadToast });
    }
  };

  const toggleCouponStatus = async (id, active) => {
    try {
      const couponRef = doc(db, 'coupons', id);
      await updateDoc(couponRef, { active: !active });
      toast.success(`Protocol ${!active ? 'Activated' : 'Inhibited'}`);
    } catch (error) {
      toast.error('System Error.');
    }
  };

  const deleteCoupon = async (id) => {
    if (window.confirm("Terminate this incentive archive permanently?")) {
        try {
            await deleteDoc(doc(db, 'coupons', id));
            toast.success('Archive Cleared.');
        } catch (error) {
            toast.error('Operation Failed.');
        }
    }
  };

  // যদি কম্পোনেন্ট মাউন্ট না হয়, তবে কিছু দেখাবে না (Hydration Safety)
  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#FDFDFD] p-6 md:p-12 selection:bg-black selection:text-white">
      <div className="max-w-[1440px] mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-10 border-b border-gray-50 pb-12">
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.8em] text-gray-300 font-black italic block">Marketing Suite</span>
            <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic leading-none text-black">Campaign Archive</h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="group relative bg-black text-white px-12 py-7 overflow-hidden shadow-2xl transition-all active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] italic">
              <HiPlus size={20} /> Initiate Reward Protocol
            </span>
            <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          </button>
        </header>

        {/* Analytics Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
          <div className="bg-white p-10 border border-gray-50 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex justify-between items-center group">
            <div className="space-y-3">
              <p className="text-[9px] uppercase tracking-[0.5em] text-gray-400 font-black italic">Active Protocols</p>
              <h2 className="text-5xl font-black tracking-tighter italic text-black">{coupons.filter(c => c.active && !isExpired(c.expiryDate)).length}</h2>
            </div>
            <HiOutlineTrendingUp size={40} className="text-gray-50 group-hover:text-black transition-colors duration-500" />
          </div>

          <div className="bg-black p-10 text-white rounded-sm shadow-2xl flex justify-between items-center relative overflow-hidden group">
             <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-[2s]"><HiTicket className="w-48 h-48" /></div>
             <div className="relative z-10 space-y-3">
                <p className="text-[9px] uppercase tracking-[0.5em] text-gray-500 font-black italic">Incentive Strategy</p>
                <h2 className="text-2xl font-black tracking-widest uppercase italic leading-none">Zaqeen <br/> Rewards</h2>
             </div>
          </div>

          <div className="bg-white p-10 border border-gray-50 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex justify-between items-center group">
            <div className="space-y-3">
              <p className="text-[9px] uppercase tracking-[0.5em] text-gray-400 font-black italic">System Vault</p>
              <h2 className="text-5xl font-black tracking-tighter italic text-black">{coupons.length}</h2>
            </div>
            <HiOutlineInformationCircle size={40} className="text-gray-50 group-hover:text-black transition-colors duration-500" />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-gray-50 shadow-[0_40px_100px_rgba(0,0,0,0.02)] rounded-sm overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-black text-white text-[9px] uppercase tracking-[0.4em] font-black italic">
                  <th className="p-8">Identity Key</th>
                  <th className="p-8 text-center">Structure</th>
                  <th className="p-8 text-center">Operational Limits</th>
                  <th className="p-8 text-center">Status Protocol</th>
                  <th className="p-8 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="5" className="p-24 text-center"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                ) : coupons.map(c => {
                  const expired = isExpired(c.expiryDate);
                  return (
                    <tr key={c.id} className={`group transition-all hover:bg-gray-50/50 ${expired || !c.active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                      <td className="p-8">
                        <div className="flex items-center gap-8">
                          <div className="w-14 h-14 bg-gray-50 rounded-sm flex items-center justify-center text-gray-300 border border-gray-100 group-hover:bg-black group-hover:text-white transition-all duration-500">
                            <HiOutlineScissors size={24} strokeWidth={1.5} />
                          </div>
                          <div>
                            <span className="text-lg font-black tracking-widest text-black uppercase italic leading-none">{c.code}</span>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 italic flex items-center gap-2">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                                {c.type === 'percentage' ? `${c.value}% Deduction` : `৳${c.value} Flat Offset`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        <div className="space-y-2">
                           <span className="text-[9px] font-black uppercase text-gray-300 tracking-[0.3em] block">Threshold</span>
                           <span className="text-sm font-black tracking-tight text-black italic">৳{c.minSpend || 0}</span>
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        <div className="space-y-2">
                           <span className="text-[9px] font-black uppercase text-gray-300 tracking-[0.3em] block">Used Velocity</span>
                           <span className="text-sm font-black tracking-tight text-black italic">{c.usedCount || 0} / {c.usageLimit || '∞'}</span>
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                           <span className={`text-[9px] font-black px-4 py-1.5 uppercase tracking-widest border italic rounded-sm transition-all
                             ${!c.active ? 'border-rose-100 text-rose-500 bg-rose-50' : 
                               expired ? 'border-amber-100 text-amber-500 bg-amber-50' : 
                               'border-emerald-100 text-emerald-500 bg-emerald-50'
                             }`}>
                             {!c.active ? 'Inhibited' : expired ? 'Protocol Expired' : 'Operational'}
                           </span>
                           {c.expiryDate && (
                             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-300 italic">
                               <HiOutlineClock className="w-3 h-3" /> {new Date(c.expiryDate).toLocaleDateString('en-GB')}
                             </div>
                           )}
                        </div>
                      </td>
                      <td className="p-8 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => toggleCouponStatus(c.id, c.active)} className={`p-4 rounded-sm transition-all duration-500 ${c.active ? 'bg-gray-50 text-gray-300 hover:bg-amber-500 hover:text-white' : 'bg-gray-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}>
                            {c.active ? <HiOutlineBan size={18} /> : <HiCheckCircle size={18} />}
                          </button>
                          <button onClick={() => deleteCoupon(c.id)} className="p-4 bg-gray-50 text-gray-200 rounded-sm hover:bg-black hover:text-white transition-all duration-500 shadow-sm">
                            <HiX size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Logic */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[999] p-6 overflow-y-auto">
            <div className="bg-white w-full max-w-xl relative p-12 md:p-16 animate-slideUp rounded-sm border border-gray-100">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-300 hover:text-black transition-colors"><HiX size={26} /></button>
              <header className="mb-12 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.8em] text-gray-300 italic block">New Protocol</span>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Draft Incentive</h2>
              </header>
              <form onSubmit={handleAddCoupon} className="space-y-12">
                <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 italic ml-1">Voucher Key (Code)</label>
                  <input type="text" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} placeholder="E.G. WINTER_26" className="w-full bg-[#fcfcfc] border border-gray-100 p-6 text-sm font-black tracking-[0.4em] outline-none focus:border-black transition-all uppercase italic" required />
                </div>
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 italic">Structure</label>
                    <select value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value})} className="w-full bg-white border border-gray-100 p-6 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer focus:border-black italic">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Flat (৳)</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 italic">Value</label>
                    <input type="number" value={newCoupon.value} onChange={e => setNewCoupon({...newCoupon, value: e.target.value})} className="w-full bg-[#fcfcfc] border border-gray-100 p-6 text-xl font-black outline-none focus:border-black italic" required />
                  </div>
                </div>
                <button type="submit" className="group relative w-full bg-black text-white py-8 text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl overflow-hidden transition-all active:scale-95 italic">
                    <span className="relative z-10">Publish Protocol</span>
                    <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
