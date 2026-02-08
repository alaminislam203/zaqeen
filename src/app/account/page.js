'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { generateInvoice } from '@/lib/generateInvoice';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      const ordersQuery = query(
        collection(db, 'orders'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const userOrders = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setOrders(userOrders);
        setLoading(false);
      });
      
      return () => unsubscribeOrders();
    }
  }, [user]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Order ID copied to clipboard!", {
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
      'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Processing': 'bg-blue-100 text-blue-700 border-blue-200',
      'Shipped': 'bg-purple-100 text-purple-700 border-purple-200',
      'Delivered': 'bg-green-100 text-green-700 border-green-200',
      'Cancelled': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <p className="mt-6 text-sm font-semibold text-gray-600">Loading your account...</p>
      </div>
    );
  }

  const totalSpent = orders.reduce((acc, order) => 
    acc + (order.totalAmount || 0), 0);
  
  const completedOrders = orders.filter(o => o.status === 'Delivered').length;
  
  const loyaltyTier = totalSpent >= 50000 
    ? 'Platinum' 
    : totalSpent >= 20000 
    ? 'Gold' 
    : totalSpent >= 5000 
    ? 'Silver' 
    : 'Bronze';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-16">
        
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-full mb-4">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                  Member Dashboard
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2">
                Welcome Back, {userData?.name?.split(' ')[0] || 'Member'}!
              </h1>
              <p className="text-gray-600">
                Manage your orders and account settings
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-black to-gray-800 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                {userData?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-bold">{userData?.name || 'User'}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-black hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                loyaltyTier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                loyaltyTier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                loyaltyTier === 'Silver' ? 'bg-gray-100 text-gray-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {loyaltyTier}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">Total Orders</p>
            <p className="text-3xl font-black">{orders.length}</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-black hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-2">Completed</p>
            <p className="text-3xl font-black">{completedOrders}</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-black hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-2">Total Spent</p>
            <p className="text-2xl font-black">৳{totalSpent.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-black to-gray-900 rounded-2xl p-6 text-white shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-sm text-white/70 mb-2">Loyalty Tier</p>
            <p className="text-2xl font-black">{loyaltyTier}</p>
          </div>
        </div>

        {/* Order Status Filter */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-black uppercase tracking-tight">
              Order History
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                    filter === status
                      ? 'bg-black text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                  {status !== 'all' && orders.filter(o => o.status === status).length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full">
                      {orders.filter(o => o.status === status).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-black mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
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
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-black hover:shadow-xl transition-all duration-300 group"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeIn 0.5s ease-out forwards'
                }}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Order Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => copyToClipboard(order.orderId || order.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-lg text-sm font-bold transition-all group/copy"
                        title="Click to copy"
                      >
                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        #{order.orderId || order.id?.slice(0, 8)}
                      </button>

                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${getStatusColor(order.status)}`}>
                        <span>{getStatusIcon(order.status)}</span>
                        {order.status || 'Pending'}
                      </span>

                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {order.createdAt?.toDate 
                          ? new Date(order.createdAt.toDate()).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Recent'
                        }
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl min-w-[200px]">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                            {item.imageUrl || item.image ? (
                              <Image
                                src={item.imageUrl || item.image}
                                alt={item.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg text-xs font-bold text-gray-600">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Order Total */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-600">Order Total:</span>
                      <span className="text-2xl font-black">৳{(order.totalAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-3 lg:min-w-[200px] border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6">
                    <Link
                      href={`/order-confirmation/${order.orderId || order.id}`}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-xl font-bold text-sm hover:border-black transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </Link>

                    <button
                      onClick={() => generateInvoice(order)}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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