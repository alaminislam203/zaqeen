'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { FaCheck, FaCreditCard, FaMapMarkerAlt } from 'react-icons/fa';

const districts = [
  'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur', 
  'Chapainawabganj', 'Chattogram', 'Chuadanga', 'Cumilla', 'Cox\'s Bazar', 'Dinajpur', 'Faridpur', 
  'Feni', 'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 'Jamalpur', 'Jashore', 'Jhalokati', 
  'Jhenaidah', 'Joypurhat', 'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia', 
  'Lakshmipur', 'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur', 'Moulvibazar', 
  'Munshiganj', 'Mymensingh', 'Naogaon', 'Narail', 'Narayanganj', 'Narsingdi', 'Natore', 
  'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh', 'Patuakhali', 'Pirojpur', 
  'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur', 'Satkhira', 'Shariatpur', 'Sherpur', 
  'Sirajganj', 'Sunamganj', 'Sylhet', 'Tangail', 'Thakurgaon'
];

export default function CheckoutPage() {
  const { cart, dispatch, isHydrated, totalPrice } = useCart();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({ 
    name: '', 
    address: '', 
    phone: '', 
    city: 'Dhaka',
    email: '',
    note: ''
  });
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [siteSettings, setSiteSettings] = useState({
    maintenanceMode: false,
    shippingFee: 60,
    outsideShippingFee: 120,
    shippingFeeDhaka: 60,
    shippingFeeOutside: 120,
    freeShippingThreshold: 2000,
    bkashNumber: '01761049936',
    nagadNumber: '01761049936',
    enableBkash: true,
    enableNagad: true,
    enableCod: true,
    currency: 'BDT',
    taxRate: 0,
    allowGuestCheckout: true,
    requireEmailVerification: false,
    maxOrderQuantity: 10,
    lowStockThreshold: 5
  });

  // Authentication
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push('/login?redirect=/checkout');
      } else {
        setUser(currentUser);
        setDeliveryInfo(prev => ({
          ...prev,
          email: currentUser.email || ''
        }));
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  // Fetch site settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site_config"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSiteSettings({
          maintenanceMode: data.maintenanceMode || false,
          shippingFee: Number(data.shippingFee) || 60,
          outsideShippingFee: Number(data.outsideShippingFee) || 120,
          shippingFeeDhaka: Number(data.shippingFee) || 60,
          shippingFeeOutside: Number(data.outsideShippingFee) || 120,
          bkashNumber: data.bkashNumber || '01761049936',
          nagadNumber: data.nagadNumber || '01761049936',
          enableBkash: data.enableBkash !== undefined ? data.enableBkash : true,
          enableNagad: data.enableNagad !== undefined ? data.enableNagad : true,
          enableCod: data.enableCod !== undefined ? data.enableCod : true,
          currency: data.currency || 'BDT',
          taxRate: Number(data.taxRate) || 0,
          allowGuestCheckout: data.allowGuestCheckout !== undefined ? data.allowGuestCheckout : true,
          requireEmailVerification: data.requireEmailVerification || false,
          maxOrderQuantity: Number(data.maxOrderQuantity) || 10,
          lowStockThreshold: Number(data.lowStockThreshold) || 5
        });
      }
    });
    return () => unsub();
  }, []);

  // COD availability check
  useEffect(() => {
    if (deliveryInfo.city !== 'Lakshmipur' && paymentMethod === 'cod') {
      setPaymentMethod('bkash');
    }
  }, [deliveryInfo.city, paymentMethod]);

  // Shipping fee calculation
  const getShippingFee = (subtotal, city) => {
    if (subtotal >= 5000) return 0; // Free shipping for orders 5000+ taka
    if (city === 'Dhaka') return siteSettings.shippingFeeDhaka;
    if (city === 'Lakshmipur') return 50;
    return siteSettings.shippingFeeOutside;
  };

  const subtotal = totalPrice;
  const currentShippingFee = getShippingFee(subtotal, deliveryInfo.city);
  const total = subtotal - discount + currentShippingFee;

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!deliveryInfo.name.trim()) errors.name = 'Name is required';
    if (!deliveryInfo.phone.trim()) errors.phone = 'Phone is required';
    else if (deliveryInfo.phone.length < 11) errors.phone = 'Invalid phone number';
    if (!deliveryInfo.address.trim()) errors.address = 'Address is required';
    if (!deliveryInfo.email.trim()) errors.email = 'Email is required';
    
    if (paymentMethod !== 'cod' && (!transactionId || transactionId.length < 8)) {
      errors.transactionId = 'Valid transaction ID required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setIsApplying(true);
    setCouponError('');

    try {
      const q = query(
        collection(db, "coupons"), 
        where("code", "==", couponCode.toUpperCase().trim())
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setCouponError("Invalid coupon code");
        setDiscount(0);
        setAppliedCoupon(null);
      } else {
        const couponData = querySnapshot.docs[0].data();
        const now = new Date();
        const expiryDate = couponData.expiryDate?.toDate 
          ? couponData.expiryDate.toDate() 
          : new Date(couponData.expiryDate);

        if (!couponData.active) {
          setCouponError("Coupon is inactive");
          setDiscount(0);
          setAppliedCoupon(null);
        } else if (expiryDate && expiryDate < now) {
          setCouponError("Coupon has expired");
          setDiscount(0);
          setAppliedCoupon(null);
        } else if (subtotal < (couponData.minSpend || 0)) {
          setCouponError(`Minimum spend of ৳${couponData.minSpend} required`);
          setDiscount(0);
          setAppliedCoupon(null);
        } else {
          const calcDiscount = couponData.type === 'percentage' 
            ? (subtotal * couponData.value) / 100 
            : couponData.value;
          
          setDiscount(calcDiscount);
          setAppliedCoupon(couponData);
          toast.success('Coupon applied successfully!', { icon: <FaCheck /> });
        }
      }
    } catch (err) {
      console.error('Coupon error:', err);
      setCouponError("Failed to apply coupon");
      setDiscount(0);
      setAppliedCoupon(null);
    } finally {
      setIsApplying(false);
    }
  };

  // Remove coupon
  const removeCoupon = () => {
    setCouponCode('');
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponError('');
    toast.success('Coupon removed');
  };

  // Place order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setOrderProcessing(true);
    const orderToast = toast.loading('Processing your order...');

    try {
      const customOrderId = `ZQ${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
      
      const orderData = {
        orderId: customOrderId,
        userId: user.uid,
        userEmail: user.email,
        items: cart,
        subtotal,
        discount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        shippingFee: currentShippingFee,
        totalAmount: total,
        deliveryInfo,
        paymentInfo: {
          method: paymentMethod,
          transactionId: paymentMethod === 'cod' ? 'CASH_ON_DELIVERY' : transactionId,
          status: paymentMethod === 'cod' ? 'Pending' : 'Pending Verification'
        },
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'orders', customOrderId), orderData);
      
      dispatch({ type: 'CLEAR_CART' });
      
      toast.success('Order placed successfully!', { id: orderToast });
      router.push(`/order-confirmation/${customOrderId}`);
      
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.', { id: orderToast });
    } finally {
      setOrderProcessing(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (authLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Your Cart is Empty</h2>
          <p className="text-gray-600">Add some products to proceed to checkout</p>
          <button
            onClick={() => router.push('/shop')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all"
          >
            Continue Shopping
            <svg className="w-5 h-5" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Delivery Info', icon: <FaMapMarkerAlt /> },
    { number: 2, title: 'Review', icon: <FaCheck /> },
    { number: 3, title: 'Payment', icon: <FaCreditCard /> }
  ];

  const canProceedToReview = () => {
    const errors = {};
    if (!deliveryInfo.name.trim()) errors.name = 'Name is required';
    if (!deliveryInfo.phone.trim()) errors.phone = 'Phone is required';
    else if (deliveryInfo.phone.length < 11) errors.phone = 'Invalid phone number';
    if (!deliveryInfo.address.trim()) errors.address = 'Address is required';
    if (!deliveryInfo.email.trim()) errors.email = 'Email is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!canProceedToReview()) {
        toast.error('Please fill in all required delivery information');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(3, prev + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-16">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2">
                Checkout
              </h1>
              <p className="text-gray-600">Complete your purchase securely</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                Secure Checkout
              </span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between max-w-2xl mx-auto mb-12">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (step.number < currentStep) setCurrentStep(step.number);
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                    currentStep >= step.number
                      ? 'bg-black text-white scale-110 shadow-lg'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                  >
                    {step.icon}
                  </button>
                  <span className={`text-xs font-semibold mt-2 uppercase tracking-wider ${
                    currentStep >= step.number ? 'text-black' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 transition-all ${
                    currentStep > step.number ? 'bg-black' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Delivery Information */}
              {currentStep === 1 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    Delivery Information
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={deliveryInfo.name}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, name: e.target.value})}
                      className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                        formErrors.name ? 'border-red-500' : 'border-gray-200 focus:border-black'
                      }`}
                      placeholder="John Doe"
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={deliveryInfo.phone}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})}
                      className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                        formErrors.phone ? 'border-red-500' : 'border-gray-200 focus:border-black'
                      }`}
                      placeholder="01XXXXXXXXX"
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={deliveryInfo.email}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, email: e.target.value})}
                      className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                        formErrors.email ? 'border-red-500' : 'border-gray-200 focus:border-black'
                      }`}
                      placeholder="john@example.com"
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      City/District *
                    </label>
                    <select
                      value={deliveryInfo.city}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, city: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-black transition-all bg-white"
                    >
                      <option value="Dhaka">Dhaka</option>
                      <option value="Lakshmipur">Lakshmipur</option>
                      {districts.sort().filter(d => d !== 'Dhaka' && d !== 'Lakshmipur').map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Complete Address *
                    </label>
                    <textarea
                      value={deliveryInfo.address}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                      rows="3"
                      className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all resize-none ${
                        formErrors.address ? 'border-red-500' : 'border-gray-200 focus:border-black'
                      }`}
                      placeholder="House/Flat No, Road, Area..."
                    ></textarea>
                    {formErrors.address && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.address}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Add Note (Optional)
                    </label>
                    <textarea
                      value={deliveryInfo.note}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, note: e.target.value})}
                      rows="2"
                      className="w-full px-4 py-3 border-2 rounded-xl outline-none transition-all resize-none border-gray-200 focus:border-black"
                      placeholder="Any special instructions..."
                    ></textarea>
                  </div>
                </div>
              </div>
              )}

              {/* Review */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                        2
                      </div>
                      <h2 className="text-xl font-black uppercase tracking-tight">
                        Review Details
                      </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Full Name</p>
                        <p className="font-bold text-gray-900">{deliveryInfo.name || '-'}</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <p className="font-bold text-gray-900">{deliveryInfo.phone || '-'}</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="font-bold text-gray-900">{deliveryInfo.email || '-'}</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">City/District</p>
                        <p className="font-bold text-gray-900">{deliveryInfo.city || '-'}</p>
                      </div>
                      <div className="md:col-span-2 p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Address</p>
                        <p className="font-bold text-gray-900">{deliveryInfo.address || '-'}</p>
                      </div>
                      <div className="md:col-span-2 p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">Note</p>
                        <p className="font-bold text-gray-900">{deliveryInfo.note || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
                    <h3 className="text-lg font-black uppercase tracking-tight mb-6">
                      Order Items ({cart.length})
                    </h3>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id + (item.selectedSize || '')} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            <Image
                              src={item.imageUrl || item.image || '/placeholder.png'}
                              alt={item.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{item.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                              {item.selectedSize && (
                                <span className="px-2 py-0.5 bg-gray-100 rounded">
                                  Size: {item.selectedSize}
                                </span>
                              )}
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">৳{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              {currentStep === 3 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    Payment Method
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {siteSettings.enableBkash && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bkash')}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        paymentMethod === 'bkash'
                          ? 'border-pink-600 bg-pink-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-pink-600">bKash</span>
                        {paymentMethod === 'bkash' && (
                          <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )}

                  {siteSettings.enableNagad && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('nagad')}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        paymentMethod === 'nagad'
                          ? 'border-orange-600 bg-orange-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-orange-600">Nagad</span>
                        {paymentMethod === 'nagad' && (
                          <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )}

                  {siteSettings.enableCod && deliveryInfo.city === 'Lakshmipur' && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`md:col-span-2 p-6 rounded-xl border-2 transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-black bg-gray-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg className="w-6 h-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-lg font-black">Cash on Delivery</span>
                        </div>
                        {paymentMethod === 'cod' && (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-2 text-left">
                        Available only for Lakshmipur
                      </p>
                    </button>
                  )}
                </div>

                {/* Payment Instructions */}
                {paymentMethod !== 'cod' && (
                  <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4">
                      Payment Instruction (Send Money)
                    </h3>
                    <div className="text-xs text-gray-700 space-y-3 leading-6">
                      <div className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" fill="none" strokeWidth="2.2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">প্রিয় ক্রেতা,</p>
                          <p>আমাদের শপ থেকে অর্ডার করার জন্য আন্তরিক ধন্যবাদ! আপনার অর্ডার কনফার্ম করতে নিচের ধাপগুলো মনোযোগ সহকারে অনুসরণ করুন।</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                        <div className="flex items-center gap-2 mb-3 text-amber-900 font-bold uppercase tracking-wider text-[10px]">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                          </svg>
                          পেমেন্ট করার ধাপসমূহ
                        </div>
                        <div className="space-y-2">
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-600">•</span>
                            {paymentMethod === 'nagad'
                              ? 'নগদ অ্যাপ অথবা USSD কোড (*167#) ব্যবহার করে "Send Money" অপশনটি সিলেক্ট করুন।'
                              : 'bKash অ্যাপ অথবা USSD কোড (*247#) ব্যবহার করে "Send Money" অপশনটি সিলেক্ট করুন।'}
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-600">•</span>
                            পারসোনাল নাম্বার লিখুন: <span className="font-bold text-gray-900">01761049936</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-600">•</span>
                            Amount লিখুন: আপনার অর্ডারের মোট টাকা।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-600">•</span>
                            Reference ঘরে লিখুন: আপনার পূর্ণ নাম (অর্ডারের সাথে মিল রাখতে হবে)।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-600">•</span>
                            Counter Number: প্রয়োজন নেই, ফাঁকা রাখুন।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-600">•</span>
                            পেমেন্ট সম্পন্ন করুন এবং Transaction ID (TrxID) সংরক্ষণ করুন।
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                        <div className="flex items-center gap-2 mb-3 text-blue-900 font-bold uppercase tracking-wider text-[10px]">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          পেমেন্টের পর করণীয়
                        </div>
                        <div className="space-y-2">
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-blue-600">•</span>
                            পেমেন্ট সম্পন্ন করার পর আমাদেরকে আপনার TrxID (Transaction ID) পাঠান।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-blue-600">•</span>
                            অবশ্যই সঠিক TrxID প্রদান করবেন। ভুল TrxID দিলে আপনার পেমেন্ট ভেরিফাই হবে না।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-blue-600">•</span>
                            ভুল তথ্য প্রদানের কারণে কোনো সমস্যার জন্য আমাদের শপ দায়ী থাকবে না।
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                        <div className="flex items-center gap-2 mb-3 text-emerald-900 font-bold uppercase tracking-wider text-[10px]">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          গুরুত্বপূর্ণ নির্দেশনা
                        </div>
                        <div className="space-y-2">
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-emerald-600">•</span>
                            Reference ঘরে অবশ্যই আপনার নাম লিখতে হবে।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-emerald-600">•</span>
                            TrxID সঠিকভাবে লিখে পাঠানো অত্যন্ত জরুরি।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-emerald-600">•</span>
                            পেমেন্ট ভেরিফাই হওয়ার পর আপনার অর্ডার কনফার্ম করা হবে।
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Send payment to</p>
                        <p className="text-lg font-black">
                          {paymentMethod === 'bkash' ? siteSettings.bkashNumber : siteSettings.nagadNumber}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentMethod === 'bkash' ? siteSettings.bkashNumber : siteSettings.nagadNumber)}
                        className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-blue-900 mb-1">
                            Amount to pay: ৳{total.toFixed(0)}
                          </p>
                          <p className="text-xs text-blue-800">
                            Send exact amount and enter transaction ID below
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Transaction ID *
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                          formErrors.transactionId ? 'border-red-500' : 'border-gray-200 focus:border-black'
                        }`}
                        placeholder="Enter transaction ID"
                      />
                      {formErrors.transactionId && (
                        <p className="text-xs text-red-600 mt-1">{formErrors.transactionId}</p>
                      )}
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4">
                      📌 Cash on Delivery (COD) Payment Instruction
                    </h3>
                    <div className="text-xs text-gray-700 space-y-3 leading-6">
                      <div className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" fill="none" strokeWidth="2.2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">প্রিয় ক্রেতা,</p>
                          <p>আমাদের শপ থেকে অর্ডার করার জন্য ধন্যবাদ! ক্যাশ অন ডেলিভারি সুবিধা নিতে চাইলে নিচের নির্দেশনাগুলো মনোযোগ সহকারে পড়ুন।</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                        <div className="flex items-center gap-2 mb-3 text-amber-900 font-bold uppercase tracking-wider text-[10px]">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                          </svg>
                          ক্যাশ অন ডেলিভারি শর্তাবলী
                        </div>
                        <div className="space-y-2">
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-600">•</span>
                            ক্যাশ অন ডেলিভারি শুধুমাত্র নির্দিষ্ট কিছু অর্ডারের জন্য প্রযোজ্য।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-600">•</span>
                            আপনার অর্ডার কনফার্ম করতে অবশ্যই ফুল পেমেন্ট অগ্রিম করতে হবে।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-600">•</span>
                            ফুল পেমেন্ট সম্পন্ন না হলে কোনো অর্ডার কনফার্ম হবে না।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-600">•</span>
                            পেমেন্ট সম্পন্ন করার পর আমাদেরকে আপনার Transaction ID (TrxID) অথবা পেমেন্ট কনফার্মেশন তথ্য পাঠাতে হবে।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-600">•</span>
                            সঠিক তথ্য প্রদান না করলে আপনার অর্ডার ভেরিফাই হবে না।
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                        <div className="flex items-center gap-2 mb-3 text-emerald-900 font-bold uppercase tracking-wider text-[10px]">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          গুরুত্বপূর্ণ নির্দেশনা
                        </div>
                        <div className="space-y-2">
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-emerald-600">•</span>
                            ফুল পেমেন্ট ছাড়া কোনো অর্ডার গ্রহণযোগ্য নয়।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-emerald-600">•</span>
                            পেমেন্ট ভেরিফাই হওয়ার পরই আপনার অর্ডার কনফার্ম হবে।
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="mt-0.5 text-emerald-600">•</span>
                            ভুল তথ্য প্রদানের কারণে কোনো সমস্যার জন্য আমাদের শপ দায়ী থাকবে না।
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={orderProcessing}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg group"
                >
                  {orderProcessing ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              )}

              {/* Step Navigation */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-sm hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={currentStep === 3}
                  className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                >
                  {currentStep === 1 ? 'Review Order' : currentStep === 2 ? 'Proceed to Payment' : 'Next'}
                </button>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            {currentStep === 2 && (
              <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
                <h3 className="text-xl font-black uppercase tracking-tight mb-6 pb-4 border-b-2 border-gray-200">
                  Order Summary
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-bold">৳{subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping Fee</span>
                    <span className="font-bold">৳{currentShippingFee}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-2">
                        Discount
                        <button
                          type="button"
                          onClick={removeCoupon}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          (Remove)
                        </button>
                      </span>
                      <span className="font-bold">-৳{discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-bold uppercase">Total</span>
                      <span className="text-3xl font-black">৳{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Coupon Code */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl outline-none focus:border-black transition-all text-sm"
                      placeholder="COUPON"
                      disabled={appliedCoupon !== null}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplying || appliedCoupon !== null}
                      className="px-4 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                    >
                      {isApplying ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-600 mt-2">{couponError}</p>
                  )}
                </div>

                {/* Next Button */}
                

                {/* Trust Indicators */}
                <div className="mt-6 space-y-3 pt-6 border-t border-gray-200">
                  {[
                    { icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>, text: 'Secure Payment' },
                    { icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" /></svg>, text: 'Fast Delivery' },
                    { icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>, text: 'Easy Returns' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs text-gray-600">
                      <div className="text-green-600">{item.icon}</div>
                      <span className="font-semibold">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
