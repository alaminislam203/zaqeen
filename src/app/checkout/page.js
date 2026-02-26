'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, onSnapshot, updateDoc, increment, runTransaction } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { FaCheck, FaCreditCard, FaMapMarkerAlt, FaShieldAlt, FaTruck, FaUndo, FaSpinner, FaLock, FaMobile, FaEnvelope, FaCopy, FaPhone } from 'react-icons/fa';
import ReCAPTCHA from "react-google-recaptcha";
import { useSession } from 'next-auth/react';
import { fingerprint } from '@fingerprintjs/fingerprintjs';

// Types
interface DeliveryInfo {
  name: string;
  address: string;
  phone: string;
  city: string;
  email: string;
  note: string;
}

interface SiteSettings {
  maintenanceMode: boolean;
  shippingFee: number;
  outsideShippingFee: number;
  shippingFeeDhaka: number;
  shippingFeeOutside: number;
  freeShippingThreshold: number;
  bkashNumber: string;
  nagadNumber: string;
  enableBkash: boolean;
  enableNagad: boolean;
  enableCod: boolean;
  currency: string;
  taxRate: number;
  allowGuestCheckout: boolean;
  requireEmailVerification: boolean;
  maxOrderQuantity: number;
  lowStockThreshold: number;
  maxOrdersPerDay: number;
  minOrderAmount: number;
  otpVerificationRequired: boolean;
}

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

