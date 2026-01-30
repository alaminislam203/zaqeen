'use client';
import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { HiStar, HiOutlineX } from 'react-icons/hi';

const ReviewForm = ({ item, orderId, user, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return toast.error("Select an Impression Rating.");
        if (comment.trim().length < 5) return toast.error("Comment too brief for archive.");
        
        setSubmitting(true);
        const loadingToast = toast.loading("Syncing Impression...");

        try {
            // ১. প্রোডাক্টের সাব-কালেকশনে রিভিউ যোগ করা
            const productRef = doc(db, 'products', item.id);
            await addDoc(collection(productRef, 'reviews'), {
                userId: user.uid,
                userName: user.displayName || user.name || 'Zaqeen Member',
                rating,
                text: comment,
                createdAt: serverTimestamp(),
            });

            // ২. অর্ডারের ভেতর আইটেমটিকে 'reviewed' হিসেবে মার্ক করা
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                const orderData = orderSnap.data();
                const updatedItems = orderData.items.map(orderItem => {
                    // ID চেক করার সময় টাইপ সেফটি নিশ্চিত করা
                    if (String(orderItem.id) === String(item.id)) {
                        return { ...orderItem, reviewed: true };
                    }
                    return orderItem;
                });
                await updateDoc(orderRef, { items: updatedItems });
            }
            
            toast.success("Impression Logged Successfully.", { id: loadingToast });
            onSuccess();
        } catch (error) {
            console.error("Submission Failure: ", error);
            toast.error("Protocol Interrupted. Try Again.", { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[999] p-6 animate-fadeIn">
            <div className="bg-white border border-gray-100 p-8 md:p-12 max-w-lg w-full relative shadow-2xl rounded-sm overflow-hidden">
                
                {/* Decorative Background Icon */}
                <HiStar className="absolute -right-10 -top-10 text-gray-50 opacity-50" size={200} />

                <button onClick={onClose} className="absolute top-6 right-6 text-gray-300 hover:text-black transition-colors z-10">
                    <HiOutlineX size={24} />
                </button>

                <div className="relative z-10">
                    <header className="mb-10 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 italic block">Zaqeen Feedback</span>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">
                            Share Impression: <span className="text-gray-400">{item.title || item.name}</span>
                        </h2>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Rating Logic */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Impression Level</label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <HiStar 
                                        key={star} 
                                        size={32} 
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className={`cursor-pointer transition-all duration-300 ${
                                            (hoverRating || rating) >= star ? 'text-black scale-110' : 'text-gray-100'
                                        }`}
                                        onClick={() => setRating(star)}
                                    />
                                ))}
                                <span className="ml-4 text-[10px] font-black uppercase tracking-widest text-gray-300 italic">
                                    {rating > 0 ? `Protocol ${rating}.0` : 'Not Set'}
                                </span>
                            </div>
                        </div>

                        {/* Comment Logic */}
                        <div className="space-y-3">
                            <label htmlFor="comment" className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Article Commentary</label>
                            <textarea
                                id="comment"
                                rows="4"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full p-5 bg-gray-50 border border-transparent focus:border-black focus:bg-white transition-all text-[11px] font-bold tracking-tight outline-none italic rounded-sm"
                                placeholder="DOCUMENT YOUR EXPERIENCE WITH THIS ARTICLE..."
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="group relative w-full bg-black text-white p-6 text-[10px] font-black uppercase tracking-[0.5em] overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <span className="relative z-10">{submitting ? 'LOGGING...' : 'SUBMIT IMPRESSION'}</span>
                            <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReviewForm;
