'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form', {
        style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
      });
      return;
    }

    setLoading(true);
    const loginToast = toast.loading("Signing you in...");
    
    try {
      await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
      
      // Store remember me preference
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      toast.success("Welcome back!", { 
        id: loginToast,
        style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
      });
      
      router.push('/account');
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      toast.error(errorMessage, { 
        id: loginToast,
        style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      toast.error('Invalid email format');
      return;
    }

    setSendingReset(true);
    const resetToast = toast.loading('Sending password reset email...');

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      
      toast.success('Password reset email sent! Check your inbox.', { 
        id: resetToast,
        style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
      });
      
      setShowForgotPassword(false);
      setResetEmail('');
      
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      toast.error(errorMessage, { id: resetToast });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white selection:bg-black selection:text-white">
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-black text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black opacity-90"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <Link href="/" className="text-3xl font-black uppercase tracking-tighter">
              Zaqeen
            </Link>
          </div>

          <div className="relative z-10 space-y-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
                Welcome Back
              </h2>
              <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                Sign in to access your account, track your orders, and enjoy exclusive member benefits.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: '✓', text: 'Access your order history' },
                { icon: '✓', text: 'Save items to your wishlist' },
                { icon: '✓', text: 'Fast and secure checkout' },
                { icon: '✓', text: 'Exclusive member offers' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/10 flex items-center justify-center text-xs font-black">
                    {item.icon}
                  </div>
                  <span className="text-sm text-gray-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 text-[9px] uppercase tracking-wide text-gray-500">
            © 2026 Zaqeen. All rights reserved.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="max-w-md w-full">
            
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8">
              <Link href="/" className="text-2xl font-black uppercase tracking-tighter">
                Zaqeen
              </Link>
            </div>

            {!showForgotPassword ? (
              <>
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
                    Sign In
                  </h1>
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">
                    Welcome back to Zaqeen
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                  
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className={`w-full px-4 py-3 bg-white border-2 ${
                        errors.email ? 'border-red-500' : 'border-gray-200'
                      } focus:border-black outline-none transition-all text-sm font-bold lowercase`}
                    />
                    {errors.email && (
                      <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-[9px] font-bold uppercase tracking-wide text-gray-500 hover:text-black transition-colors"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 bg-white border-2 ${
                          errors.password ? 'border-red-500' : 'border-gray-200'
                        } focus:border-black outline-none transition-all text-sm font-bold pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-gray-600 group-hover:text-black">
                        Remember me
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full bg-black text-white py-5 text-[11px] font-black uppercase tracking-wider overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing In...
                        </>
                      ) : (
                        <>
                          Sign In
                          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  </button>
                </form>

                {/* Sign Up Link */}
                <div className="mt-8 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">
                    Don't have an account?{' '}
                    <Link href="/account/signup" className="text-black font-black underline hover:text-gray-600">
                      Sign Up
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Forgot Password Form */}
                <div className="mb-8">
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide text-gray-500 hover:text-black mb-6"
                  >
                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back to Sign In
                  </button>
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
                    Reset Password
                  </h1>
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">
                    Enter your email to receive reset instructions
                  </p>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold lowercase"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingReset}
                    className="w-full bg-black text-white py-5 text-[11px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-3"
                  >
                    {sendingReset ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        Send Reset Link
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Security Note */}
            <div className="mt-8 p-4 bg-green-50 border border-green-200 flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wide text-green-800 mb-1">Secure Login</p>
                <p className="text-[9px] text-green-700 leading-relaxed">
                  Your credentials are encrypted and protected with industry-standard security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}