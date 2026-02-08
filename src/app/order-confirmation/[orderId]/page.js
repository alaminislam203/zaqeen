'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { generateInvoice } from '@/lib/generateInvoice';
import Confetti from 'react-confetti';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supportNumber, setSupportNumber] = useState('88017XXXXXXXX');
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });

      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    const unsubSettings = onSnapshot(doc(db, "settings", "site_config"), (doc) => {
      if (doc.exists()) {
        setSupportNumber(doc.data().supportPhone || '88017XXXXXXXX');
      }
    });

    return () => unsubSettings();
  }, [orderId, router]);

  const whatsappLink = order 
    ? `https://wa.me/${supportNumber.replace(/[^0-9]/g, '')}?text=Hello! I placed an order. Order ID: ${order.orderId}` 
    : '#';

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'Processing': 'text-blue-600 bg-blue-50 border-blue-200',
      'Shipped': 'text-purple-600 bg-purple-50 border-purple-200',
      'Delivered': 'text-green-600 bg-green-50 border-green-200',
      'Cancelled': 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <p className="mt-6 text-sm font-semibold text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black">{error}</h2>
          <p className="text-gray-600">The order you're looking for doesn't exist or has been removed.</p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/shop"
              className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all"
            >
              Continue Shopping
            </Link>
            <Link 
              href="/account/orders"
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:border-black transition-all"
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Confetti Effect */}
      {showConfetti && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-20">
        
        {/* Success Animation Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden mb-8 animate-in zoom-in-95 duration-700">
          
          {/* Header Section */}
          <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8 md:p-12 text-center overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              {/* Success Icon */}
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-2xl animate-in zoom-in duration-500">
                <svg className="w-12 h-12 text-white" fill="none" strokeWidth="3" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-green-200 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                    Order Confirmed
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
                  Thank You for Your Order!
                </h1>
                
                <p className="text-gray-700 max-w-md mx-auto leading-relaxed">
                  Your order has been successfully placed. We've sent a confirmation email to{' '}
                  <span className="font-semibold">{order.userEmail}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="p-8 md:p-12 space-y-8">
            
            {/* Order Info Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center md:text-left p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Order Number
                </p>
                <p className="text-xl font-black">#{order.orderId}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.orderId);
                    alert('Order ID copied!');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-2 font-semibold"
                >
                  Copy ID
                </button>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Order Date
                </p>
                <p className="text-lg font-bold">
                  {order.createdAt?.toDate 
                    ? new Date(order.createdAt.toDate()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Just now'
                  }
                </p>
              </div>

              <div className="text-center md:text-right p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Order Status
                </p>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border-2 ${getStatusColor(order.status)}`}>
                  <span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>
                  {order.status || 'Pending'}
                </span>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="border-2 border-gray-200 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Delivery Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Recipient</p>
                  <p className="font-bold">{order.deliveryInfo?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Phone</p>
                  <p className="font-bold">{order.deliveryInfo?.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-600 mb-1">Address</p>
                  <p className="font-bold">
                    {order.deliveryInfo?.address}, {order.deliveryInfo?.city}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-2 border-gray-200 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg font-black uppercase tracking-tight mb-6">
                Order Items ({order.items?.length || 0})
              </h3>
              
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
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
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                        {item.selectedSize && (
                          <span className="px-2 py-0.5 bg-white rounded">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">৳{(item.price * item.quantity).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">৳{item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-2 border-gray-200 rounded-2xl p-6 md:p-8 bg-gradient-to-br from-gray-50 to-white">
              <h3 className="text-lg font-black uppercase tracking-tight mb-6">
                Order Summary
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">৳{order.subtotal?.toLocaleString()}</span>
                </div>
                
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-৳{order.discount?.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Fee</span>
                  <span className="font-semibold">
                    {order.shippingFee === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `৳${order.shippingFee}`
                    )}
                  </span>
                </div>
                
                <div className="pt-4 border-t-2 border-gray-300">
                  <div className="flex justify-between items-baseline">
                    <span className="font-black uppercase">Total</span>
                    <span className="text-2xl font-black">৳{order.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mt-6 pt-6 border-t border-gray-300">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-bold uppercase">{order.paymentInfo?.method || 'N/A'}</span>
                </div>
                {order.paymentInfo?.transactionId && order.paymentInfo.transactionId !== 'CASH_ON_DELIVERY' && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {order.paymentInfo.transactionId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-blue-900 mb-3">What happens next?</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>We'll process your order within 24-48 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>You'll receive updates via email and SMS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Track your order in the "My Orders" section</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                onClick={() => order && generateInvoice(order)}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg group"
              >
                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Invoice
              </button>

              <Link
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contact Support
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/shop"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:border-black transition-all"
              >
                Continue Shopping
              </Link>
              
              <Link
                href="/account/orders"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:border-black transition-all"
              >
                View All Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}