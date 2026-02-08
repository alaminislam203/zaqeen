'use client';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [searching, setSearching] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [notFound, setNotFound] = useState(false);

    const handleTrackOrder = async (e) => {
        e.preventDefault();
        
        if (!orderId.trim() || !email.trim()) {
            toast.error('Please enter both Order ID and Email', {
                style: { borderRadius: '0px', background: '#ef4444', color: '#fff', fontSize: '10px' }
            });
            return;
        }

        setSearching(true);
        setNotFound(false);
        setOrderData(null);
        const loadingToast = toast.loading('Searching for your order...');

        try {
            const ordersRef = collection(db, 'orders');
            const q = query(
                ordersRef,
                where('orderId', '==', orderId.toUpperCase().trim())
            );
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                setNotFound(true);
                toast.error('Order not found. Please check your Order ID.', { id: loadingToast });
            } else {
                const orderDoc = querySnapshot.docs[0];
                const data = { id: orderDoc.id, ...orderDoc.data() };
                
                // Verify email matches
                if (data.deliveryInfo?.email?.toLowerCase() !== email.toLowerCase().trim()) {
                    setNotFound(true);
                    toast.error('Email does not match our records.', { id: loadingToast });
                } else {
                    setOrderData(data);
                    toast.success('Order found!', { 
                        id: loadingToast,
                        style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
                    });
                }
            }
        } catch (error) {
            console.error('Error tracking order:', error);
            toast.error('Failed to track order. Please try again.', { id: loadingToast });
        } finally {
            setSearching(false);
        }
    };

    const getStatusStep = (status) => {
        const steps = {
            'Pending': 1,
            'Processing': 2,
            'Shipped': 3,
            'Delivered': 4,
            'Cancelled': 0,
            'Returned': 0
        };
        return steps[status] || 1;
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'text-amber-600 bg-amber-50 border-amber-200',
            'Processing': 'text-blue-600 bg-blue-50 border-blue-200',
            'Shipped': 'text-purple-600 bg-purple-50 border-purple-200',
            'Delivered': 'text-green-600 bg-green-50 border-green-200',
            'Cancelled': 'text-red-600 bg-red-50 border-red-200',
            'Returned': 'text-gray-600 bg-gray-50 border-gray-200'
        };
        return colors[status] || colors.Pending;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const trackingSteps = [
        { 
            id: 1, 
            label: 'Order Placed', 
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            description: 'Your order has been confirmed'
        },
        { 
            id: 2, 
            label: 'Processing', 
            icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
            description: 'We are preparing your items'
        },
        { 
            id: 3, 
            label: 'Shipped', 
            icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
            description: 'Your order is on the way'
        },
        { 
            id: 4, 
            label: 'Delivered', 
            icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            description: 'Order has been delivered'
        }
    ];

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 md:py-20 px-4 md:px-8 selection:bg-black selection:text-white">
            <div className="max-w-4xl mx-auto">
                
                {/* Header */}
                <header className="mb-12 text-center">
                    <div className="inline-block mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-black to-neutral-800 text-white flex items-center justify-center mx-auto shadow-xl">
                            <svg className="w-10 h-10" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-3">Track Order</h1>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 font-bold">
                        Enter your order details to track your shipment
                    </p>
                </header>

                {/* Search Form */}
                {!orderData && (
                    <div className="bg-white border border-gray-200 p-8 md:p-12 shadow-lg mb-8">
                        <form onSubmit={handleTrackOrder} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                    </svg>
                                    Order ID
                                </label>
                                <input
                                    type="text"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    placeholder="e.g. ORD-12345678"
                                    className="w-full px-4 py-4 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-[11px] font-bold uppercase tracking-wide"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your.email@example.com"
                                    className="w-full px-4 py-4 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-[11px] font-bold lowercase"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={searching}
                                className="group relative w-full bg-black text-white py-5 text-[11px] font-black uppercase tracking-wider overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {searching ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                            </svg>
                                            Track Order
                                        </>
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            </button>
                        </form>

                        {notFound && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wide text-red-600 mb-1">Order Not Found</p>
                                    <p className="text-[9px] text-red-600 leading-relaxed">
                                        Please check your Order ID and Email address. Make sure they match exactly as provided in your confirmation email.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Order Details */}
                {orderData && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Order Header */}
                        <div className="bg-white border border-gray-200 p-8 shadow-lg">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6 pb-6 border-b border-gray-100">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-wide text-gray-400 mb-2">Order Number</p>
                                    <h2 className="text-2xl font-black uppercase tracking-wide">#{orderData.orderId}</h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider border ${getStatusColor(orderData.status)}`}>
                                        {orderData.status}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setOrderData(null);
                                            setOrderId('');
                                            setEmail('');
                                            setNotFound(false);
                                        }}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 text-[9px] font-black uppercase tracking-wide hover:bg-gray-200 transition-all"
                                    >
                                        New Search
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px]">
                                <div>
                                    <p className="font-black uppercase tracking-wide text-gray-400 mb-2">Order Date</p>
                                    <p className="font-bold">{formatDate(orderData.timestamp || orderData.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="font-black uppercase tracking-wide text-gray-400 mb-2">Total Amount</p>
                                    <p className="text-lg font-black">৳{(orderData.totalAmount || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="font-black uppercase tracking-wide text-gray-400 mb-2">Payment Method</p>
                                    <p className="font-bold uppercase">{orderData.paymentInfo?.method || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tracking Progress */}
                        {orderData.status !== 'Cancelled' && orderData.status !== 'Returned' && (
                            <div className="bg-white border border-gray-200 p-8 shadow-lg">
                                <h3 className="text-[11px] font-black uppercase tracking-wide mb-8">Order Progress</h3>
                                
                                <div className="relative">
                                    {/* Progress Line */}
                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                                    <div 
                                        className="absolute left-6 top-0 w-0.5 bg-black transition-all duration-1000"
                                        style={{ height: `${((getStatusStep(orderData.status) - 1) / 3) * 100}%` }}
                                    ></div>

                                    <div className="space-y-8 relative">
                                        {trackingSteps.map((step) => {
                                            const isCompleted = getStatusStep(orderData.status) >= step.id;
                                            const isCurrent = getStatusStep(orderData.status) === step.id;

                                            return (
                                                <div key={step.id} className="flex items-start gap-6">
                                                    <div className={`relative z-10 w-12 h-12 flex items-center justify-center transition-all duration-500 ${
                                                        isCompleted 
                                                            ? 'bg-black text-white' 
                                                            : 'bg-white border-2 border-gray-200 text-gray-400'
                                                    }`}>
                                                        <svg className="w-6 h-6" fill={isCompleted ? "currentColor" : "none"} strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                                                        </svg>
                                                        {isCurrent && (
                                                            <div className="absolute inset-0 animate-ping bg-black opacity-20"></div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 pt-2">
                                                        <h4 className={`text-[11px] font-black uppercase tracking-wide mb-1 ${
                                                            isCompleted ? 'text-black' : 'text-gray-400'
                                                        }`}>
                                                            {step.label}
                                                        </h4>
                                                        <p className="text-[9px] text-gray-500">{step.description}</p>
                                                        {isCurrent && (
                                                            <span className="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-wide">
                                                                Current Status
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Order Items */}
                        <div className="bg-white border border-gray-200 p-8 shadow-lg">
                            <h3 className="text-[11px] font-black uppercase tracking-wide mb-6">Order Items</h3>
                            <div className="space-y-4">
                                {orderData.items?.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-100 hover:border-gray-300 transition-all">
                                        <div className="w-16 h-16 bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <svg className="w-8 h-8 text-gray-300" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black uppercase tracking-wide truncate">{item.name}</p>
                                            <p className="text-[9px] text-gray-500 mt-1">
                                                Qty: {item.quantity} × ৳{item.price?.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black">৳{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Total */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <p className="text-[11px] font-black uppercase tracking-wide">Total</p>
                                    <p className="text-2xl font-black">৳{(orderData.totalAmount || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Information */}
                        <div className="bg-white border border-gray-200 p-8 shadow-lg">
                            <h3 className="text-[11px] font-black uppercase tracking-wide mb-6">Delivery Information</h3>
                            <div className="space-y-4 text-[10px]">
                                <div>
                                    <p className="font-black uppercase tracking-wide text-gray-400 mb-1">Recipient</p>
                                    <p className="font-bold">{orderData.deliveryInfo?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="font-black uppercase tracking-wide text-gray-400 mb-1">Phone</p>
                                    <p className="font-bold">{orderData.deliveryInfo?.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="font-black uppercase tracking-wide text-gray-400 mb-1">Delivery Address</p>
                                    <p className="font-bold leading-relaxed">
                                        {orderData.deliveryInfo?.address || 'N/A'}<br />
                                        {orderData.deliveryInfo?.city && `${orderData.deliveryInfo.city}, `}
                                        {orderData.deliveryInfo?.postalCode || ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Help Section */}
                        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-8 text-center">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                            </svg>
                            <h4 className="text-[11px] font-black uppercase tracking-wide mb-2">Need Help?</h4>
                            <p className="text-[9px] text-gray-600 mb-4 max-w-md mx-auto">
                                If you have any questions about your order, please contact our customer support team.
                            </p>
                            <a 
                                href="/contact" 
                                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-[9px] font-black uppercase tracking-wide hover:bg-neutral-800 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                                Contact Support
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}