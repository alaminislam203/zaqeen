'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowRight } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Security: Password must be 6+ characters.");
      return;
    }

    setLoading(true);
    const signupToast = toast.loading("Creating your Zaqeen profile...");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
          name: displayName,
          email: user.email,
          createdAt: serverTimestamp(),
          isAdmin: false
      });

      toast.success("Welcome to the Circle.", { id: signupToast });
      router.push('/account');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Identity already exists. Try signing in.", { id: signupToast });
      } else {
        toast.error("Registration failed. Try again.", { id: signupToast });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white">
     
      <div className="flex flex-col items-center justify-center px-6 py-20 md:py-32">
        <div className="max-w-md w-full">
          {/* Brand Header */}
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold italic block mb-4">Membership</span>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-gray-900">Create Identity</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-6 font-medium">
              Join the circle of confidence and certainty.
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-10">
            {/* Full Name */}
            <div className="group space-y-2">
              <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 group-focus-within:text-black transition-colors">
                <HiOutlineUser size={14} /> Full Name
              </label>
              <input 
                type="text" 
                required
                placeholder="E.G. ABDULLAH AL ZAQEEN"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-transparent border-b border-gray-100 py-3 text-sm font-bold tracking-tight outline-none focus:border-black transition-all placeholder:text-gray-100 uppercase"
              />
            </div>

            {/* Email Address */}
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

            {/* Password */}
            <div className="group space-y-2">
              <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 group-focus-within:text-black transition-colors">
                <HiOutlineLockClosed size={14} /> Secure Key
              </label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-gray-100 py-3 text-sm font-black tracking-[0.4em] outline-none focus:border-black transition-all placeholder:text-gray-100"
              />
            </div>

            {/* CTA Button */}
            <div className="pt-6">
              <button 
                disabled={loading}
                className="group relative w-full bg-black text-white py-6 text-[11px] font-black uppercase tracking-[0.5em] overflow-hidden transition-all shadow-2xl hover:shadow-black/20"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? "Authenticating..." : "Join Zaqeen Circle"}
                  {!loading && <HiOutlineArrowRight size={16} className="transition-transform group-hover:translate-x-2" />}
                </span>
                <div className="absolute inset-0 bg-gray-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-12 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
              Part of the circle?{' '}
              <Link href="/account/login" className="text-black border-b border-black pb-0.5 ml-2 hover:text-gray-500 hover:border-gray-500 transition-colors">
                Sign In
              </Link>
            </p>
          </div>

          {/* Security Note */}
          <div className="mt-20 pt-8 border-t border-gray-50 flex items-center justify-center gap-4 opacity-30">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-[8px] uppercase tracking-widest font-bold">Secure Registration — Zaqeen Privacy Protocol 2.0</p>
          </div>
        </div>
      </div>
    </main>
  );
}