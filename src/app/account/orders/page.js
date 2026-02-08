'use client';
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import Image from 'next/image';
import { onAuthStateChanged } from "firebase/auth";
import { generateInvoice } from "@/lib/generateInvoice";
import ReviewForm from "@/components/ReviewForm";
import toast from 'react-hot-toast';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const unsubOrders = onSnapshot(q, (snapshot) => {
          const fetchedOrders = snapshot.docs.map(doc => {
            const data = doc.data();
            let timestampDate = null;
            
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
              timestampDate = data.createdAt.toDate();
            } else if (data.timestamp && typeof data.timestamp.toDate === 'function') {
              timestampDate = data.timestamp.toDate();
            } else if (data.createdAt) {
              const date = new Date(data.createdAt);
              if (!isNaN(date.getTime())) timestampDate = date;
            }
            
            return { id: doc.id, ...data, displayDate: timestampDate };
          });
          
          setOrders(fetchedOrders);
          setLoading(false);
        });

        return () => unsubOrders();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleReviewSuccess = () => {
    setSelectedReviewItem(null);
    toast.success("Review submitted successfully!", {
      style: { 
        borderRadius: '8px', 
        background: '#000', 
        color: '#fff', 
        fontSize: '12px' 
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Processing': 'bg-blue-50 text-blue-700 border-blue-200',
      'Shipped': 'bg-purple-50 text-purple-700 border-purple-200',
      'Delivered': 'bg-green-50 text-green-700 border-green-200',
      'Cancelled': 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Pending': '⏳',
      'Processing': '📦',
      'Shipped': '🚚',
      'Delivered': '✅',
      'Cancelled': '❌'
    };
    return icons[status] || '📋';
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
          </div>
        </div>
        <p className="mt-6 text-sm font-semibold text-gray-600">Loading your orders...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to view your order history</p>
          <Link
            href="/login?redirect=/account/orders"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all"
          >
            Sign In
            <svg className="w-5 h-5" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-16">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-4">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Order History
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2">
                My Orders
              </h1>
              <p className="text-gray-600">
                Track and manage your orders
              </p>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>
          </div>

          {/* Filters */}
          {orders.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                    filter === status
                      ? 'bg-black text-white shadow-lg scale-105'
                      : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {status === 'all' ? 'All Orders' : status}
                  {status !== 'all' && orders.filter(o => o.status === status).length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-[10px]">
                      {orders.filter(o => o.status === status).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-black mb-2">No Orders Found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't placed any orders yet"
                : `No orders with status: ${filter}`
              }
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all"
            >
              Start Shopping
              <svg className="w-5 h-5" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-black hover:shadow-xl transition-all duration-300"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeIn 0.5s ease-out forwards'
                }}
              >
                {/* Order Header */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg text-sm font-bold">
                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        #{order.orderId || order.id?.slice(0, 8)}
                      </span>

                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${getStatusColor(order.status)}`}>
                        <span>{getStatusIcon(order.status)}</span>
                        {order.status || 'Pending'}
                      </span>

                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {order.displayDate 
                          ? order.displayDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Recent'
                        }
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-600 mb-1">Total</p>
                        <p className="text-2xl font-black">৳{(order.totalAmount || 0).toLocaleString()}</p>
                      </div>

                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg 
                          className={`w-5 h-5 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`}
                          fill="none" 
                          strokeWidth="2.5" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Items - Expandable */}
                <div className={`transition-all duration-300 overflow-hidden ${
                  expandedOrder === order.id ? 'max-h-[2000px]' : 'max-h-0'
                }`}>
                  <div className="p-6 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider mb-4">
                      Order Items ({order.items?.length || 0})
                    </h3>

                    {order.items?.map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex gap-4 flex-1">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                            {item.imageUrl || item.image ? (
                              <Image
                                src={item.imageUrl || item.image}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <h4 className="font-bold text-sm mb-1">{item.name || item.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              {item.selectedSize && (
                                <span className="px-2 py-0.5 bg-white rounded">
                                  Size: {item.selectedSize}
                                </span>
                              )}
                              <span>Qty: {item.quantity}</span>
                              <span>•</span>
                              <span className="font-semibold">৳{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Review Button */}
                        {order.status === 'Delivered' && (
                          <div className="flex items-center">
                            {item.reviewed ? (
                              <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Reviewed
                              </span>
                            ) : (
                              <button
                                onClick={() => setSelectedReviewItem({ orderId: order.id, item })}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-900 transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Write Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Order Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                      <Link
                        href={`/order-confirmation/${order.orderId || order.id}`}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-xl font-bold text-sm hover:border-black transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </Link>

                      <button
                        onClick={() => generateInvoice(order)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReviewItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            <ReviewForm
              item={selectedReviewItem.item}
              orderId={selectedReviewItem.orderId}
              user={user}
              onClose={() => setSelectedReviewItem(null)}
              onSuccess={handleReviewSuccess}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}