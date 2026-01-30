'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase'; // সরাসরি auth ব্যবহার করা নিরাপদ হতে পারে
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { HiStar, HiOutlineUserCircle, HiBadgeCheck } from 'react-icons/hi';
import { RiDoubleQuotesL } from 'react-icons/ri';

// --- স্টার রেটিং কম্পোনেন্ট (Artistic Style) ---
const StarRating = ({ rating, setRating }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex items-center gap-2">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <HiStar 
                        key={starValue}
                        className={`w-7 h-7 cursor-pointer transition-all duration-500 ${
                            starValue <= (hover || rating) ? 'text-black scale-110' : 'text-gray-100'
                        }`}
                        onMouseEnter={() => setHover(starValue)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(starValue)}
                    />
                );
            })}
            <span className="ml-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 italic">
                {rating > 0 ? `Level ${rating}.0` : 'Identity Pending'}
            </span>
        </div>
    );
};

export default function ProductReviews({ productId, initialReviews, onReviewPosted }) {
    const [user, setUser] = useState(null);
    const [reviews, setReviews] = useState(initialReviews || []);
    const [newReviewText, setNewReviewText] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isEligible, setIsEligible] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [eligibilityLoading, setEligibilityLoading] = useState(true);

    // ১. ইউজার স্টেট হ্যান্ডলিং (Hydration Safe)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // ২. এলিজিবিলিটি প্রোটোকল
    useEffect(() => {
        const checkEligibility = async () => {
            if (!user) {
                setEligibilityLoading(false);
                return;
            }

            try {
                // ইতিমধ্যে রিভিউ দিয়েছেন কিনা
                const reviewQuery = query(
                    collection(db, 'products', productId, 'reviews'),
                    where('userId', '==', user.uid),
                    limit(1)
                );
                const reviewSnap = await getDocs(reviewQuery);
                if (!reviewSnap.empty) {
                    setHasReviewed(true);
                    setEligibilityLoading(false);
                    return;
                }

                // পণ্যটি কিনেছেন কিনা (Verified Purchase)
                const ordersQuery = query(
                    collection(db, 'orders'),
                    where('userId', '==', user.uid),
                    where('status', '==', 'Delivered')
                );
                const ordersSnap = await getDocs(ordersQuery);
                let purchased = false;
                ordersSnap.forEach(doc => {
                    const items = doc.data().items;
                    if (items.some(item => item.id === productId)) purchased = true;
                });

                setIsEligible(purchased);
            } catch (err) {
                console.error("Eligibility Check Failed:", err);
            } finally {
                setEligibilityLoading(false);
            }
        };

        checkEligibility();
    }, [user, productId]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (newRating === 0 || newReviewText.trim() === '') {
            return toast.error('Blueprint incomplete: Provide rating and commentary.');
        }

        setIsSubmitting(true);
        const reviewToast = toast.loading("Archiving your statement...");
        try {
            const reviewsRef = collection(db, 'products', productId, 'reviews');
            await addDoc(reviewsRef, {
                userId: user.uid,
                userName: user.displayName || 'Authorized Collector',
                userImage: user.photoURL,
                rating: newRating,
                text: newReviewText,
                createdAt: serverTimestamp()
            });

            setNewReviewText('');
            setNewRating(0);
            toast.success('Statement archived.', { id: reviewToast });
            if (onReviewPosted) onReviewPosted(); 
        } catch (error) {
            toast.error('Transmission error. Try again.', { id: reviewToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="mt-32 pt-24 border-t border-gray-50 max-w-6xl mx-auto selection:bg-black selection:text-white">
            <header className="mb-20 flex flex-col md:flex-row justify-between items-end gap-10">
                <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-[0.8em] text-gray-300 font-black italic block">Public Archives</span>
                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">The Verdict</h2>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 border border-gray-100 rounded-full">
                    <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-500">
                        {reviews.length} Verified Statements
                    </span>
                </div>
            </header>

            {/* --- Review Form: The Auditor --- */}
            {user && !eligibilityLoading && isEligible && !hasReviewed && (
                <div className="bg-white border border-gray-100 p-10 md:p-16 rounded-sm mb-24 shadow-[0_40px_100px_rgba(0,0,0,0.02)] animate-fadeIn">
                    <header className="mb-12 border-l-4 border-black pl-6 space-y-2">
                        <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold italic block">Client Protocol</span>
                        <h3 className="font-black text-3xl uppercase tracking-tighter italic">Add to the Narrative</h3>
                    </header>
                    <form onSubmit={handleReviewSubmit} className="space-y-10">
                        <div className="space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 italic">Impression Index</p>
                            <StarRating rating={newRating} setRating={setNewRating} />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 italic">Your Commentary</label>
                            <textarea
                                value={newReviewText}
                                onChange={(e) => setNewReviewText(e.target.value)}
                                placeholder="DESCRIBE THE CRAFTSMANSHIP..."
                                className="w-full bg-[#fcfcfc] border border-gray-100 p-8 text-[12px] font-bold tracking-widest outline-none focus:border-black focus:bg-white transition-all rounded-sm uppercase italic placeholder:text-gray-200 leading-relaxed"
                                rows="5"
                            ></textarea>
                        </div>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative px-16 py-6 bg-black text-white text-[11px] font-black uppercase tracking-[0.5em] overflow-hidden transition-all shadow-2xl active:scale-95 disabled:opacity-30"
                        >
                            <span className="relative z-10">{isSubmitting ? 'Synchronizing...' : 'Log Impression'}</span>
                            <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        </button>
                    </form>
                </div>
            )}

            {/* --- Review Ledger --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-20">
                {reviews.length > 0 ? (
                    reviews.map(review => (
                        <div key={review.id} className="group relative pt-12 border-t border-gray-50 hover:border-black transition-colors duration-700">
                            <RiDoubleQuotesL className="absolute -top-4 -left-2 text-gray-50 text-7xl -z-10 transition-transform group-hover:scale-110" />
                            <div className="flex gap-8 items-start">
                                <div className="shrink-0 relative">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-100 bg-gray-50 shadow-xl group-hover:scale-105 transition-transform duration-500">
                                        {review.userImage ? (
                                            <img src={review.userImage} alt={review.userName} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                        ) : (
                                            <HiOutlineUserCircle className="w-full h-full text-gray-200" />
                                        )}
                                    </div>
                                    <HiBadgeCheck className="absolute -bottom-1 -right-1 text-black bg-white rounded-full w-6 h-6 p-0.5 border border-gray-100" title="Verified Acquisition" />
                                </div>
                                
                                <div className="flex-1 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-900 leading-none">{review.userName}</h4>
                                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-300 italic">
                                            {review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString('en-GB', {day:'2-digit', month:'short'}) : 'Tracing'}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => <HiStar key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-black' : 'text-gray-100'}`} />)}
                                    </div>
                                    <p className="text-gray-500 text-[13px] font-medium leading-relaxed italic tracking-tight lowercase first-letter:uppercase">
                                        "{review.text}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="md:col-span-2 text-center py-32 bg-[#fcfcfc] border border-dashed border-gray-100 rounded-sm">
                        <p className="text-[10px] uppercase tracking-[0.6em] font-black text-gray-300 italic">Archive Empty: No Public Statements Logged</p>
                    </div>
                )}
            </div>
        </section>
    );
}
