'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    }

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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase and lowercase letters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation (optional)
    if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
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

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form', {
        style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
      });
      return;
    }

    setLoading(true);
    const signupToast = toast.loading("Creating your account...");

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email.trim(), 
        formData.password
      );
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, {
        displayName: formData.displayName.trim()
      });
      
      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName.trim(),
        email: user.email,
        phone: formData.phone.trim() || '',
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: false,
        profileComplete: false
      });

      toast.success('Account created successfully! Welcome to Zaqeen.', { 
        id: signupToast,
        style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
      });

      // Redirect to account page
      router.push('/account');
      
    } catch (error) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      toast.error(errorMessage, { 
        id: signupToast,
        style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
      });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 1, label: 'Weak', color: 'bg-red-500' },
      { strength: 2, label: 'Fair', color: 'bg-orange-500' },
      { strength: 3, label: 'Good', color: 'bg-yellow-500' },
      { strength: 4, label: 'Strong', color: 'bg-green-500' },
      { strength: 5, label: 'Very Strong', color: 'bg-emerald-500' }
    ];

    return levels[strength - 1] || levels[0];
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
                Join Our Community
              </h2>
              <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                Create your account and unlock exclusive access to premium products, special offers, and a seamless shopping experience.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: '✓', text: 'Exclusive member discounts' },
                { icon: '✓', text: 'Order tracking and history' },
                { icon: '✓', text: 'Wishlist and favorites' },
                { icon: '✓', text: 'Priority customer support' }
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

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
                Create Account
              </h1>
              <p className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">
                Sign up to get started
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignUp} className="space-y-6">
              
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 bg-white border-2 ${
                    errors.displayName ? 'border-red-500' : 'border-gray-200'
                  } focus:border-black outline-none transition-all text-sm font-bold`}
                />
                {errors.displayName && (
                  <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.displayName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Email Address *
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

              {/* Phone (Optional) */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+880 1234-567890"
                  className={`w-full px-4 py-3 bg-white border-2 ${
                    errors.phone ? 'border-red-500' : 'border-gray-200'
                  } focus:border-black outline-none transition-all text-sm font-bold`}
                />
                {errors.phone && (
                  <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Password *
                </label>
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
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div
                          key={level}
                          className={`h-1 flex-1 transition-all ${
                            level <= passwordStrength.strength
                              ? passwordStrength.color
                              : 'bg-gray-200'
                          }`}
                        ></div>
                      ))}
                    </div>
                    <p className={`text-[9px] font-bold ${
                      passwordStrength.strength >= 3 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      Password strength: {passwordStrength.label}
                    </p>
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 bg-white border-2 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                    } focus:border-black outline-none transition-all text-sm font-bold pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  >
                    {showConfirmPassword ? (
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
                {errors.confirmPassword && (
                  <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className={`w-5 h-5 mt-0.5 cursor-pointer ${
                      errors.acceptTerms ? 'border-red-500' : ''
                    }`}
                  />
                  <span className="text-[10px] text-gray-600 leading-relaxed">
                    I agree to the{' '}
                    <Link href="/terms" className="text-black font-bold underline hover:text-gray-600">
                      Terms & Conditions
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-black font-bold underline hover:text-gray-600">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.acceptTerms}
                  </p>
                )}
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">
                Already have an account?{' '}
                <Link href="/login" className="text-black font-black underline hover:text-gray-600">
                  Sign In
                </Link>
              </p>
            </div>

            {/* Security Note */}
            <div className="mt-8 p-4 bg-green-50 border border-green-200 flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wide text-green-800 mb-1">Secure Registration</p>
                <p className="text-[9px] text-green-700 leading-relaxed">
                  Your data is encrypted and protected with industry-standard security protocols.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}