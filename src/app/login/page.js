'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowNarrowRight } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loginToast = toast.loading("Verifying your identity...");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back to Zaqeen.", { id: loginToast });
      router.push('/account');
    } catch (error) {
      toast.error("Invalid credentials. Please try again.", { id: loginToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">

      <div className="flex flex-col items-center justify-center px-6 py-20 md:py-32 animate-fadeIn">
        <div className="max-w-md w-full">
          
          {/* Header Section */}
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold italic block mb-4">Member Access</span>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-gray-900">Sign In</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-6 font-medium">
              Continue your journey of confidence and certainty.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-10">
            {/* Email Field */}
            <div className="group space-y-2">
              <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 group-focus-within:text-black transition-colors">
                <HiOutlineMail size={14} /> Email Address
              </label>
              <input 
                type="email" 
                required
                placeholder="YOUR@EMAIL.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-gray-100 py-3 text-sm font-bold tracking-tight outline-none focus:border-black transition-all placeholder:text-gray-100 uppercase"
              />
            </div>

            {/* Password Field */}
            <div className="group space-y-2">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 group-focus-within:text-black transition-colors">
                  <HiOutlineLockClosed size={14} /> Secure Key
                </label>
                <Link href="/forgot-password" size={14} className="text-[8px] uppercase tracking-widest font-bold text-gray-300 hover:text-black transition-colors">
                  Forgot?
                </Link>
              </div>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-gray-100 py-3 text-sm font-black tracking-[0.4em] outline-none focus:border-black transition-all placeholder:text-gray-100"
              />
            </div>

            {/* Login Action */}
            <div className="pt-6">
              <button 
                disabled={loading}
                className="group relative w-full bg-black text-white py-6 text-[11px] font-black uppercase tracking-[0.5em] overflow-hidden transition-all shadow-2xl hover:shadow-black/20"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? "Verifying..." : "Enter the Vault"}
                  {!loading && <HiOutlineArrowNarrowRight size={18} className="transition-transform group-hover:translate-x-2" />}
                </span>
                <div className="absolute inset-0 bg-gray-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </button>
            </div>
          </form>

          {/* Redirection */}
          <div className="mt-12 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
              New to Zaqeen?{' '}
              <Link href="/account/signup" className="text-black border-b border-black pb-0.5 ml-2 hover:text-gray-500 hover:border-gray-500 transition-colors">
                Create Identity
              </Link>
            </p>
          </div>

          {/* Footer Security Badge */}
          <div className="mt-20 pt-8 border-t border-gray-50 flex items-center justify-center gap-4 opacity-30">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-[8px] uppercase tracking-widest font-bold">End-to-End Encryption Active</p>
          </div>
        </div>
      </div>
    </main>
  );
}