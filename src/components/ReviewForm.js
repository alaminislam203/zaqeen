'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const ReviewForm = ({ item, orderId, user, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [characterCount, setCharacterCount] = useState(0);
    const [showValidation, setShowValidation] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);

    const maxCharacters = 500;
    const minCharacters = 10;

    useEffect(() => {
        // Trigger animation on mount
        setAnimateIn(true);
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        setCharacterCount(comment.length);
    }, [comment]);

    const handleClose = () => {
        setAnimateIn(false);
        setTimeout(onClose, 300);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (rating === 0) {
            setShowValidation(true);
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

        if (comment.trim().length < minCharacters) {
            setShowValidation(true);
            toast.error(`Review must be at least ${minCharacters} characters`, {
                style: {
                    borderRadius: '8px',
                    background: '#000',
                    color: '#fff',
                    fontSize: '12px',
                }
            });
            return;
        }
        
        setSubmitting(true);
        const loadingToast = toast.loading("Submitting your review...");

        try {
            // 1. Add review to product subcollection
            const productRef = doc(db, 'products', item.id);
            await addDoc(collection(productRef, 'reviews'), {
                userId: user.uid,
                userName: user.displayName || user.name || 'Zaqeen Customer',
                userImage: user.photoURL || null,
                rating,
                text: comment.trim(),
                createdAt: serverTimestamp(),
                verified: true,
                helpful: 0
            });

            // 2. Mark item as reviewed in order
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                const orderData = orderSnap.data();
                const updatedItems = orderData.items.map(orderItem => {
                    if (String(orderItem.id) === String(item.id)) {
                        return { ...orderItem, reviewed: true, reviewedAt: new Date() };
                    }
                    return orderItem;
                });
                await updateDoc(orderRef, { 
                    items: updatedItems,
                    lastReviewedAt: serverTimestamp()
                });
            }
            
            toast.success('Review submitted successfully!', { id: loadingToast });
            
            // Close with animation
            setAnimateIn(false);
            setTimeout(() => {
                onSuccess();
            }, 300);
            
        } catch (error) {
            console.error("Review submission error:", error);
            toast.error('Failed to submit review. Please try again.', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const getRatingLabel = (value) => {
        const labels = {
            1: 'Poor',
            2: 'Fair',
            3: 'Good',
            4: 'Very Good',
            5: 'Excellent'
        };
        return labels[value] || 'Select Rating';
    };

    return (
        <div 
            className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 transition-opacity duration-300 ${
                animateIn ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={handleClose}
        >
            <div 
                className={`bg-white rounded-2xl max-w-2xl w-full relative shadow-2xl overflow-hidden transition-all duration-300 ${
                    animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Header Background */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 opacity-50"></div>
                
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(0,0,0,0.03) 20px, rgba(0,0,0,0.03) 40px)`
                    }}></div>
                </div>

                {/* Close Button */}
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-gray-100 transition-all shadow-lg group"
                    aria-label="Close"
                >
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-black transition-colors" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="relative z-10 p-6 md:p-10">
                    {/* Header */}
                    <header className="mb-8 space-y-4">
                        <div className="flex items-start gap-4">
                            {/* Product Image */}
                            {item.image && (
                                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg flex-shrink-0">
                                    <img 
                                        src={item.image} 
                                        alt={item.title || item.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 mb-3">
                                    <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                                        Write Review
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2 line-clamp-2">
                                    {item.title || item.name}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Share your experience with this product
                                </p>
                            </div>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Rating Section */}
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-bold text-gray-900 mb-2 block">
                                    Your Rating <span className="text-red-500">*</span>
                                </span>
                                
                                {/* Stars */}
                                <div className="flex items-center gap-2 p-6 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl transition-all duration-300 hover:border-amber-300">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => {
                                                    setRating(star);
                                                    setShowValidation(false);
                                                }}
                                                className="group transition-all duration-200 p-1"
                                            >
                                                <svg 
                                                    className={`w-10 h-10 transition-all duration-300 ${
                                                        (hoverRating || rating) >= star 
                                                            ? 'text-amber-400 scale-110 drop-shadow-lg filter brightness-110' 
                                                            : 'text-gray-200 group-hover:text-gray-300'
                                                    }`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {/* Rating Label */}
                                    <div className="ml-4 flex-1">
                                        <p className={`text-sm font-bold transition-all ${
                                            rating > 0 ? 'text-amber-600' : 'text-gray-400'
                                        }`}>
                                            {getRatingLabel(hoverRating || rating)}
                                        </p>
                                        {rating > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {rating}.0 out of 5 stars
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Validation Error */}
                                {showValidation && rating === 0 && (
                                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Please select a rating
                                    </p>
                                )}
                            </label>
                        </div>

                        {/* Review Comment Section */}
                        <div className="space-y-3">
                            <label htmlFor="comment" className="block">
                                <span className="text-sm font-bold text-gray-900 mb-2 block">
                                    Your Review <span className="text-red-500">*</span>
                                </span>
                                <textarea
                                    id="comment"
                                    rows="5"
                                    value={comment}
                                    onChange={(e) => {
                                        if (e.target.value.length <= maxCharacters) {
                                            setComment(e.target.value);
                                            setShowValidation(false);
                                        }
                                    }}
                                    className={`w-full px-5 py-4 bg-white border-2 rounded-xl text-sm outline-none transition-all resize-none ${
                                        showValidation && comment.trim().length < minCharacters
                                            ? 'border-red-300 focus:border-red-500'
                                            : 'border-gray-200 focus:border-black'
                                    }`}
                                    placeholder="Share your thoughts about this product... What did you like? What could be improved?"
                                ></textarea>
                            </label>

                            {/* Character Counter */}
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2">
                                    {comment.trim().length < minCharacters ? (
                                        <span className="text-gray-500">
                                            Minimum {minCharacters} characters required
                                        </span>
                                    ) : (
                                        <span className="text-green-600 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Looks good!
                                        </span>
                                    )}
                                </div>
                                <span className={`font-semibold ${
                                    characterCount > maxCharacters * 0.9 ? 'text-orange-500' : 'text-gray-500'
                                }`}>
                                    {characterCount} / {maxCharacters}
                                </span>
                            </div>

                            {/* Validation Error */}
                            {showValidation && comment.trim().length < minCharacters && (
                                <p className="text-xs text-red-600 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Review is too short
                                </p>
                            )}
                        </div>

                        {/* Tips Section */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xs font-bold text-blue-900 mb-2">Writing a helpful review:</h4>
                                    <ul className="text-xs text-blue-800 space-y-1">
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-600 mt-0.5">•</span>
                                            <span>Describe the product quality and features</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-600 mt-0.5">•</span>
                                            <span>Share how you use the product</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-600 mt-0.5">•</span>
                                            <span>Mention pros and cons honestly</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="flex-1 px-6 py-4 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                            >
                                {submitting ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Review
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Bottom Decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400"></div>
            </div>
        </div>
    );
};

export default ReviewForm;