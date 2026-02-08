'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredSocial, setHoveredSocial] = useState(null);
  const [settings, setSettings] = useState({
    socialLinks: {},
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    businessHours: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'site_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Newsletter subscription handler
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address', {
        style: {
          borderRadius: '0px',
          background: '#000',
          color: '#fff',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'newsletter'), {
        email: email.toLowerCase(),
        subscribedAt: serverTimestamp(),
        source: 'footer',
        status: 'active'
      });

      toast.success('Welcome to the collective', {
        style: {
          borderRadius: '0px',
          background: '#000',
          color: '#fff',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        },
        duration: 4000
      });

      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Subscription failed. Please try again.', {
        style: {
          borderRadius: '0px',
          background: '#000',
          color: '#fff',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  const quickLinks = {
    archive: [
      { href: '/shop', label: 'The Shop', isNew: false },
      { href: '/shop?category=new', label: 'New Arrivals', isNew: true },
      { href: '/shop?category=best', label: 'Masterpieces', isNew: false },
      { href: '/about', label: 'Philosophy', isNew: false },
    ],
    concierge: [
      { href: '/shipping-info', label: 'Logistics', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m0 0v10l8 4m0-14L4 7"></path></svg> },
      { href: '/return-policy', label: 'Policy', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3"></path></svg> },
      { href: '/track-order', label: 'Trace Journey', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> },
      { href: '/how-to-buy', label: 'Manual', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v11.494m-5.247-8.995a4.5 4.5 0 119.494 0 4.5 4.5 0 01-9.494 0z"></path></svg> },
      { href: '/contact', label: 'Contact', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> },
    ]
  };

  const socialLinks = [
    {
      name: 'Instagram',
      href: settings.socialLinks?.instagram || 'https://instagram.com/zaqeen',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
      color: 'hover:text-pink-600'
    },
    {
      name: 'Facebook',
      href: settings.socialLinks?.facebook || 'https://facebook.com/zaqeen',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
      color: 'hover:text-blue-600'
    },
    {
      name: 'Pinterest',
      href: settings.socialLinks?.pinterest || 'https://pinterest.com/zaqeen',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>,
      color: 'hover:text-red-600'
    },
  ].filter(link => link.href && link.href.trim() !== '');

  const paymentMethods = [
    {
      name: 'bKash',
      logo: (
        <div className="h-7 px-3 rounded-md bg-white border border-gray-200 flex items-center">
          <Image src="/logos/bkash.png" alt="bKash" width={72} height={32} className="h-6 w-auto" />
        </div>
      )
    },
    {
      name: 'Nagad',
      logo: (
        <div className="h-7 px-3 rounded-md bg-white border border-gray-200 flex items-center">
          <Image src="/logos/nagad.png" alt="Nagad" width={72} height={32} className="h-6 w-auto" />
        </div>
      )
    },
    {
      name: 'Cash on Delivery',
      logo: (
        <div className="h-7 px-3 rounded-md bg-white border border-gray-200 flex items-center">
          <Image src="/logos/cod.png" alt="Cash on Delivery" width={72} height={32} className="h-6 w-auto" />
        </div>
      )
    }
  ];

  return (
    <footer className="bg-gradient-to-b from-white via-gray-50 to-white border-t border-gray-100 relative overflow-hidden selection:bg-black selection:text-white">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(0,0,0,0.02) 30px, rgba(0,0,0,0.02) 60px)`
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative">
        
        {/* Main Content */}
        <div className="pt-20 pb-12">
          
          {/* Top Section - Newsletter CTA */}
          <div className="mb-20 pb-16 border-b border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Brand Statement */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-600">
                    Exclusive Access
                  </span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                  Join the <span className="italic">Collective</span>
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-md">
                  Be the first to discover limited collections, exclusive drops, and insider insights. Curated experiences delivered to your inbox.
                </p>
                
                {/* Trust indicators */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>No spam, ever</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Unsubscribe anytime</span>
                  </div>
                </div>
              </div>

              {/* Right - Newsletter Form */}
              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                <div className="relative group">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="YOUR EMAIL ADDRESS" 
                    className="w-full px-6 py-4 bg-white border-2 border-gray-200 focus:border-black outline-none text-xs font-bold tracking-[0.15em] uppercase placeholder:text-gray-300 transition-all duration-300 rounded-sm"
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl"></div>
                </div>
                
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-4 bg-black text-white text-xs font-black tracking-[0.2em] uppercase hover:bg-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group rounded-sm"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Subscribe Now
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            {/* Brand Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-[0.4em] uppercase leading-none group cursor-default">
                  <span className="inline-block transition-all duration-300 hover:tracking-[0.5em]">
                    ZAQEEN
                  </span>
                </h2>
                <div className="h-[2px] w-20 bg-gradient-to-r from-black to-transparent"></div>
              </div>
              
              <p className="text-[11px] text-gray-600 leading-relaxed tracking-wide max-w-xs font-medium">
                Curating confidence through minimalist aesthetics and premium craftsmanship. 
                <span className="block mt-2 italic text-gray-500">A testament to boutique lifestyle.</span>
              </p>

              {/* Social Links */}
              <div className="pt-4">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">
                  Connect With Us
                </p>
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={() => setHoveredSocial(social.name)}
                      onMouseLeave={() => setHoveredSocial(null)}
                      className={`relative w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-black text-gray-600 transition-all duration-300 group rounded-sm ${
                        hoveredSocial === social.name ? social.color : 'hover:text-white'
                      }`}
                      title={social.name}
                    >
                      {social.icon}
                      <span className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Archive Column */}
            <div className="lg:col-span-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-black flex items-center gap-2">
                <span className="w-4 h-[2px] bg-black"></span>
                Archive
              </h4>
              <ul className="space-y-3">
                {quickLinks.archive.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href}
                      className="group flex items-center gap-2 text-[10px] text-gray-600 hover:text-black uppercase tracking-[0.2em] font-bold transition-all"
                    >
                      <span className="w-0 group-hover:w-3 h-[1px] bg-black transition-all duration-300"></span>
                      {link.label}
                      {link.isNew && (
                        <span className="text-[7px] bg-black text-white px-1.5 py-0.5 rounded-sm font-black">
                          NEW
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Concierge Column */}
            <div className="lg:col-span-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-black flex items-center gap-2">
                <span className="w-4 h-[2px] bg-black"></span>
                Concierge
              </h4>
              <ul className="space-y-3">
                {quickLinks.concierge.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href}
                      className="group flex items-center gap-3 text-xs text-gray-600 hover:text-black uppercase tracking-[0.2em] font-bold transition-all"
                    >
                      <span className="text-base opacity-50 group-hover:opacity-100 transition-opacity">
                        {link.icon}
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Column */}
            <div className="lg:col-span-3 space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black flex items-center gap-2">
                <span className="w-4 h-[2px] bg-black"></span>
                Contact
              </h4>
              
              <div className="space-y-4 text-[10px] text-gray-600">
                <div className="flex items-start gap-3 group">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 group-hover:text-black transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${settings.contactEmail || 'hello@zaqeen.com'}`} className="hover:text-black transition-colors font-medium">
                    {settings.contactEmail || 'hello@zaqeen.com'}
                  </a>
                </div>

                <div className="flex items-start gap-3 group">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 group-hover:text-black transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-medium">{settings.contactPhone || '+880 1234-567890'}</span>
                </div>

                <div className="flex items-start gap-3 group">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 group-hover:text-black transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium leading-relaxed">
                    {settings.contactAddress || 'Dhaka, Bangladesh'}
                  </span>
                </div>
              </div>

              {/* Business Hours */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">
                  Support Hours
                </p>
                <p className="text-[10px] text-gray-600 font-medium">
                  Mon - Sat: 8:00 AM - 8:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-8 border-t border-gray-100">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            
            {/* Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-[9px] text-gray-500 uppercase tracking-[0.3em] font-bold">
              <p>
                &copy; {currentYear} Zaqeen Ventures
              </p>
              <span className="hidden sm:block">•</span>
              <div className="flex items-center gap-4">
                <Link href="/privacy-policy" className="hover:text-black transition-colors">
                  Privacy
                </Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-black transition-colors">
                  Terms
                </Link>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col items-center lg:items-end gap-3">
              <span className="text-[8px] font-black tracking-[0.3em] uppercase text-gray-400">
                Secure Payments
              </span>
              <div className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all duration-500">
                {paymentMethods.map((method, index) => (
                  <div 
                    key={index}
                    className="hover:scale-110 transition-transform duration-300"
                    title={method.name}
                  >
                    {method.logo}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Bottom Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-black to-transparent opacity-10"></div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-xl shadow-black/20 group z-40"
        aria-label="Back to top"
      >
        <svg className="w-5 h-5 group-hover:-translate-y-1 transition-transform" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </footer>
  );
};

export default Footer;
