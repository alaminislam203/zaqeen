'use client';
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import toast from 'react-hot-toast';
import { HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlineKey, HiOutlineExclamationCircle } from 'react-icons/hi';

export default function SecurityPage() {
    const [updating, setUpdating] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error("Blueprint Mismatch: Passwords do not match.");
        }

        if (formData.newPassword.length < 8) {
            return toast.error("Security Breach: Password must be at least 8 characters.");
        }

        setUpdating(true);
        const loadingToast = toast.loading("Encrypting New Security Protocol...");

        try {
            const user = auth.currentUser;
            
            // ফায়ারবেসে পাসওয়ার্ড চেঞ্জ করার আগে রি-অথেন্টিকেশন প্রয়োজন হয়
            const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
            await reauthenticateWithCredential(user, credential);
            
            await updatePassword(user, formData.newPassword);
            
            toast.success("Security Protocol Updated. Access Secured.", { id: loadingToast });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error(error);
            toast.error("Auth Failure: Current password incorrect or session expired.", { id: loadingToast });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fadeIn">
            {/* Header */}
            <div className="mb-16 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-300 italic block">Zaqeen Shield</span>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">Security Protocol</h1>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
                    <HiOutlineShieldCheck className="text-emerald-500 text-lg" /> 
                    End-to-End Encrypted Identity Management
                </p>
            </div>

            <div className="grid grid-cols-1 gap-12">
                {/* Security Status Card */}
                <div className="bg-black p-8 md:p-10 text-white rounded-sm border border-neutral-800 shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.4em] italic">Access Authorization</h3>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest leading-relaxed uppercase">
                                Your account is currently protected by <br/> Zaqeen Multi-Layered Authentication.
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                             <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                                <HiOutlineShieldCheck className="text-emerald-500 text-2xl" />
                             </div>
                             <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">System Active</span>
                        </div>
                    </div>
                    {/* Background Decoration */}
                    <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                        <HiOutlineLockClosed size={180} />
                    </div>
                </div>

                {/* Password Update Form */}
                <form onSubmit={handlePasswordUpdate} className="space-y-10">
                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Current Password Identity</label>
                            <div className="relative group">
                                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" />
                                <input 
                                    type="password" 
                                    required
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-sm focus:border-black outline-none transition-all text-[11px] font-black uppercase tracking-widest"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>

                        <div className="h-[1px] bg-gray-50 w-full my-4"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">New Security Key</label>
                                <div className="relative group">
                                    <HiOutlineKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" />
                                    <input 
                                        type="password" 
                                        required
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-sm focus:border-black outline-none transition-all text-[11px] font-black uppercase tracking-widest"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Confirm Blueprint</label>
                                <div className="relative group">
                                    <HiOutlineKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" />
                                    <input 
                                        type="password" 
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-sm focus:border-black outline-none transition-all text-[11px] font-black uppercase tracking-widest"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8 pt-6">
                        <button 
                            type="submit" 
                            disabled={updating}
                            className="w-full md:w-auto px-16 py-6 bg-black text-white text-[11px] font-black uppercase tracking-[0.5em] transition-all hover:bg-neutral-900 active:scale-95 disabled:opacity-50 shadow-2xl relative overflow-hidden group/btn"
                        >
                            <span className="relative z-10">{updating ? 'Synchronizing...' : 'Update Security Protocol'}</span>
                            <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500"></div>
                        </button>
                        
                        <div className="flex items-center gap-3 text-rose-500 opacity-60">
                            <HiOutlineExclamationCircle size={16} />
                            <p className="text-[8px] font-black uppercase tracking-widest italic">Changes take effect immediately.</p>
                        </div>
                    </div>
                </form>

                {/* Account Actions Warning */}
                <div className="mt-20 p-8 border border-rose-50 bg-rose-50/10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600 mb-2 italic">Danger Zone</h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-6">
                        Terminate account identity will permanently delete all your acquisition archives and saved portfolios. This action is irreversible.
                    </p>
                    <button className="text-[9px] font-black uppercase tracking-[0.4em] text-rose-500 border-b border-rose-200 hover:border-rose-500 transition-all pb-1 italic">
                        Request Identity Termination
                    </button>
                </div>
            </div>
        </div>
    );
}
