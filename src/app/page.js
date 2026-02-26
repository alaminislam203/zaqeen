'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import Hero from '@/components/Hero';
import NewArrivals from '@/components/NewArrivals';
import Link from 'next/link';
import Image from 'next/image';

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  createdAt?: any;
}

interface Testimonial {
  id: string;
  name: string;
  comment: string;
  rating: number;
}

interface SectionRefs {
  values: React.RefObject<HTMLElement>;
  philosophy: React.RefObject<HTMLElement>;
  social: React.RefObject<HTMLElement>;
  newsletter: React.RefObject<HTMLElement>;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  
  const sectionRefs: SectionRefs = {
    values: useRef<HTMLElement>(null),
    philosophy: useRef<HTMLElement>(null),
    social: useRef<HTMLElement>(null),
    newsletter: useRef<HTMLElement>(null)
  };

  // Memoized brand values
  const brandValues = useMemo(() => [
    { 
      title: "Premium Quality", 
      desc: "Crafted with the finest materials for ultimate durability and comfort.",
      icon: <svg className="w-8 h-8" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
    },
    { 
      title: "Modern Design", 
      desc: "Minimalist aesthetics that make a statement in any setting.",
      icon: <svg className="w-8 h-8" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
    },
    { 
      title: "Sustainable Ethics", 
      desc: "Committed to responsible production and ethical practices.",
      icon: <svg className="w-8 h-8" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    }
  ], []);

