'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('story');

  const stats = [
    {
      number: '10K+',
      label: 'সন্তুষ্ট গ্রাহক',
      labelEn: 'Happy Customers',
      icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
    },
    {
      number: '5K+',
      label: 'পণ্য বিক্রিত',
      labelEn: 'Products Sold',
      icon: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z'
    },
    {
      number: '64',
      label: 'জেলায় ডেলিভারি',
      labelEn: 'Districts Covered',
      icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'
    },
    {
      number: '99%',
      label: 'রিটেনশন রেট',
      labelEn: 'Retention Rate',
      icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z'
    }
  ];

  const values = [
    {
      title: 'কোয়ালিটি ফার্স্ট',
      titleEn: 'Quality First',
      description: 'প্রতিটি পণ্য কঠোর মান নিয়ন্ত্রণের মধ্য দিয়ে যায়। আমরা শুধুমাত্র সেরা মানের পণ্য আমাদের গ্রাহকদের কাছে পৌঁছে দিই।',
      icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
      color: 'blue'
    },
    {
      title: 'কাস্টমার স্যাটিসফ্যাকশন',
      titleEn: 'Customer Satisfaction',
      description: 'আমাদের গ্রাহকদের সন্তুষ্টিই আমাদের প্রথম অগ্রাধিকার। ২৪/৭ কাস্টমার সাপোর্ট এবং দ্রুত সমাধান নিশ্চিত করি।',
      icon: 'M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z',
      color: 'green'
    },
    {
      title: 'ট্রান্সপারেন্সি',
      titleEn: 'Transparency',
      description: 'প্রতিটি পণ্যের মূল্য, উৎস এবং গুণমান সম্পর্কে স্বচ্ছ তথ্য প্রদান করি। কোনো লুকানো চার্জ নেই।',
      icon: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      color: 'purple'
    },
    {
      title: 'ইনোভেশন',
      titleEn: 'Innovation',
      description: 'সর্বশেষ ট্রেন্ড এবং টেকনোলজি ব্যবহার করে আমরা ক্রমাগত উন্নতি করছি এবং নতুন কালেকশন যুক্ত করছি।',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      color: 'amber'
    },
    {
      title: 'সাস্টেইনেবিলিটি',
      titleEn: 'Sustainability',
      description: 'পরিবেশ বান্ধব প্যাকেজিং এবং দায়িত্বশীল সোর্সিং আমাদের অগ্রাধিকার। ভবিষ্যৎ প্রজন্মের জন্য পৃথিবী রক্ষা করি।',
      icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
      color: 'emerald'
    },
    {
      title: 'দ্রুত ডেলিভারি',
      titleEn: 'Fast Delivery',
      description: 'দেশের যেকোনো প্রান্তে দ্রুততম সময়ে পণ্য পৌঁছে দিই। ঢাকায় ২৪-৪৮ ঘণ্টা এবং বাইরে ৩-৫ দিন।',
      icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
      color: 'red'
    }
  ];

  const team = [
    {
      name: 'Abdullah Al Zaqeen',
      role: 'Founder & CEO',
      description: 'ই-কমার্স ইন্ডাস্ট্রিতে ১০+ বছরের অভিজ্ঞতা',
      image: '/team/ceo.jpg',
      social: { linkedin: '#', twitter: '#' }
    },
    {
      name: 'Fatima Rahman',
      role: 'Head of Design',
      description: 'ফ্যাশন ডিজাইনে বিশেষজ্ঞ',
      image: '/team/designer.jpg',
      social: { linkedin: '#', instagram: '#' }
    },
    {
      name: 'Karim Ahmed',
      role: 'Operations Manager',
      description: 'লজিস্টিকস এবং সাপ্লাই চেইন এক্সপার্ট',
      image: '/team/operations.jpg',
      social: { linkedin: '#', twitter: '#' }
    },
    {
      name: 'Nusrat Jahan',
      role: 'Customer Success Lead',
      description: 'কাস্টমার সার্ভিসে ৫+ বছরের অভিজ্ঞতা',
      image: '/team/customer.jpg',
      social: { linkedin: '#', facebook: '#' }
    }
  ];

  const timeline = [
    {
      year: '২০২০',
      title: 'যাত্রা শুরু',
      description: 'একটি ছোট স্টার্টআপ হিসেবে Zaqeen-এর যাত্রা শুরু হয়। প্রথম ১০০ অর্ডার ডেলিভারি।',
      icon: 'M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z'
    },
    {
      year: '২০২১',
      title: 'দ্রুত বৃদ্ধি',
      description: '১,০০০+ গ্রাহক এবং ৫০+ পণ্য কালেকশন যুক্ত। নতুন অফিস স্থাপন।',
      icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941'
    },
    {
      year: '২০২২',
      title: 'সম্প্রসারণ',
      description: 'দেশব্যাপী ডেলিভারি নেটওয়ার্ক স্থাপন। ৫,০০০+ পণ্য বিক্রিত।',
      icon: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z'
    },
    {
      year: '২০২৩',
      title: 'পুরস্কার',
      description: 'বেস্ট ই-কমার্স স্টার্টআপ পুরস্কার প্রাপ্তি। ১০,০০০+ সন্তুষ্ট গ্রাহক।',
      icon: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0'
    },
    {
      year: '২০২৪',
      title: 'নতুন উচ্চতা',
      description: 'প্রিমিয়াম কালেকশন লঞ্চ। আন্তর্জাতিক শিপিং পরিকল্পনা।',
      icon: 'M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z'
    }
  ];

  const tabs = [
    { id: 'story', label: 'আমাদের গল্প', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
    { id: 'values', label: 'আমাদের মূল্যবোধ', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
    { id: 'team', label: 'আমাদের টিম', icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white selection:bg-black selection:text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        
        {/* Hero Section */}
        <div className="text-center mb-20">
          <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black block mb-4">About Zaqeen</span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-6">আমাদের সম্পর্কে</h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Zaqeen একটি আধুনিক ই-কমার্স প্ল্যাটফর্ম যা গুণমান, স্টাইল এবং সাশ্রয়ী মূল্যের নিখুঁত সমন্বয়ে বাংলাদেশের ফ্যাশন ইন্ডাস্ট্রিতে নতুন মাত্রা যোগ করছে।
          </p>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-black to-transparent mx-auto mt-10"></div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white border-2 border-gray-200 p-6 md:p-8 text-center group hover:border-black transition-all">
              <svg className="w-10 h-10 mx-auto mb-4 text-gray-300 group-hover:text-black transition-colors" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
              </svg>
              <p className="text-3xl md:text-4xl font-black mb-2">{stat.number}</p>
              <p className="text-sm font-black uppercase tracking-wide">{stat.label}</p>
              <p className="text-[9px] uppercase tracking-wide text-gray-400 font-bold mt-1">{stat.labelEn}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-10 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all ${
                  activeTab === tab.id
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
          
          {/* Story Tab */}
          {activeTab === 'story' && (
            <div className="space-y-16">
              {/* Mission & Vision */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-black to-neutral-900 text-white p-10">
                  <svg className="w-12 h-12 mb-6 opacity-50" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  </svg>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4">আমাদের মিশন</h3>
                  <p className="text-sm leading-relaxed text-gray-300">
                    প্রতিটি বাংলাদেশী মানুষের কাছে সাশ্রয়ী মূল্যে উন্নতমানের ফ্যাশন পণ্য পৌঁছে দেওয়া এবং তাদের জীবনযাত্রার মান উন্নত করা। আমরা বিশ্বাস করি যে স্টাইল এবং কোয়ালিটি সবার জন্য সহজলভ্য হওয়া উচিত।
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-200 p-10">
                  <svg className="w-12 h-12 mb-6 text-gray-300" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4">আমাদের ভিশন</h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    বাংলাদেশের সবচেয়ে বিশ্বস্ত এবং জনপ্রিয় ফ্যাশন ই-কমার্স ব্র্যান্ড হয়ে ওঠা। আমরা স্বপ্ন দেখি এমন একটি ভবিষ্যৎ যেখানে প্রতিটি মানুষ তাদের পছন্দের স্টাইল এবং পণ্য সহজেই খুঁজে পায়।
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white border-2 border-gray-200 p-10">
                <h2 className="text-3xl font-black uppercase tracking-tight mb-10 text-center">আমাদের যাত্রা</h2>
                <div className="space-y-8">
                  {timeline.map((item, idx) => (
                    <div key={idx} className="flex gap-6 items-start group">
                      <div className="flex-shrink-0 w-20 pt-1">
                        <div className="text-2xl font-black">{item.year}</div>
                      </div>
                      <div className="flex-shrink-0 pt-2">
                        <div className="w-12 h-12 bg-black text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 pt-2">
                        <h3 className="text-xl font-black uppercase tracking-tight mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Values Tab */}
          {activeTab === 'values' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, idx) => (
                <div key={idx} className="bg-white border-2 border-gray-200 p-8 group hover:border-black transition-all">
                  <div className={`w-14 h-14 bg-${value.color}-100 flex items-center justify-center mb-6 group-hover:bg-black transition-all`}>
                    <svg className={`w-7 h-7 text-${value.color}-600 group-hover:text-white transition-all`} fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={value.icon} />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-2">{value.title}</h3>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-4">{value.titleEn}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black uppercase tracking-tight mb-4">আমাদের টিম সদস্যরা</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  একটি প্যাশনেট এবং ডেডিকেটেড টিম যারা Zaqeen-কে সফল করতে প্রতিদিন কাজ করে যাচ্ছে
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {team.map((member, idx) => (
                  <div key={idx} className="bg-white border-2 border-gray-200 overflow-hidden group hover:border-black transition-all">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <svg className="w-24 h-24 text-gray-300" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-black uppercase tracking-tight mb-1">{member.name}</h3>
                      <p className="text-sm font-bold text-gray-600 mb-3">{member.role}</p>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">{member.description}</p>
                      <div className="flex gap-2">
                        {Object.entries(member.social).map(([platform, link]) => (
                            <a
                                key={platform}
                                href={link}
                                className="w-8 h-8 bg-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all"
                            >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              {platform === 'linkedin' && <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>}
                              {platform === 'twitter' && <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>}
                              {platform === 'facebook' && <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>}
                              {platform === 'instagram' && <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.666.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>}
                            </svg>
                            </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center py-16 bg-gradient-to-br from-black to-neutral-900 text-white">
          <h3 className="text-3xl font-black uppercase tracking-tight mb-4">আমাদের সাথে যুক্ত হন</h3>
          <p className="text-sm text-gray-400 mb-8 max-w-2xl mx-auto">
            Zaqeen পরিবারের অংশ হয়ে সর্বশেষ কালেকশন এবং এক্সক্লুসিভ অফার পান
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/shop"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-black text-[11px] font-black uppercase tracking-wider hover:bg-gray-100 transition-all"
            >
              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              শপিং শুরু করুন
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-transparent text-white border-2 border-white text-[11px] font-black uppercase tracking-wider hover:bg-white hover:text-black transition-all"
            >
              <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              যোগাযোগ করুন
            </Link>
          </div>
        </div>

        {/* Footer Badge */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 opacity-30">
            <div className="h-px w-12 bg-black"></div>
            <p className="text-[9px] uppercase tracking-wider font-black">Zaqeen — Since 2020</p>
            <div className="h-px w-12 bg-black"></div>
          </div>
          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wide">
            Building the Future of Fashion in Bangladesh
          </p>
        </div>
      </div>
    </main>
  );
}
