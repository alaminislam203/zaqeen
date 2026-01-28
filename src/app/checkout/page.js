'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { HiOutlineTruck, HiOutlineShieldCheck, HiOutlineClipboardCopy, HiOutlineCash, HiOutlineReply } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  // CartContext থেকে মেমরাইজড ভ্যালুগুলো নেওয়া হয়েছে
  const { cart, dispatch, isHydrated, totalPrice } = useCart(); 
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [dhakaShippingFee, setDhakaShippingFee] = useState(60);
  const router = useRouter();

  const [deliveryInfo, setDeliveryInfo] = useState({ name: '', address: '', phone: '', city: 'Dhaka' });
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);

  // Auth Protection: লগইন না থাকলে লগইন পেজে পাঠিয়ে দেওয়া
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) router.push('/login?redirect=/checkout');
      else setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  // ডাইনামিক শিপিং ফি লোড করা (Firebase Settings থেকে)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site_config"), (doc) => {
      if (doc.exists()) setDhakaShippingFee(Number(doc.data().shippingFee) || 60);
    });
    return () => unsub();
  }, []);

  // COD রেস্ট্রিকশন: শুধুমাত্র লক্ষ্মীপুর এর জন্য COD প্রযোজ্য
  useEffect(() => {
    if (deliveryInfo.city !== 'Lakshmipur' && paymentMethod === 'cod') {
      setPaymentMethod('bkash');
    }
  }, [deliveryInfo.city, paymentMethod]);

  const getShippingFee = (city) => {
      if (city === 'Dhaka') return dhakaShippingFee;
      if (city === 'Lakshmipur') return 50;
      return 120; // বাইরের অন্যান্য জেলার জন্য ফিক্সড চার্জ
  };

  const currentShippingFee = getShippingFee(deliveryInfo.city);
  // subtotal এখন সরাসরি context এর totalPrice থেকে আসছে
  const subtotal = totalPrice; 
  const total = subtotal - discount + currentShippingFee;

  // কুপন ভ্যালিডেশন লজিক
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplying(true);
    setCouponError('');
    try {
      const q = query(collection(db, "coupons"), where("code", "==", couponCode.toUpperCase().trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setCouponError("Invalid coupon code");
        setDiscount(0);
      } else {
        const couponData = querySnapshot.docs[0].data();
        const now = new Date();
        const expiryDate = couponData.expiryDate ? new Date(couponData.expiryDate) : null;

        if (!couponData.active) setCouponError("Coupon inactive");
        else if (expiryDate && expiryDate < now) setCouponError("Coupon expired");
        else if (subtotal < (couponData.minSpend || 0)) setCouponError(`Min spend ৳${couponData.minSpend} required`);
        else {
          let calcDiscount = couponData.type === 'percentage' ? (subtotal * couponData.value) / 100 : couponData.value;
          setDiscount(calcDiscount);
          toast.success("Identity verified: Voucher applied.");
        }
      }
    } catch (err) { setCouponError("System error. Try again."); } finally { setIsApplying(false); }
  };

  // অর্ডার প্লেস করার মূল লজিক
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
        toast.error("Your portfolio is empty.");
        return;
    }
    if (!deliveryInfo.name || !deliveryInfo.address || deliveryInfo.phone.length < 11) {
        toast.error("Provide complete delivery identity.");
        return;
    }
    if (paymentMethod !== 'cod' && (!transactionId || transactionId.length < 8)) {
        toast.error("Secure Transaction ID required.");
        return;
    }

    setOrderProcessing(true);
    const orderToast = toast.loading("Logging your acquisition...");

    try {
        const customOrderId = `ZQ${Math.floor(100000 + Math.random() * 900000)}`;
        const orderData = {
            orderId: customOrderId,
            userId: user.uid,
            userEmail: user.email,
            items: cart,
            subtotal,
            discount,
            shippingFee: currentShippingFee,
            totalAmount: total,
            deliveryInfo,
            paymentInfo: { 
                method: paymentMethod, 
                transactionId: paymentMethod === 'cod' ? 'N/A' : transactionId, 
                status: paymentMethod === 'cod' ? 'Unpaid' : 'Verification Pending' 
            },
            status: 'Pending',
            timestamp: serverTimestamp()
        };

        await setDoc(doc(db, 'orders', customOrderId), orderData);
        dispatch({ type: 'CLEAR_CART' });
        toast.success("Acquisition logged successfully.", { id: orderToast });
        router.push(`/order-confirmation/${customOrderId}`);
    } catch (error) { 
        toast.error("Transmission failed. Contact concierge.", { id: orderToast }); 
    } finally { setOrderProcessing(false); }
  };

  if (authLoading || !isHydrated) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const districts = [
    'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur', 'Chapainawabganj', 'Chattogram', 
    'Chuadanga', 'Cumilla', 'Cox\'s Bazar', 'Dinajpur', 'Faridpur', 'Feni', 'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 
    'Jamalpur', 'Jashore', 'Jhalokati', 'Jhenaidah', 'Joypurhat', 'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia', 
    'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur', 'Moulvibazar', 'Munshiganj', 'Mymensingh', 'Naogaon', 
    'Narail', 'Narayanganj', 'Narsingdi', 'Natore', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh', 'Patuakhali', 
    'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur', 'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 
    'Sylhet', 'Tangail', 'Thakurgaon'
  ];

  return (
    <main className="min-h-screen bg-white">
     
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4 border-b border-gray-100 pb-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-bold italic block">The Acquisition</span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mt-2 italic">Secure Checkout</h1>
          </div>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            End-to-End Encrypted Access
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
          {/* Left: Shipping & Payment Studios */}
          <div className="lg:col-span-7 space-y-20">
            <section className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-[11px] font-black italic">01</div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.4em]">Delivery Identity</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
                    <input type="text" placeholder="E.G. ABDULLAH AL ZAQEEN" value={deliveryInfo.name} onChange={(e) => setDeliveryInfo({...deliveryInfo, name: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-3 text-[11px] font-bold tracking-widest focus:border-black outline-none transition" />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Phone Number</label>
                    <input type="text" placeholder="01XXXXXXXXX" value={deliveryInfo.phone} onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-3 text-[11px] font-bold tracking-widest focus:border-black outline-none transition" />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Shipping Address Details</label>
                    <input type="text" placeholder="HOUSE, ROAD, AREA DETAILS" value={deliveryInfo.address} onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-3 text-[11px] font-bold tracking-widest focus:border-black outline-none transition" />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Region Selection</label>
                    <select value={deliveryInfo.city} onChange={(e) => setDeliveryInfo({...deliveryInfo, city: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-3 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer outline-none focus:border-black">
                      <option value="Dhaka">Dhaka Metropolis — ৳{dhakaShippingFee}</option>
                      <option value="Lakshmipur">Lakshmipur — ৳50</option>
                      {districts.sort().map(d => <option key={d} value={d}>{d} — ৳120</option>)}
                    </select>
                </div>
              </div>
            </section>

            <section className="space-y-10 pt-10 border-t border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-[11px] font-black italic">02</div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.4em]">Payment Methodology</h2>
              </div>
              
              <div className="bg-[#fcfcfc] border border-gray-50 rounded-sm p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={() => setPaymentMethod('bkash')} className={`py-5 rounded-sm text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${paymentMethod === 'bkash' ? 'bg-[#D12053] border-[#D12053] text-white shadow-2xl shadow-pink-100' : 'bg-white border-gray-100 text-gray-300'}`}>bKash Gateway</button>
                    <button onClick={() => setPaymentMethod('nagad')} className={`py-5 rounded-sm text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${paymentMethod === 'nagad' ? 'bg-[#F7941E] border-[#F7941E] text-white shadow-2xl shadow-orange-50' : 'bg-white border-gray-100 text-gray-300'}`}>Nagad Portal</button>
                    {deliveryInfo.city === 'Lakshmipur' && (
                        <div className="md:col-span-2">
                            <button onClick={() => setPaymentMethod('cod')} className={`w-full py-5 rounded-sm text-[10px] font-black uppercase tracking-[0.3em] transition-all border flex items-center justify-center gap-4 ${paymentMethod === 'cod' ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xl shadow-emerald-50' : 'bg-white border-gray-100 text-gray-300'}`}>
                                <HiOutlineCash size={20}/> Cash on Delivery
                            </button>
                        </div>
                    )}
                </div>

                {paymentMethod !== 'cod' && (
                  <div className="space-y-10 pt-10 border-t border-gray-100 animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                       <div className="space-y-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 italic">Instruction</p>
                          <p className="text-[13px] font-bold leading-relaxed max-w-sm tracking-tighter">
                            Deposit <span className="text-2xl italic">৳{total.toFixed(0)}</span> to the secure wallet and log the Transaction ID below.
                          </p>
                       </div>
                       <div className="bg-white px-8 py-5 rounded-sm border border-gray-100 flex items-center gap-8 shadow-sm group">
                         <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1 italic">Personal Account</p>
                            <p className="text-sm font-black tracking-widest text-gray-800">017XXXXXXXX</p>
                         </div>
                         <button onClick={() => {navigator.clipboard.writeText("017XXXXXXXX"); toast.success("Copied to clipboard")}} className="p-3 hover:bg-gray-50 rounded-full transition group-active:scale-90">
                            <HiOutlineClipboardCopy className="w-6 h-6 text-gray-300" />
                         </button>
                       </div>
                    </div>
                    <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Enter Transaction Identity</label>
                         <input type="text" placeholder="E.G. 9X2L8M0K" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full bg-white border border-gray-100 p-6 text-sm font-mono font-black uppercase tracking-[0.5em] focus:border-black outline-none transition rounded-sm shadow-inner" />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right: Summary Hub */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 bg-white p-10 md:p-14 rounded-sm border border-gray-50 shadow-[0_40px_100px_rgba(0,0,0,0.02)]">
              <h2 className="text-[10px] font-black uppercase tracking-[0.6em] mb-14 text-gray-300 italic">Final Audit</h2>
              <div className="space-y-8">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400"><span>Portfolio Value</span><span className="text-gray-900">৳{subtotal.toLocaleString()}</span></div>
                {discount > 0 && (<div className="flex justify-between text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 italic"><span>Voucher Credit</span><span>- ৳{discount.toLocaleString()}</span></div>)}
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400"><span>Logistics Fee</span><span className="text-gray-900">৳{currentShippingFee}</span></div>
                
                <div className="pt-12 border-t border-gray-50 mt-12">
                   <div className="flex flex-col gap-8">
                      <div className="flex justify-between items-baseline mb-6">
                        <span className="text-[12px] font-black uppercase tracking-[0.6em] italic">Total Payable</span>
                        <span className="text-4xl font-black tracking-tighter italic">৳{total.toLocaleString()}</span>
                      </div>
                      
                      {/* Coupon Port */}
                      <div className="flex bg-gray-50 rounded-sm overflow-hidden border border-gray-100 p-1.5">
                        <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="COUPON KEY" className="flex-1 bg-transparent px-5 text-[10px] font-black uppercase tracking-[0.3em] outline-none" />
                        <button onClick={handleApplyCoupon} disabled={isApplying} className="bg-black text-white px-8 py-4 text-[9px] font-black uppercase tracking-[0.4em] hover:bg-gray-800 transition active:scale-95 disabled:opacity-30">{isApplying ? '...' : 'Validate'}</button>
                      </div>
                      {couponError && <p className="text-[9px] text-rose-500 uppercase tracking-widest font-black text-center italic -mt-4">{couponError}</p>}
                      
                      {/* Acquisition Button */}
                      <button onClick={handlePlaceOrder} disabled={orderProcessing} className="group relative w-full bg-black text-white py-7 text-[12px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-4 overflow-hidden shadow-2xl transition-all active:scale-[0.98]">
                        <span className="relative z-10 flex items-center gap-3"><HiOutlineShieldCheck size={20}/> {orderProcessing ? 'Authenticating...' : 'Complete Acquisition'}</span>
                        <div className="absolute inset-0 bg-gray-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                      </button>
                   </div>
                </div>
              </div>
              
              {/* Trust & Policy Footnotes */}
              <div className="mt-16 space-y-8 border-t border-gray-50 pt-12">
                  <div className="flex items-center gap-5 group">
                      <HiOutlineShieldCheck size={22} className="text-gray-300 group-hover:text-black transition-colors" />
                      <div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Zaqeen Protocol</h4>
                          <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1">SSL Encrypted Transaction</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-5 group">
                      <HiOutlineTruck size={22} className="text-gray-300 group-hover:text-black transition-colors" />
                      <div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Standard Logistics</h4>
                          <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1">Estimated Delivery: 2-4 Days</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-5 group">
                      <HiOutlineReply size={22} className="text-gray-300 group-hover:text-black transition-colors" />
                      <div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Acquisition Terms</h4>
                          <a href="/return-policy" className="text-[9px] text-gray-400 font-bold tracking-widest mt-1 underline hover:text-black italic">Certified 7-Day Return Protocol</a>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
