'use client';
import { useState } from 'react';
import Link from 'next/link';

const HowToBuyPage = () => {
  const [activeStep, setActiveStep] = useState(null);

  const steps = [
    {
      id: "01",
      title: "Browse Our Collection",
      titleBn: "আর্কাইভ অন্বেষণ করুন",
      icon: (
        <svg className="w-8 h-8" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      ),
      desc: "Explore our curated collections. Each product represents our commitment to timeless style and quality. Click on any item to view detailed specifications.",
      descBn: "আমাদের কিউরেটেড কালেকশনগুলো ঘুরে দেখুন। প্রতিটি পণ্য আমাদের দীর্ঘস্থায়ী স্টাইল এবং নির্দিষ্ট রুচির পরিচায়ক। বিস্তারিত দেখতে পণ্যে ক্লিক করুন।",
      tips: [
        "Use filters to narrow down your search",
        "Save items to your wishlist",
        "Check product reviews and ratings"
      ]
    },
    {
      id: "02",
      title: "Add to Cart",
      titleBn: "পোর্টফোলিও সাজান",
      icon: (
        <svg className="w-8 h-8" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      desc: "Select your desired size and color. Click 'Add to Cart' to add the item to your bag. Continue shopping or proceed to checkout.",
      descBn: "আপনার কাঙ্ক্ষিত সাইজ এবং রঙ নির্বাচন করুন। 'Add to Cart' বাটনে ক্লিক করুন। আরও কেনাকাটা করুন অথবা চেকআউটে যান।",
      tips: [
        "Select the correct size using our size guide",
        "Add multiple items for better offers",
        "Review cart before checkout"
      ]
    },
    {
      id: "03",
      title: "Review Your Order",
      titleBn: "সিলেকশন অডিট করুন",
      icon: (
        <svg className="w-8 h-8" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      desc: "Review your cart items. Adjust quantities or remove items as needed. Apply coupon codes for discounts before finalizing.",
      descBn: "আপনার কার্ট আইটেম পর্যালোচনা করুন। পরিমাণ সামঞ্জস্য করুন বা প্রয়োজনে আইটেম সরান। চূড়ান্ত করার আগে কুপন কোড প্রয়োগ করুন।",
      tips: [
        "Check for available coupon codes",
        "Review total amount including shipping",
        "Verify product details once more"
      ]
    },
    {
      id: "04",
      title: "Secure Checkout",
      titleBn: "সিকিউর আইডেন্টিটি পোর্টাল",
      icon: (
        <svg className="w-8 h-8" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      desc: "Enter your delivery address and contact information. Our encrypted checkout ensures your personal data is completely secure.",
      descBn: "আপনার ডেলিভারি ঠিকানা এবং যোগাযোগের তথ্য প্রদান করুন। আমাদের এনক্রিপ্টেড চেকআউট আপনার তথ্যের সম্পূর্ণ নিরাপত্তা নিশ্চিত করে।",
      tips: [
        "Double-check delivery address",
        "Save address for future orders",
        "Provide accurate contact number"
      ]
    },
    {
      id: "05",
      title: "Payment & Delivery",
      titleBn: "অ্যাকুইজিশন ও লজিস্টিকস",
      icon: (
        <svg className="w-8 h-8" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      desc: "Complete your payment through our secure channels. Receive a digital invoice and tracking ID to monitor your order's journey.",
      descBn: "আমাদের সুরক্ষিত পেমেন্ট চ্যানেলের মাধ্যমে লেনদেন সম্পন্ন করুন। ডিজিটাল ইনভয়েস এবং ট্র্যাকিং আইডি পান।",
      tips: [
        "Choose from multiple payment methods",
        "Save payment details securely",
        "Track your order in real-time"
      ]
    }
  ];

  const faqs = [
    {
      question: "How long does delivery take?",
      answer: "Inside Dhaka: 1-2 business days. Outside Dhaka: 3-5 business days."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept bKash, Nagad, Rocket, Cash on Delivery, and all major credit/debit cards."
    },
    {
      question: "Can I track my order?",
      answer: "Yes! After placing your order, you'll receive a tracking ID via email and SMS to monitor your delivery."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 7-day return policy for unused items with original tags and packaging."
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 selection:bg-black selection:text-white">
      
      {/* Hero Section */}
      <div className="relative bg-black text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black opacity-90"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black block mb-6">
            Shopping Guide
          </span>
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-6">
            How to Buy
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Follow our simple 5-step process to complete your purchase and enjoy a seamless shopping experience with Zaqeen.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20">
        
        {/* Steps Section */}
        <div className="space-y-20">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`group relative ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
            >
              <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
                
                {/* Step Number & Icon */}
                <div className="relative shrink-0">
                  <div className="text-[100px] md:text-[140px] font-black text-gray-100 leading-none select-none">
                    {step.id}
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white border-2 border-gray-200 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-lg">
                    {step.icon}
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-8 space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
                      {step.titleBn}
                    </p>
                  </div>

                  <div className="w-16 h-1 bg-black"></div>

                  <p className="text-sm leading-relaxed text-gray-700">
                    {step.desc}
                  </p>

                  <p className="text-sm leading-relaxed text-gray-500 italic">
                    {step.descBn}
                  </p>

                  {/* Tips Expandable */}
                  <button
                    onClick={() => setActiveStep(activeStep === idx ? null : idx)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-gray-600 hover:text-black transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${activeStep === idx ? 'rotate-180' : ''}`}
                      fill="none"
                      strokeWidth="2"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                    {activeStep === idx ? 'Hide Tips' : 'Show Tips'}
                  </button>

                  {activeStep === idx && (
                    <div className="mt-4 p-6 bg-gray-50 border border-gray-200 space-y-3 animate-fadeIn">
                      <p className="text-[9px] font-black uppercase tracking-wide text-gray-600 mb-4">
                        Helpful Tips:
                      </p>
                      <ul className="space-y-2">
                        {step.tips.map((tip, tipIdx) => (
                          <li key={tipIdx} className="flex items-start gap-3 text-[11px] text-gray-700">
                            <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Visual Timeline */}
        <div className="mt-20 p-8 bg-white border border-gray-200 shadow-lg">
          <h3 className="text-[11px] font-black uppercase tracking-wide text-gray-600 mb-8 text-center">
            Your Shopping Journey
          </h3>
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center gap-2 min-w-[80px]">
                  <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-sm">
                    {step.id}
                  </div>
                  <p className="text-[8px] uppercase tracking-wide text-gray-600 font-bold text-center">
                    {step.title.split(' ')[0]}
                  </p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-12 h-0.5 bg-gray-200 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FAQs Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black block mb-3">
              Common Questions
            </span>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-6 bg-white border border-gray-200 hover:border-black transition-all">
                <h4 className="text-[11px] font-black uppercase tracking-wide mb-3">
                  {faq.question}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center space-y-8 p-12 bg-gradient-to-br from-gray-50 to-white border border-gray-200">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.5em] font-black text-gray-400">
              Ready to Shop?
            </p>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              Start Your Journey
            </h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="group relative px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-wider overflow-hidden transition-all hover:shadow-2xl"
            >
              <span className="relative z-10 flex items-center gap-3">
                Browse Collection
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </Link>

            <Link
              href="/contact"
              className="px-12 py-5 bg-white border-2 border-black text-black text-[10px] font-black uppercase tracking-wider hover:bg-black hover:text-white transition-all"
            >
              Contact Support
            </Link>
          </div>
        </div>

        {/* Need Help Section */}
        <div className="mt-20 p-8 bg-blue-50 border border-blue-200 flex items-start gap-4">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-blue-800 mb-2">
              Need Assistance?
            </p>
            <p className="text-sm text-blue-700 leading-relaxed">
              Our customer support team is available 24/7 to help you with any questions about the ordering process. Contact us via email, phone, or live chat.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default HowToBuyPage;