'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { HiStar, HiOutlineUserCircle, HiBadgeCheck } from 'react-icons/hi';
import { RiDoubleQuotesL } from 'react-icons/ri';

// --- স্টার রেটিং কম্পোনেন্ট (Refined Style) ---
const StarRating = ({ rating, setRating }) => {
    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <HiStar 
                        key={starValue}
                        className={`w-6 h-6 cursor-pointer transition-all duration-300 ${starValue <= rating ? 'text-black scale-110' : 'text-gray-100'}`}
                        onClick={() => setRating(starValue)}
                    />
                );
            })}
        </div>
    );
};

// --- মূল রিভিউ কম্পোনেন্ট ---
export default function ProductReviews({ productId, initialReviews, onReviewPosted }) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState(initialReviews || []);
    const [newReviewText, setNewReviewText] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isEligible, setIsEligible] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [eligibilityLoading, setEligibilityLoading] = useState(true);

    useEffect(() => {
        setReviews(initialReviews);
    }, [initialReviews]);

    useEffect(() => {
        const checkEligibility = async () => {
            if (!user) {
                setEligibilityLoading(false);
                return;
            }

            setEligibilityLoading(true);

            // ১. ব্যবহারকারী ইতিমধ্যে রিভিউ দিয়েছেন কিনা যাচাই
            const reviewQuery = query(
                collection(db, 'products', productId, 'reviews'),
                where('userId', '==', user.uid),
                limit(1)
            );
            const reviewSnap = await getDocs(reviewQuery);
            if (!reviewSnap.empty) {
                setHasReviewed(true);
                setIsEligible(false);
                setEligibilityLoading(false);
                return;
            }

            // ২. পণ্যটি কিনেছেন এবং ডেলিভারি পেয়েছেন কিনা যাচাই (Zaqeen Standard)
            const ordersQuery = query(
                collection(db, 'orders'),
                where('userId', '==', user.uid),
                where('status', '==', 'Delivered') // আপনার অ্যাডমিন স্ট্যাটাস অনুযায়ী 'Delivered' করা হয়েছে
            );
            const ordersSnap = await getDocs(ordersQuery);
            let purchased = false;
            ordersSnap.forEach(doc => {
                const items = doc.data().items;
                if (items.some(item => item.id === productId)) {
                    purchased = true;
                }
            });

            setIsEligible(purchased);
            setEligibilityLoading(false);
        };

        checkEligibility();
    }, [user, productId]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (newRating === 0 || newReviewText.trim() === '') {
            toast.error('Identity incomplete: Provide rating and thoughts.');
            return;
        }

        setIsSubmitting(true);
        const reviewToast = toast.loading("Logging your thoughts...");
        try {
            const reviewsRef = collection(db, 'products', productId, 'reviews');
            await addDoc(reviewsRef, {
                userId: user.uid,
                userName: user.displayName || 'Anonymous Collector',
                userImage: user.photoURL,
                rating: newRating,
                text: newReviewText,
                createdAt: serverTimestamp()
            });

            setNewReviewText('');
            setNewRating(0);
            toast.success('Review archived successfully.', { id: reviewToast });
            onReviewPosted(); 
        } catch (error) {
            toast.error('System anomaly. Try again.', { id: reviewToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderReviewForm = () => {
        if (eligibilityLoading) return null;
        if (hasReviewed) return (
            <div className="bg-gray-50/50 p-8 rounded-sm text-center mb-16 border border-gray-100">
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-400 italic">Review Logged Previously</p>
            </div>
        );
        
        if (isEligible) {
            return (
                <div className="bg-white border border-gray-100 p-8 md:p-12 rounded-sm mb-20 shadow-[0_30px_80px_rgba(0,0,0,0.02)]">
                    <header className="mb-10 space-y-2">
                        <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold italic block">The Auditor</span>
                        <h3 className="font-black text-2xl uppercase tracking-tighter italic">Log Your Experience</h3>
                    </header>
                    <form onSubmit={handleReviewSubmit} className="space-y-8">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4">Rating Index</p>
                            <StarRating rating={newRating} setRating={setNewRating} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Written Feedback</label>
                            <textarea
                                value={newReviewText}
                                onChange={(e) => setNewReviewText(e.target.value)}
                                placeholder="HOW DOES IT FEEL?"
                                className="w-full bg-gray-50 border-none p-6 text-[11px] font-bold tracking-widest outline-none focus:ring-1 ring-black transition rounded-sm uppercase placeholder:text-gray-200"
                                rows="5"
                                disabled={isSubmitting}
                            ></textarea>
                        </div>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full md:w-auto px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.5em] hover:bg-gray-800 transition shadow-2xl disabled:opacity-30"
                        >
                            {isSubmitting ? 'Transmitting...' : 'Archive Review'}
                        </button>
                    </form>
                </div>
            );
        }
        return null;
    };

    return (
        <section className="mt-32 pt-20 border-t border-gray-50 max-w-5xl mx-auto">
            <header className="mb-16 flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.6em] text-gray-400 font-black italic block">Public Records</span>
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">The Feedback</h2>
                </div>
                <div className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400">
                    {reviews.length} {reviews.length === 1 ? 'Statement' : 'Statements'} Logged
                </div>
            </header>

            {user && renderReviewForm()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                {reviews.length > 0 ? (
                    reviews.map(review => (
                        <div key={review.id} className="group relative pt-10 border-t border-gray-50">
                            <RiDoubleQuotesL className="absolute top-4 left-0 text-gray-100 text-5xl -z-10" />
                            <div className="flex gap-6">
                                <div className="shrink-0 relative">
                                    {review.userImage ? (
                                        <img src={review.userImage} alt={review.userName} className="w-14 h-14 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 shadow-xl" />
                                    ) : (
                                        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                                            <HiOutlineUserCircle className="w-8 h-8 text-gray-300" />
                                        </div>
                                    )}
                                    <HiBadgeCheck className="absolute -bottom-1 -right-1 text-emerald-500 bg-white rounded-full w-6 h-6 border-2 border-white" />
                                </div>
                                
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest">{review.userName}</h4>
                                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-300 italic">
                                            {review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString('en-GB', {day:'2-digit', month:'short'}) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => <HiStar key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-black' : 'text-gray-100'}`} />)}
                                    </div>
                                    <p className="text-gray-500 text-[12px] font-medium leading-relaxed italic tracking-tight">
                                        "{review.text}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="md:col-span-2 text-center py-20 bg-[#fcfcfc] border border-dashed border-gray-100 rounded-sm">
                        <p className="text-[10px] uppercase tracking-[0.5em] font-black text-gray-300 italic">No Public Statements Logged Yet</p>
                    </div>
                )}
            </div>
        </section>
    );
}