  // Memoized Instagram images
  const instagramImages = useMemo(() => [
    {
      url: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1974",
      alt: "Stylish men's fashion"
    },
    {
      url: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1974",
      alt: "Modern streetwear style"
    },
    {
      url: "https://images.unsplash.com/photo-1598033129183-c4f50c717658?q=80&w=1974",
      alt: "Casual wear collection"
    },
    {
      url: "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?q=80&w=2070",
      alt: "Contemporary fashion"
    },
    {
      url: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070",
      alt: "Lifestyle apparel"
    },
    {
      url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070",
      alt: "Urban fashion"
    }
  ], []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    
    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setVisibleSections(prev => ({ ...prev, [key]: true }));
            }
          },
          { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        observer.observe(ref.current);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  // Fetch products
  useEffect(() => {
    let isMounted = true;
    
    try {
      const productsQuery = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc'),
        limit(8)
      );
      
      const unsub = onSnapshot(productsQuery, 
        (snapshot) => {
          if (isMounted) {
            const productsData = snapshot.docs.map(doc => ({ 
              id: doc.id, 
              ...doc.data() 
            })) as Product[];
            setFeaturedProducts(productsData);
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error fetching products:', error);
          if (isMounted) {
            setLoading(false);
          }
        }
      );

      return () => {
        isMounted = false;
        unsub();
      };
    } catch (error) {
      console.error('Error setting up products listener:', error);
      if (isMounted) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch testimonials
  useEffect(() => {
    let isMounted = true;
    
    try {
      const testimonialsQuery = query(
        collection(db, 'testimonials'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const unsub = onSnapshot(testimonialsQuery,
        (snapshot) => {
          if (isMounted) {
            const testimonialsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Testimonial[];
            setTestimonials(testimonialsData);
          }
        },
        (error) => {
          console.error('Error fetching testimonials:', error);
        }
      );

      return () => {
        isMounted = false;
        unsub();
      };
    } catch (error) {
      console.error('Error setting up testimonials listener:', error);
    }
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [testimonials.length]);

  // Newsletter subscription handler
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    setSubscribing(true);
    
    try {
      // Add your newsletter subscription logic here
      // await addDoc(collection(db, 'subscribers'), { email, subscribedAt: new Date() });
      
      alert('Successfully subscribed to newsletter!');
      setEmail('');
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white overflow-x-hidden">
      
      {/* Hero Section */}
      <Hero />

      {/* Brand Values Section */}
      <section 
        ref={sectionRefs.values}
        className="py-20 md:py-32 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(0,0,0,0.02) 40px, rgba(0,0,0,0.02) 80px)`
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
          {/* Section Header */}
          <div className={`text-center mb-20 transition-all duration-1000 ${
            visibleSections.values ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full mb-6 shadow-sm">
              <span className="w-2 h-2 bg-black rounded-full"></span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-black">
                Why Choose Us
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">
              Our Commitment
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built on the foundation of quality, design, and sustainability
            </p>
          </div>

          {/* Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {brandValues.map((item, idx) => (
              <div 
                key={idx} 
                className={`group text-center p-8 bg-white border-2 border-gray-100 rounded-2xl hover:border-black hover:shadow-xl transition-all duration-500 ${
                  visibleSections.values ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${idx * 200}ms` }}
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center text-gray-900 group-hover:bg-black group-hover:text-white transition-all duration-500 group-hover:scale-110">
                  {item.icon}
                </div>
                <h4 className="text-base font-black uppercase tracking-wide mb-4 text-gray-900">
                  {item.title}
                </h4>
                <div className="h-1 w-12 bg-black mx-auto mb-4 group-hover:w-20 transition-all duration-500"></div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <NewArrivals products={featuredProducts} loading={loading} />

      {/* Philosophy/About Section */}
      <section 
        ref={sectionRefs.philosophy}
        className="py-24 md:py-40 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Large text watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] select-none pointer-events-none">
          <h2 className="text-[20vw] font-black uppercase tracking-tighter">
            Zaqeen
          </h2>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Image Side */}
            <div className={`relative transition-all duration-1000 ${
              visibleSections.philosophy ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <div className="relative group">
                {/* Decorative frame */}
                <div className="absolute -inset-8 border-2 border-white/10 translate-x-8 translate-y-8 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-1000 rounded-2xl"></div>
                
                {/* Main image */}
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                  <Image 
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070" 
                    alt="Zaqeen Philosophy" 
                    width={800}
                    height={1000}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[2s]"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                {/* Floating badge */}
                <div className="absolute -bottom-6 -left-6 z-20 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                  <div className="bg-white text-black px-6 py-4 rounded-xl shadow-2xl">
                    <p className="text-xs font-black uppercase tracking-wider">
                      The Curator's Vision
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Side */}
            <div className={`space-y-8 transition-all duration-1000 delay-300 ${
              visibleSections.philosophy ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-white/80 font-bold">
                    Our Story
                  </span>
                </div>
                
                <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-tight">
                  A State of <br/>
                  <span className="bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
                    Certainty
                  </span>
                </h3>
              </div>

              <div className="h-1 w-20 bg-gradient-to-r from-white to-transparent"></div>

              <p className="text-gray-300 leading-relaxed text-base max-w-xl">
                Zaqeen is not just a label; it's an archive of identity. We curate garments 
                that reflect your inner conviction—bold, certain, and unapologetically minimal. 
                Every thread is a blueprint of confidence.
              </p>

              <div className="flex flex-wrap gap-4 pt-6">
                <Link 
                  href="/about" 
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                >
                  Explore Our Story
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>

                <Link 
                  href="/contact" 
                  className="inline-flex items-center gap-3 px-8 py-4 border-2 border-white/30 text-white rounded-xl font-bold hover:bg-white/10 hover:border-white transition-all backdrop-blur-sm"
                >
                  Get in Touch
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                {[
                  { value: '10K+', label: 'Happy Customers' },
                  { value: '500+', label: 'Products' },
                  { value: '99%', label: 'Satisfaction' }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-3xl font-black mb-1">{stat.value}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-12">
              What Our Customers Say
            </h2>
            
            <div className="relative max-w-3xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`transition-all duration-700 ${
                    index === activeTestimonial 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 absolute top-0 left-0 w-full pointer-events-none translate-x-full'
                  }`}
                >
                  <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 text-lg mb-4">{testimonial.comment}</p>
                    <p className="font-bold">{testimonial.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Instagram/Social Proof Section */}
      <section 
        ref={sectionRefs.social}
        className="py-24 md:py-32 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          
          {/* Header */}
          <div className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 transition-all duration-1000 ${
            visibleSections.social ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-full mb-4">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="text-[10px] uppercase tracking-wider text-purple-700 font-bold">
                  Follow Us
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">
                Join Our Community
              </h2>
              <p className="text-gray-600 max-w-xl">
                See how our customers style their favorite pieces
              </p>
            </div>

            <a 
              href="https://instagram.com/zaqeen.bd" 
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-600/30 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @ZaqeenOfficial
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>

          {/* Instagram Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {instagramImages.map((image, i) => (
              <a
                key={i}
                href="https://instagram.com/zaqeen.bd"
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden cursor-pointer transition-all duration-700 hover:scale-105 hover:shadow-2xl ${
                  visibleSections.social ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <Image 
                  src={image.url} 
                  alt={image.alt} 
                  width={400}
                  height={400}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-2">
                  <svg className="w-8 h-8 text-white transform scale-0 group-hover:scale-100 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span className="text-white text-xs font-bold uppercase tracking-wider">
                    View Post
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section 
        ref={sectionRefs.newsletter}
        className="py-24 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)`
          }}></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 text-center relative z-10">
          <div className={`transition-all duration-1000 ${
            visibleSections.newsletter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-6 backdrop-blur-sm">
              <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] uppercase tracking-wider font-bold">
                Newsletter
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
              Subscribe to get exclusive offers, new arrivals, and insider news
            </p>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-400 outline-none focus:border-white transition-all backdrop-blur-sm"
                disabled={subscribing}
                required
              />
              <button
                type="submit"
                disabled={subscribing}
                className="px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribing ? 'Subscribing...' : 'Subscribe'}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-6">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
