'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import toast from 'react-hot-toast';

// --- স্টার রেটিং কম্পোনেন্ট ---
const StarRating = ({ rating, setRating }) => (
    <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => {
            const starValue = index + 1;
            return (
                <button key={starValue} type="button" onClick={() => setRating(starValue)}>
                    <svg className={`w-6 h-6 transition-colors ${starValue <= rating ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                </button>
            );
        })}
    </div>
);

// --- রিভিউ মডেল ---
const ReviewModal = ({ item, orderId, onClose, onReviewSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please provide a rating.');
            return;
        }
        if (comment.trim() === '') {
            toast.error('Please write a comment.');
            return;
        }

        setIsSubmitting(true);
        try {
            // ১. প্রোডাক্টের সাব-কালেকশনে রিভিউ যোগ করা
            const reviewRef = collection(db, 'products', item.id, 'reviews');
            await addDoc(reviewRef, {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userImage: user.photoURL,
                rating: rating,
                text: comment, // এখানে `text` ফিল্ড ব্যবহার করা হচ্ছে
                createdAt: serverTimestamp(),
                orderId: orderId,
            });

            // ২. অর্ডারের আইটেমটি আপটেড করে রিভিউ দেওয়া হয়েছে চিহ্নিত করা
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                const orderData = orderSnap.data();
                const updatedItems = orderData.items.map(orderItem => 
                    orderItem.id === item.id ? { ...orderItem, hasBeenReviewed: true } : orderItem
                );
                await updateDoc(orderRef, { items: updatedItems });
            }

            toast.success('Thank you for your review!');
            onReviewSubmit(); 
            onClose();

        } catch (error) {
            console.error("Error submitting review: ", error);
            toast.error('Failed to submit review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 md:p-8 w-full max-w-md">
                <h2 className="text-xl font-bold mb-2">Leave a Review</h2>
                <p className="text-sm text-gray-600 mb-4">How was your experience with <span className="font-semibold">{item.name}</span>?</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="font-semibold text-sm mb-2 block">Your Rating</label>
                        <StarRating rating={rating} setRating={setRating} />
                    </div>
                    <div>
                        <label htmlFor="comment" className="font-semibold text-sm mb-2 block">Your Comments</label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What did you like or dislike?"
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black transition"
                            rows="4"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-5 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition disabled:bg-gray-400">
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- মূল অর্ডার ডিটেইলস পেজ ---
export default function OrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewingItem, setReviewingItem] = useState(null);

    const fetchOrder = useCallback(async () => {
        if (!id || !user) return;
        setLoading(true);
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const orderData = { id: docSnap.id, ...docSnap.data() };
            if (orderData.userId === user.uid) {
                setOrder(orderData);
            } else {
                toast.error("You are not authorized to view this order.");
                router.push('/my-account/orders');
            }
        } else {
            toast.error("Order not found.");
            router.push('/my-account/orders');
        }
        setLoading(false);
    }, [id, user, router]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchOrder();
        } else if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router, fetchOrder]);

    if (loading || authLoading) {
        return <div className="flex justify-center items-center h-screen"><p>Loading order details...</p></div>;
    }

    if (!order) {
        return null; // অথবা একটি "অর্ডার পাওয়া যায়নি" মেসেজ
    }

    const canReview = order.status === 'DELIVERED';

    return (
        <div className="bg-gray-50 min-h-screen py-8 md:py-12">
            <div className="max-w-4xl mx-auto px-4">
                <button onClick={() => router.back()} className="text-sm font-medium text-gray-600 hover:text-black mb-4">← Back to Orders</button>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200/80">
                    <div className="p-6 border-b border-gray-100">
                        <h1 className="text-xl md:text-2xl font-bold">Order Details</h1>
                        <p className="text-sm text-gray-500 mt-1">Order ID: <span className="font-mono">{order.id}</span></p>
                        <p className="text-sm text-gray-500">Date: {order.timestamp?.toDate().toLocaleDateString()}</p>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        {order.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between gap-4 py-2">
                                <div className="flex items-center gap-4">
                                    <Image src={item.imageUrl} alt={item.name} width={64} height={80} className="rounded-md object-cover" />
                                    <div>
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        {item.selectedSize && <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">৳{item.price * item.quantity}</p>
                                    {canReview && (
                                        item.hasBeenReviewed ? (
                                            <p className="text-xs text-green-600 mt-1">✓ Reviewed</p>
                                        ) : (
                                            <button onClick={() => setReviewingItem(item)} className="text-xs text-blue-600 hover:underline mt-1">Leave a review</button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-gray-50/70 rounded-b-xl grid md:grid-cols-2 gap-6">
                         <div>
                             <h3 className="font-semibold mb-2">Shipping Address</h3>
                             <div className="text-sm text-gray-600">
                                 <p>{order.shippingAddress.name}</p>
                                 <p>{order.shippingAddress.address}</p>
                                 <p>{order.shippingAddress.city}, {order.shippingAddress.district}</p>
                                 <p>{order.shippingAddress.phone}</p>
                             </div>
                         </div>
                         <div>
                            <h3 className="font-semibold mb-2">Order Summary</h3>
                            <div className="text-sm space-y-1 text-gray-600">
                                <div className="flex justify-between"><p>Subtotal:</p><p>৳{order.subtotal}</p></div>
                                <div className="flex justify-between"><p>Shipping:</p><p>৳{order.shippingCost}</p></div>
                                <div className="flex justify-between font-bold text-base text-black pt-1 border-t border-gray-200 mt-1"><p>Total:</p><p>৳{order.total}</p></div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            {reviewingItem && (
                <ReviewModal 
                    item={reviewingItem} 
                    orderId={order.id}
                    onClose={() => setReviewingItem(null)} 
                    onReviewSubmit={() => {
                        setReviewingItem(null);
                        fetchOrder(); // লেটেস্ট অর্ডার তথ্য রিফ্রেশ করা
                    }}
                />
            )}
        </div>
    );
}
