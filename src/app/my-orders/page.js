'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { format } from 'date-fns';
import ReviewForm from '@/components/ReviewForm'; // We will create this component next

const MyOrdersPage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReviewItem, setSelectedReviewItem] = useState(null);

    const fetchOrders = useCallback(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate(),
            }));
            setOrders(userOrders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    if (loading) {
        return <div className="container mx-auto p-10 text-center"><p>Loading your orders...</p></div>;
    }

    if (!user) {
        return (
            <div className="container mx-auto p-10 text-center">
                <p className="mb-4">Please log in to see your orders.</p>
                <Link href="/login" className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800">
                    Go to Login
                </Link>
            </div>
        );
    }

    const handleReviewSuccess = () => {
        setSelectedReviewItem(null);
        // Optionally, refetch orders to update the reviewed status, though onSnapshot handles it.
    };

    return (
        <main className="container mx-auto p-4 md:p-10 bg-white">
            <h1 className="text-2xl font-bold mb-6">My Orders</h1>
            <div className="space-y-8">
                {orders.length > 0 ? (
                    orders.map(order => (
                        <div key={order.id} className="border rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="font-bold text-lg">Order #{order.orderId || order.id.substring(0, 8)}</h2>
                                    <p className="text-sm text-gray-500">Date: {order.timestamp ? format(order.timestamp, 'PPP') : 'N/A'}</p>
                                    <p className="text-sm text-gray-500">Total: BDT {order.total.toFixed(2)}</p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Items</h3>
                                <div className="space-y-4">
                                    {order.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center border-t pt-4">
                                            <div>
                                                <p className="font-semibold">{item.title || item.name}</p>
                                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                            </div>
                                            {order.status === 'Delivered' && (
                                                <div>
                                                    {item.reviewed ? (
                                                        <span className="text-sm text-green-600">Review Submitted</span>
                                                    ) : (
                                                        <button onClick={() => setSelectedReviewItem({ orderId: order.id, item })} className="text-sm text-blue-600 hover:underline">
                                                            Leave a Review
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>You haven&apos;t placed any orders yet.</p>
                )}
            </div>
            {selectedReviewItem && (
                <ReviewForm 
                    item={selectedReviewItem.item}
                    orderId={selectedReviewItem.orderId}
                    user={user} 
                    onClose={() => setSelectedReviewItem(null)} 
                    onSuccess={handleReviewSuccess}
                />
            )}
        </main>
    );
};

export default MyOrdersPage;
