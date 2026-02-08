'use client';
import { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Enhanced Star Rating Component
const StarRating = ({ rating, setRating, interactive = true, size = 'md' }) => {
    const [hover, setHover] = useState(0);
    
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-7 h-7',
        lg: 'w-8 h-8'
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => {
                    const starValue = index + 1;
                    return (
                        <button
                            key={starValue}
                            type="button"
                            disabled={!interactive}
                            className={`transition-all duration-300 ${interactive ? 'cursor-pointer' : 'cursor-default'} group`}
                            onMouseEnter={() => interactive && setHover(starValue)}
                            onMouseLeave={() => interactive && setHover(0)}
                            onClick={() => interactive && setRating(starValue)}
                        >
                            <svg 
                                className={`${sizeClasses[size]} transition-all duration-300 ${
                                    starValue <= (hover || rating) 
                                        ? 'text-amber-400 scale-110 drop-shadow-lg' 
                                        : 'text-gray-200 group-hover:text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    );
                })}
            </div>
            {interactive && (
                <span className={`ml-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    rating > 0 ? 'text-amber-500' : 'text-gray-300'
                }`}>
                    {rating > 0 ? `${rating}.0 Stars` : 'Rate Product'}
                </span>
            )}
        </div>
    );
};

// Review Statistics Component
const ReviewStats = ({ reviews }) => {
    const [stats, setStats] = useState({ average: 0, breakdown: {} });

    useEffect(() => {
        if (reviews.length === 0) return;

        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let total = 0;

        reviews.forEach(review => {
            breakdown[review.rating] = (breakdown[review.rating] || 0) + 1;
            total += review.rating;
        });

        setStats({
            average: (total / reviews.length).toFixed(1),
            breakdown,
            total: reviews.length
        });
    }, [reviews]);

    return (
        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Average Rating */}
                <div className="text-center space-y-4">
                    <div className="space-y-2">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400">
                            Overall Rating
                        </p>
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-6xl font-black text-gray-900">
                                {stats.average}
                            </span>
                            <span className="text-2xl font-bold text-gray-400">/5</span>
                        </div>
                    </div>
                    <StarRating rating={Math.round(parseFloat(stats.average))} interactive={false} size="md" />
                    <p className="text-xs text-gray-500 font-medium">
                        Based on {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
                    </p>
                </div>

                {/* Rating Breakdown */}
                <div className="md:col-span-2 space-y-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">
                        Rating Distribution
                    </p>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = stats.breakdown[star] || 0;
                        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                            <div key={star} className="flex items-center gap-4">
                                <div className="flex items-center gap-1 w-16">
                                    <span className="text-xs font-bold text-gray-600">{star}</span>
                                    <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-1000 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs font-semibold text-gray-500 w-12 text-right">
                                    {count}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
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
    const [expandedReviews, setExpandedReviews] = useState({});
    const [sortBy, setSortBy] = useState('recent');
    const [filterRating, setFilterRating] = useState(0);
    const reviewFormRef = useRef(null);

    // User state handling
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Eligibility check
    useEffect(() => {
        const checkEligibility = async () => {
            if (!user) {
                setEligibilityLoading(false);
                return;
            }

            try {
                // Check if already reviewed
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

                // Check if purchased (Verified Purchase)
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
                console.error("Eligibility check failed:", err);
            } finally {
                setEligibilityLoading(false);
            }
        };

        checkEligibility();
    }, [user, productId]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        
        if (newRating === 0) {
            toast.error('Please select a rating', {
                style: {
                    borderRadius: '8px',
                    background: '#000',
                    color: '#fff',
                    fontSize: '12px',
                }
            });
            return;
        }

        if (newReviewText.trim().length < 10) {
            toast.error('Review must be at least 10 characters', {
                style: {
                    borderRadius: '8px',
                    background: '#000',
                    color: '#fff',
                    fontSize: '12px',
                }
            });
            return;
        }

        setIsSubmitting(true);
        const reviewToast = toast.loading("Submitting your review...");
        
        try {
            const reviewsRef = collection(db, 'products', productId, 'reviews');
            await addDoc(reviewsRef, {
                userId: user.uid,
                userName: user.displayName || 'Anonymous Customer',
                userImage: user.photoURL,
                rating: newRating,
                text: newReviewText,
                createdAt: serverTimestamp(),
                verified: true,
                helpful: 0
            });

            setNewReviewText('');
            setNewRating(0);
            setHasReviewed(true);
            
            toast.success('Review posted successfully!', { id: reviewToast });
            
            if (onReviewPosted) onReviewPosted();
        } catch (error) {
            console.error("Review submission error:", error);
            toast.error('Failed to post review. Please try again.', { id: reviewToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const scrollToReviewForm = () => {
        reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const toggleReviewExpansion = (reviewId) => {
        setExpandedReviews(prev => ({
            ...prev,
            [reviewId]: !prev[reviewId]
        }));
    };

    // Filter and sort reviews
    const filteredReviews = reviews
        .filter(review => filterRating === 0 || review.rating === filterRating)
        .sort((a, b) => {
            if (sortBy === 'recent') {
                return b.createdAt?.toDate?.() - a.createdAt?.toDate?.();
            } else if (sortBy === 'highest') {
                return b.rating - a.rating;
            } else {
                return a.rating - b.rating;
            }
        });

    return (
        <section className="mt-24 pt-20 border-t border-gray-100 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 selection:bg-black selection:text-white">
            
            {/* Section Header */}
            <header className="mb-16 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                            <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-amber-700">
                                Customer Reviews
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                            What Our Customers Say
                        </h2>
                        <p className="text-gray-600 text-sm max-w-2xl">
                            Real feedback from verified purchasers who experienced our products firsthand.
                        </p>
                    </div>

                    {user && isEligible && !hasReviewed && (
                        <button
                            onClick={scrollToReviewForm}
                            className="flex items-center gap-2 px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl group"
                        >
                            <svg className="w-4 h-4" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Write a Review
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}
                </div>
            </header>

            {/* Review Statistics */}
            {reviews.length > 0 && <ReviewStats reviews={reviews} />}

            {/* Review Form */}
            {user && !eligibilityLoading && isEligible && !hasReviewed && (
                <div 
                    ref={reviewFormRef}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-8 md:p-12 mb-16 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                    <div className="flex items-start gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-xl shrink-0">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-2xl mb-2">Share Your Experience</h3>
                            <p className="text-sm text-gray-600">
                                Help other customers by sharing your honest feedback about this product
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleReviewSubmit} className="space-y-8">
                        {/* Rating Input */}
                        <div className="space-y-3 p-6 bg-gray-50 rounded-xl">
                            <label className="block text-sm font-bold text-gray-900">
                                Your Rating <span className="text-red-500">*</span>
                            </label>
                            <StarRating rating={newRating} setRating={setNewRating} interactive={true} size="lg" />
                        </div>

                        {/* Review Text */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-900">
                                Your Review <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={newReviewText}
                                onChange={(e) => setNewReviewText(e.target.value)}
                                placeholder="Share details about your experience with this product..."
                                className="w-full bg-white border-2 border-gray-200 focus:border-black px-6 py-4 text-sm outline-none transition-all rounded-xl resize-none min-h-[150px]"
                                maxLength={500}
                            />
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Minimum 10 characters</span>
                                <span className={newReviewText.length > 450 ? 'text-orange-500 font-semibold' : ''}>
                                    {newReviewText.length} / 500
                                </span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            disabled={isSubmitting || newRating === 0 || newReviewText.trim().length < 10}
                            className="w-full md:w-auto px-10 py-4 bg-black text-white text-sm font-black uppercase tracking-wider rounded-xl hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Posting Review...
                                </>
                            ) : (
                                <>
                                    Post Review
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Not Eligible Message */}
            {user && !eligibilityLoading && !isEligible && !hasReviewed && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 mb-16">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-gray-900 mb-2">Purchase Required</h4>
                            <p className="text-sm text-gray-700">
                                Only customers who have purchased and received this product can leave a review.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Already Reviewed Message */}
            {user && hasReviewed && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 mb-16">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-gray-900 mb-2">Thank You!</h4>
                            <p className="text-sm text-gray-700">
                                You've already submitted a review for this product. Your feedback is visible below.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter and Sort Controls */}
            {reviews.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                    {/* Filter by Rating */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Filter:
                        </span>
                        <button
                            onClick={() => setFilterRating(0)}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                                filterRating === 0
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            All
                        </button>
                        {[5, 4, 3, 2, 1].map(rating => (
                            <button
                                key={rating}
                                onClick={() => setFilterRating(rating)}
                                className={`flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                                    filterRating === rating
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {rating}
                                <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </button>
                        ))}
                    </div>

                    {/* Sort Controls */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Sort:
                        </span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none focus:border-black transition-all cursor-pointer"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="highest">Highest Rating</option>
                            <option value="lowest">Lowest Rating</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
                {filteredReviews.length > 0 ? (
                    filteredReviews.map((review, index) => {
                        const isLongReview = review.text.length > 200;
                        const isExpanded = expandedReviews[review.id];
                        const displayText = isLongReview && !isExpanded 
                            ? review.text.substring(0, 200) + '...' 
                            : review.text;

                        return (
                            <div 
                                key={review.id} 
                                className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 hover:shadow-lg transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-start gap-4 md:gap-6">
                                    {/* User Avatar */}
                                    <div className="relative shrink-0">
                                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                            {review.userImage ? (
                                                <img 
                                                    src={review.userImage} 
                                                    alt={review.userName} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-black">
                                                    {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        {review.verified && (
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center" title="Verified Purchase">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Review Content */}
                                    <div className="flex-1 space-y-4 min-w-0">
                                        {/* Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    {review.userName}
                                                    {review.verified && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-wider rounded-full border border-green-200">
                                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            Verified
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {review.createdAt?.toDate 
                                                        ? new Date(review.createdAt.toDate()).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })
                                                        : 'Recently'
                                                    }
                                                </p>
                                            </div>
                                            <StarRating rating={review.rating} interactive={false} size="sm" />
                                        </div>

                                        {/* Review Text */}
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                {displayText}
                                            </p>
                                            {isLongReview && (
                                                <button
                                                    onClick={() => toggleReviewExpansion(review.id)}
                                                    className="text-xs font-bold text-black hover:underline flex items-center gap-1"
                                                >
                                                    {isExpanded ? 'Show Less' : 'Read More'}
                                                    <svg 
                                                        className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                                        fill="none" 
                                                        strokeWidth="2.5" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        {/* Helpful Button */}
                                        <div className="flex items-center gap-4 pt-2">
                                            <button className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-black transition-colors group/helpful">
                                                <svg className="w-4 h-4 group-hover/helpful:scale-110 transition-transform" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                                </svg>
                                                Helpful {review.helpful > 0 && `(${review.helpful})`}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-200 rounded-2xl">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {filterRating > 0 ? 'No reviews with this rating' : 'No reviews yet'}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {filterRating > 0 
                                ? 'Try changing your filter to see other reviews' 
                                : 'Be the first to share your experience with this product'
                            }
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}