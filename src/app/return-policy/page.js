'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ReturnPolicy() {
  const [activeSection, setActiveSection] = useState('overview');

  const policies = [
    {
      title: "৭ দিনের বিনিময় প্রোটোকল",
      titleEn: "7-Day Exchange Protocol",
      desc: "পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে বিনিময়ের সুযোগ রয়েছে। আমাদের প্রতিটি গার্মেন্টস একটি মাস্টারপিস; তাই আমরা আশা করি এটি তার আদি এবং নিখুঁত অবস্থায় আমাদের কাছে ফিরে আসবে।",
      icon: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
      color: 'blue'
    },
    {
      title: "কোয়ালিটি অ্যাসিউরেন্স",
      titleEn: "Quality Assurance",
      desc: "পণ্যের অরিজিনাল ট্যাগ অবশ্যই সংযুক্ত থাকতে হবে। পরনের চিহ্ন, ধোয়া হয়েছে এমন বা পরিবর্তন করা হয়েছে এমন কোনো পণ্য রিটার্ন হিসেবে গ্রহণ করা হবে না।",
      icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
      color: 'green'
    },
    {
      title: "লজিস্টিকস ও শিপিং",
      titleEn: "Logistics & Shipping",
      desc: "ম্যানুফ্যাকচারিং ত্রুটির ক্ষেত্রে আমরা সম্পূর্ণ বিনামূল্যে রিটার্ন গ্রহণ করি। সাইজ পরিবর্তনের ক্ষেত্রে একটি সামান্য লজিস্টিকস ফি প্রযোজ্য হতে পারে।",
      icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
      color: 'purple'
    },
    {
      title: "কনসিয়ার্জ সাপোর্ট",
      titleEn: "Concierge Support",
      desc: "বিনিময় প্রক্রিয়ায় আপনাকে সহায়তার জন্য আমাদের টিম সর্বদা প্রস্তুত। যেকোনো প্রয়োজনে আমাদের কনসিয়ার্জ পোর্টালে যোগাযোগ করুন দ্রুত সমাধানের জন্য।",
      icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
      color: 'amber'
    },
    {
      title: "ভিডিও ডকুমেন্টেশন",
      titleEn: "Video Documentation",
      desc: "পণ্য অবশ্যই ডেলিভারি ম্যানের সামনে চেক করে নিতে হবে এবং আনবক্সিং ভিডিও করে রাখতে হবে। নতুবা রিটার্ন ক্লেইম প্রযোজ্য হবে না।",
      icon: 'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z',
      color: 'red'
    },
    {
      title: "দ্রুত প্রসেসিং",
      titleEn: "Fast Processing",
      desc: "রিটার্ন রিকোয়েস্ট সাবমিট করার ৪৮ ঘণ্টার মধ্যে আমরা আপনার সাথে যোগাযোগ করব এবং পরবর্তী ধাপ সম্পর্কে জানাব।",
      icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
      color: 'indigo'
    }
  ];

  const returnSteps = [
    {
      step: 1,
      title: 'রিটার্ন রিকোয়েস্ট',
      description: 'আমাদের কাস্টমার সাপোর্টে যোগাযোগ করুন বা কন্ট্যাক্ট ফর্ম পূরণ করুন'
    },
    {
      step: 2,
      title: 'অনুমোদন পান',
      description: '২৪-৪৮ ঘণ্টার মধ্যে রিটার্ন অনুমোদন এবং নির্দেশনা পাবেন'
    },
    {
      step: 3,
      title: 'পণ্য প্যাক করুন',
      description: 'মূল প্যাকেজিং এবং ট্যাগ সহ পণ্য সুরক্ষিতভাবে প্যাক করুন'
    },
    {
      step: 4,
      title: 'শিপ করুন',
      description: 'আমাদের দেওয়া ঠিকানায় কুরিয়ার বা পোস্টের মাধ্যমে পাঠান'
    },
    {
      step: 5,
      title: 'রিফান্ড পান',
      description: 'পণ্য যাচাই হওয়ার ৫-৭ কার্যদিবসের মধ্যে রিফান্ড পাবেন'
    }
  ];

  const conditions = [
    {
      title: 'রিটার্নযোগ্য',
      items: [
        'ম্যানুফ্যাকচারিং ডিফেক্ট',
        'ভুল সাইজ বা রং পাঠানো',
        'ক্ষতিগ্রস্ত পণ্য',
        '৭ দিনের মধ্যে অব্যবহৃত পণ্য'
      ],
      color: 'green'
    },
    {
      title: 'রিটার্নযোগ্য নয়',
      items: [
        'সেল বা ডিসকাউন্ট আইটেম',
        'কাস্টমাইজড পণ্য',
        'ব্যবহৃত বা ধোয়া পণ্য',
        'ট্যাগ ছাড়া পণ্য'
      ],
      color: 'red'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'সংক্ষিপ্ত বিবরণ', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
    { id: 'process', label: 'রিটার্ন প্রক্রিয়া', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
    { id: 'conditions', label: 'শর্তাবলী', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white selection:bg-black selection:text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black block mb-4">Client Certainty</span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-4">রিটার্ন ও এক্সচেঞ্জ</h1>
          <p className="text-[11px] uppercase tracking-wide text-gray-500 max-w-2xl mx-auto font-bold leading-relaxed">
            আপনার কেনাকাটার প্রতিটি ধাপে শতভাগ নিশ্চয়তা নিশ্চিত করাই Zaqeen-এর লক্ষ্য
          </p>
          <div className="w-16 h-px bg-black mx-auto mt-8 opacity-20"></div>
        </div>

        {/* Highlight Banner */}
        <div className="mb-12 p-6 md:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">১০০% সন্তুষ্টি গ্যারান্টি</h3>
          </div>
          <p className="text-sm font-bold text-blue-800">
            ৭ দিনের মধ্যে কোনো প্রশ্ন ছাড়াই রিটার্ন বা এক্সচেঞ্জ করুন
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all ${
                  activeSection === tab.id
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* Overview Tab */}
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.map((item, idx) => (
                  <div key={idx} className="bg-white border-2 border-gray-200 p-6 group hover:border-black transition-all">
                    <div className={`w-14 h-14 bg-${item.color}-100 flex items-center justify-center mb-4 group-hover:bg-black transition-all`}>
                      <svg className={`w-7 h-7 text-${item.color}-600 group-hover:text-white transition-all`} fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-wide mb-1">{item.title}</h3>
                    <p className="text-[9px] uppercase tracking-wide text-gray-400 font-bold mb-3">{item.titleEn}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process Tab */}
          {activeSection === 'process' && (
            <div className="space-y-8">
              <div className="bg-white border-2 border-gray-200 p-8">
                <h2 className="text-2xl font-black uppercase tracking-tight mb-8 text-center">রিটার্ন প্রক্রিয়া - ৫টি সহজ ধাপ</h2>
                <div className="space-y-6">
                  {returnSteps.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-6 p-6 bg-gray-50 border-l-4 border-black hover:bg-gray-100 transition-all group">
                      <div className="flex-shrink-0 w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                      <svg className="w-6 h-6 text-gray-300 group-hover:text-black transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Timeline */}
              <div className="bg-gradient-to-br from-gray-900 to-black text-white p-8">
                <h3 className="text-xl font-black uppercase tracking-tight mb-6 text-center">রিফান্ড টাইমলাইন</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-white/10">
                    <p className="text-4xl font-black mb-2">২৪-৪৮</p>
                    <p className="text-sm text-gray-400">ঘণ্টা</p>
                    <p className="text-xs mt-2">রিকোয়েস্ট অনুমোদন</p>
                  </div>
                  <div className="text-center p-6 bg-white/10">
                    <p className="text-4xl font-black mb-2">৩-৫</p>
                    <p className="text-sm text-gray-400">দিন</p>
                    <p className="text-xs mt-2">পণ্য পৌঁছানো</p>
                  </div>
                  <div className="text-center p-6 bg-white/10">
                    <p className="text-4xl font-black mb-2">৫-৭</p>
                    <p className="text-sm text-gray-400">কার্যদিবস</p>
                    <p className="text-xs mt-2">রিফান্ড প্রসেসিং</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conditions Tab */}
          {activeSection === 'conditions' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {conditions.map((condition, idx) => (
                  <div key={idx} className={`bg-${condition.color}-50 border-2 border-${condition.color}-200 p-8`}>
                    <h3 className={`text-xl font-black uppercase tracking-tight mb-6 text-${condition.color}-700`}>
                      {condition.title}
                    </h3>
                    <ul className="space-y-3">
                      {condition.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <svg className={`w-5 h-5 flex-shrink-0 text-${condition.color}-600`} fill="currentColor" viewBox="0 0 20 20">
                            {condition.color === 'green' ? (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            )}
                          </svg>
                          <span className="text-sm font-bold text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Important Notes */}
              <div className="bg-amber-50 border-2 border-amber-200 p-8">
                <div className="flex items-start gap-4">
                  <svg className="w-8 h-8 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-amber-800 mb-3">গুরুত্বপূর্ণ নোট</h3>
                    <ul className="space-y-2 text-sm text-amber-700">
                      <li>• পণ্য ডেলিভারির সময় অবশ্যই ভিডিও করতে হবে</li>
                      <li>• সব ট্যাগ এবং লেবেল অক্ষত রাখতে হবে</li>
                      <li>• রিটার্ন শিপিং খরচ কাস্টমার বহন করবেন (ডিফেক্ট ব্যতীত)</li>
                      <li>• এক্সচেঞ্জের ক্ষেত্রে স্টক সাপেক্ষে</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Refund Methods */}
              <div className="bg-white border-2 border-gray-200 p-8">
                <h3 className="text-xl font-black uppercase tracking-tight mb-6">রিফান্ড মেথড</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { name: 'bKash', time: '২৪ ঘণ্টা', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' },
                    { name: 'Nagad', time: '২৤ ঘণ্টা', icon: 'M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3' },
                    { name: 'ব্যাংক', time: '৫-৭ দিন', icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z' }
                  ].map((method, idx) => (
                    <div key={idx} className="p-6 bg-gray-50 border border-gray-200 text-center hover:border-black transition-all">
                      <svg className="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={method.icon} />
                      </svg>
                      <p className="font-black text-sm uppercase mb-1">{method.name}</p>
                      <p className="text-xs text-gray-500">{method.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center py-12 bg-white border-2 border-gray-200">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">রিটার্ন শুরু করতে চান?</h3>
          <p className="text-sm text-gray-600 mb-8 max-w-2xl mx-auto">
            আমাদের কাস্টমার সাপোর্ট টিম আপনাকে সাহায্য করতে প্রস্তুত। নিচের বাটনে ক্লিক করে রিটার্ন প্রক্রিয়া শুরু করুন।
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-black text-white text-[11px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              রিটার্ন রিকোয়েস্ট করুন
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-black border-2 border-black text-[11px] font-black uppercase tracking-wider hover:bg-black hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              সাপোর্টে যোগাযোগ
            </Link>
          </div>
        </div>

        {/* Footer Badge */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 opacity-30">
            <div className="h-px w-12 bg-black"></div>
            <p className="text-[9px] uppercase tracking-wider font-black">Zaqeen Return Policy v2.0</p>
            <div className="h-px w-12 bg-black"></div>
          </div>
          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wide">
            Your Satisfaction is Our Priority
          </p>
        </div>
      </div>
    </main>
  );
}