// Custom Hooks
const useOrderValidation = () => {
  const validatePhone = (phone: string): boolean => {
    const bdPhoneRegex = /^(?:\+88|01)?\d{11}$/;
    return bdPhoneRegex.test(phone.replace(/[^0-9]/g, ''));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateAddress = (address: string): boolean => {
    const suspiciousKeywords = ['test', 'demo', 'fake', 'টেস্ট', 'ডেমো', 'ফেক'];
    return address.length > 10 && !suspiciousKeywords.some(keyword => 
      address.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  return { validatePhone, validateEmail, validateAddress };
};

const useOTP = () => {
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  const sendOTP = async (phone: string) => {
    try {
      setVerifying(true);
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();
      
      if (response.ok) {
        setOtpSent(true);
        toast.success('OTP sent to your phone');
        return true;
      } else {
        toast.error(data.message || 'Failed to send OTP');
        return false;
      }
    } catch (error) {
      toast.error('Failed to send OTP');
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const verifyOTP = async (phone: string, code: string) => {
    try {
      setVerifying(true);
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code })
      });

      const data = await response.json();
      
      if (response.ok) {
        setOtpVerified(true);
        toast.success('Phone verified successfully');
        return true;
      } else {
        toast.error(data.message || 'Invalid OTP');
        return false;
      }
    } catch (error) {
      toast.error('Verification failed');
      return false;
    } finally {
      setVerifying(false);
    }
  };

  return { otpSent, otpVerified, otp, setOtp, sendOTP, verifyOTP, verifying };
};

const useDeviceFingerprint = () => {
  const [fingerprintId, setFingerprintId] = useState<string | null>(null);

  useEffect(() => {
    const getFingerprint = async () => {
      try {
        const fp = await fingerprint.load();
        const result = await fp.get();
        setFingerprintId(result.visitorId);
      } catch (error) {
        console.error('Fingerprint error:', error);
      }
    };
    getFingerprint();
  }, []);

  return fingerprintId;
};

// Main Component
export default function CheckoutPage() {
  const { cart, dispatch, isHydrated, totalPrice } = useCart();
  const router = useRouter();
  const { data: session } = useSession();
  const { validatePhone, validateEmail, validateAddress } = useOrderValidation();
  const { otpSent, otpVerified, otp, setOtp, sendOTP, verifyOTP, verifying } = useOTP();
  const deviceFingerprint = useDeviceFingerprint();
  
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({ 
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
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [ipAddress, setIpAddress] = useState('');
  const [orderLimitExceeded, setOrderLimitExceeded] = useState(false);
  const [stockLocked, setStockLocked] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    coupon: false,
    order: false,
    payment: false,
    otp: false
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
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
    lowStockThreshold: 5,
    maxOrdersPerDay: 3,
    minOrderAmount: 50,
    otpVerificationRequired: true
  });

  // Get IP Address
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(err => console.error('IP fetch error:', err));
  }, []);

  // Authentication
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser && !siteSettings.allowGuestCheckout) {
        router.push('/login?redirect=/checkout');
      } else if (currentUser) {
        setUser(currentUser);
        setDeliveryInfo(prev => ({
          ...prev,
          email: currentUser.email || '',
          name: currentUser.displayName || prev.name
        }));
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router, siteSettings.allowGuestCheckout]);

  // Fetch site settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site_config"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSiteSettings(prev => ({
          ...prev,
          ...data,
          shippingFee: Number(data.shippingFee) || 60,
          outsideShippingFee: Number(data.outsideShippingFee) || 120,
          shippingFeeDhaka: Number(data.shippingFee) || 60,
          shippingFeeOutside: Number(data.outsideShippingFee) || 120,
          maxOrdersPerDay: Number(data.maxOrdersPerDay) || 3,
          minOrderAmount: Number(data.minOrderAmount) || 50
        }));
      }
    });
    return () => unsub();
  }, []);

  // Check order limits
  const checkOrderLimits = useCallback(async (userId: string, ip: string) => {
    if (!userId && !ip) return true;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    try {
      // Check by user ID
      if (userId) {
        const userOrdersQuery = query(
          collection(db, "orders"),
          where("userId", "==", userId),
          where("createdAt", ">=", oneDayAgo)
        );
        const userOrders = await getDocs(userOrdersQuery);
        if (userOrders.size >= siteSettings.maxOrdersPerDay) {
          return { allowed: false, reason: 'Daily order limit exceeded for this account' };
        }
      }
      
      // Check by IP
      if (ip) {
        const ipOrdersQuery = query(
          collection(db, "orders"),
          where("metadata.ipAddress", "==", ip),
          where("createdAt", ">=", oneDayAgo)
        );
        const ipOrders = await getDocs(ipOrdersQuery);
        if (ipOrders.size >= siteSettings.maxOrdersPerDay * 2) {
          return { allowed: false, reason: 'Too many orders from this location' };
        }
      }
      
      // Check by phone number
      if (deliveryInfo.phone) {
        const phoneOrdersQuery = query(
          collection(db, "orders"),
          where("deliveryInfo.phone", "==", deliveryInfo.phone),
          where("createdAt", ">=", oneDayAgo)
        );
        const phoneOrders = await getDocs(phoneOrdersQuery);
        if (phoneOrders.size >= siteSettings.maxOrdersPerDay) {
          return { allowed: false, reason: 'Daily order limit exceeded for this phone number' };
        }
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('Order limit check error:', error);
      return { allowed: true }; // Fail open in case of error
    }
  }, [deliveryInfo.phone, siteSettings.maxOrdersPerDay]);

  // Check blacklist
  const checkBlacklist = useCallback(async (phone: string, email: string, ip: string) => {
    try {
      const blacklistQuery = query(
        collection(db, "blacklist"),
        where("value", "in", [phone, email, ip].filter(Boolean))
      );
      
      const snapshot = await getDocs(blacklistQuery);
      return snapshot.empty;
    } catch (error) {
      console.error('Blacklist check error:', error);
      return true; // Fail open
    }
  }, []);

  // Stock locking
  const lockProductStock = useCallback(async (items: any[]) => {
    try {
      await runTransaction(db, async (transaction) => {
        for (const item of items) {
          const productRef = doc(db, "products", item.id);
          const productDoc = await transaction.get(productRef);
          
          if (!productDoc.exists()) {
            throw new Error(`Product ${item.id} not found`);
          }
          
          const productData = productDoc.data();
          if (productData.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }
          
          transaction.update(productRef, {
            stock: increment(-item.quantity),
            lockedStock: increment(item.quantity),
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
          });
        }
      });
      setStockLocked(true);
      return true;
    } catch (error) {
      console.error('Stock lock error:', error);
      toast.error(error.message || 'Failed to lock stock');
      return false;
    }
  }, []);

  // COD availability check
  useEffect(() => {
    if (deliveryInfo.city !== 'Lakshmipur' && paymentMethod === 'cod') {
      setPaymentMethod('bkash');
    }
  }, [deliveryInfo.city, paymentMethod]);

  // Shipping fee calculation
  const getShippingFee = useCallback((subtotal: number, city: string) => {
    if (subtotal >= siteSettings.freeShippingThreshold) return 0;
    if (city === 'Dhaka') return siteSettings.shippingFeeDhaka;
    if (city === 'Lakshmipur') return 50;
    return siteSettings.shippingFeeOutside;
  }, [siteSettings]);

  const subtotal = totalPrice;
  const currentShippingFee = getShippingFee(subtotal, deliveryInfo.city);
  const total = subtotal - discount + currentShippingFee;

  // Form validation
  const validateForm = useCallback(() => {
    const errors: any = {};
    
    if (!deliveryInfo.name.trim()) errors.name = 'Name is required';
    else if (deliveryInfo.name.length < 3) errors.name = 'Name must be at least 3 characters';
    
    if (!deliveryInfo.phone.trim()) errors.phone = 'Phone is required';
    else if (!validatePhone(deliveryInfo.phone)) errors.phone = 'Invalid Bangladeshi phone number';
    
    if (!deliveryInfo.email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(deliveryInfo.email)) errors.email = 'Invalid email format';
    
    if (!deliveryInfo.address.trim()) errors.address = 'Address is required';
    else if (!validateAddress(deliveryInfo.address)) errors.address = 'Please provide a valid address';
    
    if (siteSettings.otpVerificationRequired && !otpVerified) {
      errors.phone = 'Phone number must be verified';
    }
    
    if (paymentMethod !== 'cod') {
      if (!transactionId || transactionId.length < 8) {
        errors.transactionId = 'Valid transaction ID required (min 8 characters)';
      } else if (!/^[A-Za-z0-9]+$/.test(transactionId)) {
        errors.transactionId = 'Transaction ID can only contain letters and numbers';
      }
    }

    if (total < siteSettings.minOrderAmount) {
      errors.total = `Minimum order amount is ৳${siteSettings.minOrderAmount}`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [deliveryInfo, paymentMethod, transactionId, siteSettings, otpVerified, total, validatePhone, validateEmail, validateAddress]);

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setLoadingStates(prev => ({ ...prev, coupon: true }));
    setCouponError('');

    try {
      const q = query(
        collection(db, "coupons"), 
        where("code", "==", couponCode.toUpperCase().trim()),
        where("active", "==", true)
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

        if (expiryDate && expiryDate < now) {
          setCouponError("Coupon has expired");
          setDiscount(0);
          setAppliedCoupon(null);
        } else if (subtotal < (couponData.minSpend || 0)) {
          setCouponError(`Minimum spend of ৳${couponData.minSpend} required`);
          setDiscount(0);
          setAppliedCoupon(null);
        } else if (couponData.usageLimit && couponData.usedCount >= couponData.usageLimit) {
          setCouponError("Coupon usage limit exceeded");
          setDiscount(0);
          setAppliedCoupon(null);
        } else {
          const calcDiscount = couponData.type === 'percentage' 
            ? (subtotal * couponData.value) / 100 
            : couponData.value;
          
          setDiscount(Math.min(calcDiscount, subtotal * 0.5)); // Max 50% discount
          setAppliedCoupon(couponData);
          toast.success('Coupon applied successfully!');
        }
      }
    } catch (err) {
      console.error('Coupon error:', err);
      setCouponError("Failed to apply coupon");
      setDiscount(0);
      setAppliedCoupon(null);
    } finally {
      setLoadingStates(prev => ({ ...prev, coupon: false }));
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
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (siteSettings.maintenanceMode) {
      toast.error('Site is under maintenance. Please try again later.');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    if (!recaptchaToken) {
      toast.error('Please verify that you are human');
      return;
    }

    setOrderProcessing(true);
    const orderToast = toast.loading('Processing your order...');

    try {
      // Verify reCAPTCHA
      const recaptchaResponse = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recaptchaToken })
      });
      
      if (!recaptchaResponse.ok) {
        throw new Error('reCAPTCHA verification failed');
      }

      // Check blacklist
      const isNotBlacklisted = await checkBlacklist(
        deliveryInfo.phone,
        deliveryInfo.email,
        ipAddress
      );
      
      if (!isNotBlacklisted) {
        throw new Error('Your information is blacklisted. Please contact support.');
      }

      // Check order limits
      const limitCheck = await checkOrderLimits(user?.uid, ipAddress);
      if (!limitCheck.allowed) {
        setOrderLimitExceeded(true);
        throw new Error(limitCheck.reason);
      }

      // Lock stock
      const stockLocked = await lockProductStock(cart);
      if (!stockLocked) {
        throw new Error('Failed to lock stock. Please try again.');
      }

      // Create order
      const customOrderId = `ZQ${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
      
      const orderData = {
        orderId: customOrderId,
        userId: user?.uid || 'guest',
        userEmail: user?.email || deliveryInfo.email,
        items: cart.map(item => ({
          ...item,
          priceAtPurchase: item.price
        })),
        subtotal,
        discount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        shippingFee: currentShippingFee,
        totalAmount: total,
        deliveryInfo,
        paymentInfo: {
          method: paymentMethod,
          transactionId: paymentMethod === 'cod' ? 'CASH_ON_DELIVERY' : transactionId,
          status: paymentMethod === 'cod' ? 'Pending' : 'Pending Verification',
          verified: false
        },
        status: 'Pending',
        metadata: {
          ipAddress,
          userAgent: navigator.userAgent,
          deviceFingerprint: deviceFingerprint,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timestamp: serverTimestamp(),
          recaptchaScore: recaptchaResponse.score
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'orders', customOrderId), orderData);
      
      // Update coupon usage if applied
      if (appliedCoupon) {
        const couponRef = doc(db, "coupons", appliedCoupon.id);
        await updateDoc(couponRef, {
          usedCount: increment(1)
        });
      }

      // Clear cart
      dispatch({ type: 'CLEAR_CART' });
      
      toast.success('Order placed successfully!', { id: orderToast });
      router.push(`/order-confirmation/${customOrderId}`);
      
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.', { id: orderToast });
    } finally {
      setOrderProcessing(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
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
    const errors: any = {};
    if (!deliveryInfo.name.trim()) errors.name = 'Name is required';
    if (!deliveryInfo.phone.trim()) errors.phone = 'Phone is required';
    else if (!validatePhone(deliveryInfo.phone)) errors.phone = 'Invalid phone number';
    if (!deliveryInfo.address.trim()) errors.address = 'Address is required';
    if (!deliveryInfo.email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(deliveryInfo.email)) errors.email = 'Invalid email';
    
    if (siteSettings.otpVerificationRequired && !otpVerified) {
      errors.phone = 'Please verify your phone number first';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!canProceedToReview()) {
        toast.error('Please fill in all required delivery information correctly');
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
              <FaLock className="w-3 h-3 text-green-600" />
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
                        maxLength={50}
                      />
                      {formErrors.name && (
                        <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={deliveryInfo.phone}
                          onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})}
                          className={`flex-1 px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                            formErrors.phone ? 'border-red-500' : 'border-gray-200 focus:border-black'
                          }`}
                          placeholder="01XXXXXXXXX"
                          maxLength={11}
                          disabled={otpVerified}
                        />
                        {siteSettings.otpVerificationRequired && !otpVerified && deliveryInfo.phone && validatePhone(deliveryInfo.phone) && (
                          <button
                            type="button"
                            onClick={() => sendOTP(deliveryInfo.phone)}
                            disabled={verifying || otpSent}
                            className="px-4 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 disabled:bg-gray-300 transition-all whitespace-nowrap"
                          >
                            {verifying ? <FaSpinner className="animate-spin" /> : otpSent ? 'Resend' : 'Verify'}
                          </button>
                        )}
                      </div>
                      {formErrors.phone && (
                        <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>
                      )}
                      
                      {otpSent && !otpVerified && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            placeholder="Enter OTP"
                            className="flex-1 px-4 py-2 border-2 rounded-xl outline-none focus:border-black"
                            maxLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => verifyOTP(deliveryInfo.phone, otp)}
                            disabled={verifying || otp.length !== 6}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:bg-gray-300 transition-all"
                          >
                            {verifying ? <FaSpinner className="animate-spin" /> : 'Confirm'}
                          </button>
                        </div>
                      )}
                      
                      {otpVerified && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <FaCheck /> Phone verified
                        </p>
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
                        maxLength={100}
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
                        maxLength={200}
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
                        maxLength={200}
                      ></textarea>
                    </div>
                  </div>

                  {/* reCAPTCHA */}
                  <div className="mt-6">
                    <ReCAPTCHA
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                      onChange={setRecaptchaToken}
                    />
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
                        {otpVerified && (
                          <span className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <FaCheck /> Verified
                          </span>
                        )}
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
                            <FaCheck className="w-6 h-6 text-pink-600" />
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
                            <FaCheck className="w-6 h-6 text-orange-600" />
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
                            <FaCheck className="w-6 h-6" />
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
                          <FaCopy className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <FaShieldAlt className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
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
                          onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                          className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                            formErrors.transactionId ? 'border-red-500' : 'border-gray-200 focus:border-black'
                          }`}
                          placeholder="Enter transaction ID"
                          maxLength={20}
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
                      
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <FaTruck className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-yellow-900 mb-1">
                              Cash on Delivery Available
                            </p>
                            <p className="text-xs text-yellow-800">
                              Pay when you receive your order. Only available in Lakshmipur.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <FaCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-green-900 mb-1">
                              Amount to pay on delivery: ৳{total.toFixed(0)}
                            </p>
                            <p className="text-xs text-green-800">
                              Please keep exact amount ready for the delivery person
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Place Order Button */}
                  <button
                    type="submit"
                    disabled={orderProcessing || !recaptchaToken}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg group mt-6"
                  >
                    {orderProcessing ? (
                      <>
                        <FaSpinner className="animate-spin w-5 h-5" />
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
              {currentStep < 3 && (
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
                    {currentStep === 1 ? 'Review Order' : 'Proceed to Payment'}
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            {currentStep >= 2 && (
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
                        maxLength={20}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={loadingStates.coupon || appliedCoupon !== null}
                        className="px-4 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                      >
                        {loadingStates.coupon ? <FaSpinner className="animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-600 mt-2">{couponError}</p>
                    )}
                  </div>

                  {/* Security Badges */}
                  <div className="mt-6 space-y-3 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <FaShieldAlt className="text-green-600 w-5 h-5" />
                      <span className="font-semibold">256-bit SSL Secure</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <FaTruck className="text-green-600 w-5 h-5" />
                      <span className="font-semibold">Free shipping over ৳2000</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <FaUndo className="text-green-600 w-5 h-5" />
                      <span className="font-semibold">7 Days Easy Return</span>
                    </div>
                    {otpVerified && (
                      <div className="flex items-center gap-3 text-xs text-green-600">
                        <FaPhone className="text-green-600 w-5 h-5" />
                        <span className="font-semibold">Phone Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Order Limit Warning */}
                  {orderLimitExceeded && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs text-red-600">
                        Daily order limit exceeded. Please try again tomorrow.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
