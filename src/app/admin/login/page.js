'use client';
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { HiOutlineLockClosed, HiOutlineMail, HiOutlineShieldCheck } from "react-icons/hi";
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loginToast = toast.loading("Authenticating credentials...");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Identity Verified. Welcome back.", { id: loginToast });
      router.push("/admin/orders");
    } catch (err) {
      toast.error("Access Denied. Check credentials.", { id: loginToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full px-6 z-10 animate-fadeIn">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 md:p-14 rounded-sm shadow-2xl">
          
          {/* Brand Identity */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-6 group transition-all duration-700 hover:border-white/30">
               <HiOutlineShieldCheck className="text-white w-8 h-8 opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-[0.5em] text-white italic">Zaqeen</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold mt-3">Restricted Access Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            {/* Email Input */}
            <div className="space-y-2 group">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 group-focus-within:text-white transition-colors">Administrator Email</label>
              <div className="relative flex items-center">
                <HiOutlineMail className="absolute left-0 text-gray-600 group-focus-within:text-white transition-colors" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 py-3 pl-8 text-sm text-white outline-none focus:border-white transition-all tracking-wider font-light"
                  placeholder="admin@zaqeen.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2 group">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 group-focus-within:text-white transition-colors">Secure Key (Password)</label>
              <div className="relative flex items-center">
                <HiOutlineLockClosed className="absolute left-0 text-gray-600 group-focus-within:text-white transition-colors" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 py-3 pl-8 text-sm text-white outline-none focus:border-white transition-all tracking-[0.3em]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              disabled={loading}
              className="group relative w-full bg-white text-black py-5 overflow-hidden transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.4em]">
                {loading ? 'Validating...' : 'Enter Dashboard'}
              </span>
              <div className="absolute inset-0 bg-gray-200 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-12 text-center">
             <p className="text-[8px] uppercase tracking-[0.2em] text-gray-600 font-bold">
               Zaqeen Core Engine v2.0 — Encrypted Session
             </p>
          </div>
        </div>
        
        <div className="text-center mt-8">
           <button 
             onClick={() => router.push('/')} 
             className="text-[9px] uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors border-b border-transparent hover:border-white/20 pb-1"
           >
             Return to Public Storefront
           </button>
        </div>
      </div>
    </main>
  );
}