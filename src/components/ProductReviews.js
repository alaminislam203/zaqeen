'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { HiStar, HiOutlineUserCircle } from 'react-icons/hi';

// --- স্টার রেটিং কম্পোনেন্ট ---
const StarRating = ({ rating, setRating }) => {
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <HiStar 
                        key={starValue}
                        className={`w-7 h-7 cursor-pointer ${starValue <= rating ? 'text-amber-400' : 'text-gray-300'}`}
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

    // রিভিউ দেওয়ার যোগ্যতা যাচাই করার জন্য স্টেট
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
            setHasReviewed(false);

            // ২. পণ্যটি কিনেছেন এবং ডেলিভারি পেয়েছেন কিনা যাচাই
            const ordersQuery = query(
                collection(db, 'orders'),
                where('userId', '==', user.uid),
                where('status', '==', 'DELIVERED')
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
        if (!isEligible || hasReviewed) {
            toast.error('You are not eligible to review this product.');
            return;
        }
        if (newRating === 0 || newReviewText.trim() === '') {
            toast.error('Please provide a rating and a comment.');
            return;
        }

        setIsSubmitting(true);
        try {
            const reviewsRef = collection(db, 'products', productId, 'reviews');
            await addDoc(reviewsRef, {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userImage: user.photoURL,
                rating: newRating,
                text: newReviewText,
                createdAt: serverTimestamp()
            });

            setNewReviewText('');
            setNewRating(0);
            toast.success('Thank you for your review!');
            onReviewPosted(); 
        } catch (error) {
            console.error("Error submitting review: ", error);
            toast.error('Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderReviewForm = () => {
        if (eligibilityLoading) {
            return <div className="bg-gray-50 p-6 rounded-lg mb-12 text-center text-sm text-gray-500">Checking eligibility to review...</div>;
        }
        if (hasReviewed) {
            return <div className="bg-gray-50 p-6 rounded-lg mb-12 text-center text-sm text-gray-500">You have already reviewed this product.</div>;
        }
        if (isEligible) {
            return (
                <div className="bg-gray-50 p-6 rounded-lg mb-12">
                    <h3 className="font-bold text-lg mb-4">Leave a Review</h3>
                    <form onSubmit={handleReviewSubmit}>
                        <StarRating rating={newRating} setRating={setNewRating} />
                        <textarea
                            value={newReviewText}
                            onChange={(e) => setNewReviewText(e.target.value)}
                            placeholder="Share your thoughts..."
                            className="w-full mt-4 p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-black transition"
                            rows="4"
                            disabled={isSubmitting}
                        ></textarea>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-4 px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-md hover:bg-gray-800 transition disabled:bg-gray-400"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </form>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mt-16 pt-12 border-t border-gray-100">
            <h2 className="text-2xl font-black tracking-tighter mb-8">Customer Reviews ({reviews.length})</h2>

            {user && renderReviewForm()}

            <div className="space-y-8">
                {reviews.length > 0 ? (
                    reviews.map(review => (
                        <div key={review.id} className="flex gap-4">
                            {review.userImage ? (
                                <img src={review.userImage} alt={review.userName} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                                <HiOutlineUserCircle className="w-12 h-12 text-gray-400" />
                            )}
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold">{review.userName}</h4>
                                    <span className="text-xs text-gray-400">{review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString() : ''}</span>
                                </div>
                                <div className="flex mt-1">
                                    {[...Array(5)].map((_, i) => <HiStar key={i} className={`w-5 h-5 ${i < review.rating ? 'text-amber-400' : 'text-gray-300'}`} />)}
                                </div>
                                <p className="text-gray-600 mt-2 text-sm">{review.text}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                        <p>No reviews yet.</p>
                        <p className="text-xs mt-1">Be the first to share your thoughts once you've purchased the item!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
