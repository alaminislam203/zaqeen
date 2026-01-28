'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { HiPlus, HiTicket, HiX, HiCheckCircle, HiOutlineClock, HiOutlineBan, HiOutlineTrendingUp, HiOutlineInformationCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function CouponAdmin() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newCoupon, setNewCoupon] = useState({ 
    code: '', type: 'percentage', value: '', minSpend: '', usageLimit: '', expiryDate: '', active: true 
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

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
      toast.success("Coupon Live!", { id: uploadToast });
    } catch (error) {
      toast.error("Failed to publish", { id: uploadToast });
    }
  };

  const toggleCouponStatus = async (id, active) => {
    const statusToast = toast.loading(`Updating status...`);
    try {
      const couponRef = doc(db, 'coupons', id);
      await updateDoc(couponRef, { active: !active });
      toast.success(`Coupon ${!active ? 'activated' : 'deactivated'}.`, { id: statusToast });
    } catch (error) {
      toast.error('Failed to update status.', { id: statusToast });
      console.error("Error toggling coupon status: ", error);
    }
  };

  const deleteCoupon = async (id) => {
    if (window.confirm("Are you sure you want to delete this coupon? This action cannot be undone.")) {
        const deleteToast = toast.loading('Deleting coupon...');
        try {
            await deleteDoc(doc(db, 'coupons', id));
            toast.success('Coupon deleted.', { id: deleteToast });
        } catch (error) {
            toast.error('Failed to delete coupon.', { id: deleteToast });
            console.error("Error deleting coupon: ", error);
        }
    }
  };

  const isExpired = (expiryDate) => expiryDate && new Date(expiryDate) < new Date();

  return (
    <main className="min-h-screen bg-[#FDFDFD] p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-gray-100 pb-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold italic">Marketing Suite</span>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic mt-2">Promotion Center</h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="group relative bg-black text-white px-10 py-5 overflow-hidden shadow-2xl transition-all active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
              <HiPlus size={18} /> Create Coupon
            </span>
            <div className="absolute inset-0 bg-gray-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          </button>
        </header>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 border border-gray-100 rounded-sm shadow-sm flex justify-between items-center group hover:border-black transition-all">
            <div>
              <p className="text-[9px] uppercase tracking-[0.4em] text-gray-400 font-black mb-2">Active Campaigns</p>
              <h2 className="text-3xl font-black tracking-tighter italic">{coupons.filter(c => c.active && !isExpired(c.expiryDate)).length}</h2>
            </div>
            <HiOutlineTrendingUp className="w-10 h-10 text-emerald-50" />
          </div>
          <div className="bg-[#0a0a0a] p-8 text-white rounded-sm shadow-xl flex justify-between items-center relative overflow-hidden group">
             <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><HiTicket className="w-32 h-32" /></div>
             <div className="relative z-10">
                <p className="text-[9px] uppercase tracking-[0.4em] text-gray-500 font-black mb-2">Incentive Strategy</p>
                <h2 className="text-xl font-black tracking-widest uppercase italic">Zaqeen Rewards</h2>
             </div>
          </div>
          <div className="bg-white p-8 border border-gray-100 rounded-sm shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[9px] uppercase tracking-[0.4em] text-gray-400 font-black mb-2">Total Coupons</p>
              <h2 className="text-3xl font-black tracking-tighter italic">{coupons.length}</h2>
            </div>
            <HiOutlineInformationCircle className="w-10 h-10 text-gray-100" />
          </div>
        </div>

        {/* Modal: New Coupon */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-[100] p-6 overflow-y-auto">
            <div className="bg-white border border-gray-100 shadow-2xl w-full max-w-xl relative p-10 md:p-14 animate-fadeIn rounded-sm">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-300 hover:text-black transition-colors"><HiX size={24} /></button>
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 block mb-2">New Reward</span>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-10 border-b border-gray-50 pb-4">Draft Campaign</h2>
              
              <form onSubmit={handleAddCoupon} className="space-y-10">
                <div className="group">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-focus-within:text-black transition-colors">Voucher Identity (Code)</label>
                  <input type="text" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} placeholder="E.G. ZAQEEN25" className="w-full bg-transparent border-b border-gray-100 py-3 text-lg font-black tracking-[0.3em] outline-none focus:border-black transition-all uppercase" required />
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div className="group">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Structure</label>
                    <select value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-3 text-[11px] font-bold uppercase tracking-widest outline-none cursor-pointer">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Flat (৳)</option>
                    </select>
                  </div>
                  <div className="group">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Reward Value</label>
                    <input type="number" value={newCoupon.value} onChange={e => setNewCoupon({...newCoupon, value: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-3 text-lg font-black outline-none focus:border-black" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div className="group">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Min. Spend (৳)</label>
                    <input type="number" value={newCoupon.minSpend} onChange={e => setNewCoupon({...newCoupon, minSpend: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-3 text-lg font-black outline-none focus:border-black" />
                  </div>
                  <div className="group">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Expiry Threshold</label>
                    <input type="date" value={newCoupon.expiryDate} onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-3 text-[11px] font-bold outline-none cursor-pointer" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-black text-white py-6 text-[11px] font-black uppercase tracking-[0.5em] shadow-xl hover:bg-gray-900 transition-all">Publish Masterpiece</button>
              </form>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white border border-gray-100 shadow-2xl shadow-gray-100/50 rounded-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white text-[9px] uppercase tracking-[0.4em] font-black">
                <th className="p-6">Voucher Details</th>
                <th className="p-6 text-center">Constraints</th>
                <th className="p-6 text-center">Lifecycle</th>
                <th className="p-6 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="4" className="p-20 text-center"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : coupons.map(c => {
                const expired = isExpired(c.expiryDate);
                return (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="p-6">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-gray-50 rounded-sm flex items-center justify-center text-black border border-gray-100">
                          <HiTicket size={24} />
                        </div>
                        <div>
                          <span className="text-sm font-black tracking-[0.2em] text-gray-900 uppercase">{c.code}</span>
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic">
                            {c.type === 'percentage' ? `${c.value}% Reduction` : `৳${c.value} Flat Off`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Min Spend</span>
                        <span className="text-sm font-black tracking-tight text-gray-800">৳{c.minSpend || 0}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                         <span className={`text-[8px] font-black px-3 py-1 uppercase tracking-widest border ${
                           !c.active ? 'border-rose-100 text-rose-500 bg-rose-50' : 
                           expired ? 'border-amber-100 text-amber-500 bg-amber-50' : 'border-emerald-100 text-emerald-500 bg-emerald-50'
                         }`}>
                           {!c.active ? 'Inhibited' : expired ? 'Void' : 'Operational'}
                         </span>
                         {c.expiryDate && (
                           <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-300">
                              <HiOutlineClock /> {new Date(c.expiryDate).toLocaleDateString()}
                           </div>
                         )}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => toggleCouponStatus(c.id, c.active)} className={`p-3 rounded-sm transition-all ${c.active ? 'bg-gray-50 text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-gray-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}>
                          {c.active ? <HiOutlineBan /> : <HiCheckCircle />}
                        </button>
                        <button onClick={() => deleteCoupon(c.id)} className="p-3 bg-gray-50 text-gray-300 rounded-sm hover:bg-rose-500 hover:text-white transition-all">
                          <HiX />
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
    </main>
  );
}