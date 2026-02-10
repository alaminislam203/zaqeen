'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const [countdown, setCountdown] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const quickLinks = [
    {
      title: 'শপিং',
      description: 'সব পণ্য দেখুন',
      icon: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
      link: '/shop',
      color: 'blue'
    },
    {
      title: 'ট্র্যাক অর্ডার',
      description: 'আপনার অর্ডার খুঁজুন',
      icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
      link: '/track-order',
      color: 'green'
    },
    {
      title: 'যোগাযোগ',
      description: 'সাহায্য প্রয়োজন?',
      icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
      link: '/contact',
      color: 'purple'
    },
    {
      title: 'আমাদের সম্পর্কে',
      description: 'Zaqeen জানুন',
      icon: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
      link: '/about',
      color: 'amber'
    }
  ];

  const popularPages = [
    { name: 'নতুন কালেকশন', link: '/shop?sort=newest' },
    { name: 'বেস্ট সেলার', link: '/shop?sort=popular' },
    { name: 'শিপিং তথ্য', link: '/shipping-info' },
    { name: 'রিটার্ন পলিসি', link: '/return-policy' },
    { name: 'প্রাইভেসি পলিসি', link: '/privacy-policy' },
    { name: 'টার্মস অফ সার্ভিস', link: '/terms' }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white selection:bg-black selection:text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        
        {/* Large 404 Background */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.03] z-0">
          <h1 className="text-[40vw] font-black">404</h1>
        </div>

        {/* Content */}
        <div className="relative z-10">
          
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <span className="text-[10px] uppercase tracking-[0.6em] text-red-600 font-black">Error 404</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-6">
              পেজ পাওয়া যায়নি
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-4">
              দুঃখিত! আপনি যে পেজটি খুঁজছেন সেটি সরানো হয়েছে অথবা আর বিদ্যমান নেই।
            </p>

            <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>হোমপেজে রিডাইরেক্ট করা হচ্ছে {countdown} সেকেন্ডে...</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-16">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পণ্য খুঁজুন..."
                className="w-full px-6 py-5 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-lg font-bold pr-16"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black text-white flex items-center justify-center hover:bg-neutral-800 transition-all"
              >
                <svg className="w-6 h-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-3 text-center">
              আপনি যা খুঁজছেন তা এখানে সার্চ করুন
            </p>
          </div>

          {/* Quick Links Grid */}
          <div className="mb-16">
            <h2 className="text-2xl font-black uppercase tracking-tight text-center mb-8">দ্রুত লিঙ্ক</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickLinks.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.link}
                  className="bg-white border-2 border-gray-200 p-8 hover:border-black transition-all group"
                >
                  <div className={`w-14 h-14 bg-${item.color}-100 flex items-center justify-center mb-4 group-hover:bg-black transition-all`}>
                    <svg className={`w-7 h-7 text-${item.color}-600 group-hover:text-white transition-all`} fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>দেখুন</span>
                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Pages */}
          <div className="mb-16">
            <h2 className="text-2xl font-black uppercase tracking-tight text-center mb-8">জনপ্রিয় পেজসমূহ</h2>
            <div className="bg-white border-2 border-gray-200 p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {popularPages.map((page, idx) => (
                  <Link
                    key={idx}
                    href={page.link}
                    className="flex items-center gap-2 p-4 hover:bg-gray-50 transition-all group"
                  >
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    <span className="text-sm font-bold">{page.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/"
              className="group relative w-full sm:w-auto px-12 py-5 bg-black text-white text-[11px] font-black uppercase tracking-wider overflow-hidden transition-all shadow-lg"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                হোমপেজে যান
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </Link>

            <Link
              href="/shop"
              className="w-full sm:w-auto px-12 py-5 bg-white text-black border-2 border-black text-[11px] font-black uppercase tracking-wider hover:bg-black hover:text-white transition-all"
            >
              শপিং করুন
            </Link>

            <Link
              href="/contact"
              className="w-full sm:w-auto px-12 py-5 bg-white text-black border-2 border-gray-200 text-[11px] font-black uppercase tracking-wider hover:border-black transition-all"
            >
              যোগাযোগ করুন
            </Link>
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-br from-black to-neutral-900 text-white p-10 text-center">
            <svg className="w-16 h-16 mx-auto mb-6 opacity-50" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-3">সাহায্য প্রয়োজন?</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
              আপনি যদি কোনো সমস্যার সম্মুখীন হন, আমাদের সাপোর্ট টিম সর্বদা সাহায্য করতে প্রস্তুত
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black text-[10px] font-black uppercase tracking-wider hover:bg-gray-100 transition-all"
              >
                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                ইমেইল করুন
              </Link>
              
                href="tel:+8801234567890"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white border-2 border-white text-[10px] font-black uppercase tracking-wider hover:bg-white hover:text-black transition-all"
              >
                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                কল করুন
              </a>
            </div>
          </div>

          {/* Footer Badge */}
          <div className="mt-16 flex flex-col items-center gap-4 opacity-30">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-black"></div>
              <p className="text-[9px] uppercase tracking-wider font-black">Error 404 • Page Not Found</p>
              <div className="h-px w-12 bg-black"></div>
            </div>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wide">
              Zaqeen Digital Experience v2.0
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
