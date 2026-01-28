'use client';
import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { HiStar, HiOutlineX } from 'react-icons/hi';

const ReviewForm = ({ item, orderId, user, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a star rating.");
            return;
        }
        if (comment.trim() === '') {
            toast.error("Please write a comment.");
            return;
        }
        
        setSubmitting(true);
        try {
            // Add review to the product's reviews subcollection
            const productRef = doc(db, 'products', item.id);
            await addDoc(collection(productRef, 'reviews'), {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                rating,
                text: comment, // FIX: Changed field name from 'comment' to 'text'
                createdAt: serverTimestamp(),
            });

            // Mark the item as reviewed in the order
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                const orderData = orderSnap.data();
                const updatedItems = orderData.items.map(orderItem => {
                    if (orderItem.id === item.id) {
                        return { ...orderItem, reviewed: true };
                    }
                    return orderItem;
                });
                await updateDoc(orderRef, { items: updatedItems });
            }
            
            toast.success("Thank you for your review!");
            onSuccess(); // Callback to parent
        } catch (error) {
            console.error("Error submitting review: ", error);
            toast.error("Failed to submit review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <HiOutlineX size={24} />
                </button>
                <h2 className="text-xl font-bold mb-4">Leave a Review for <span className="font-normal">{item.title || item.name}</span></h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block font-semibold mb-2">Your Rating</label>
                        <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map(star => (
                                <HiStar 
                                    key={star} 
                                    size={32} 
                                    className={`cursor-pointer ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="mb-6">
                        <label htmlFor="comment" className="block font-semibold mb-2">Your Comment</label>
                        <textarea
                            id="comment"
                            rows="4"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Tell us what you thought..."
                        ></textarea>
                    </div>
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-400">
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReviewForm;
