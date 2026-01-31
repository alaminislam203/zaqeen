'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { HiOutlineTruck, HiOutlineShieldCheck, HiOutlineClipboardCopy, HiOutlineCash, HiOutlineReply } from 'react-icons/hi';
import toast from 'react-hot-toast';

const districts = [
    'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur', 'Chapainawabganj', 'Chattogram', 
    'Chuadanga', 'Cumilla', 'Cox\'s Bazar', 'Dinajpur', 'Faridpur', 'Feni', 'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 
    'Jamalpur', 'Jashore', 'Jhalokati', 'Jhenaidah', 'Joypurhat', 'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia', 
    'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur', 'Moulvibazar', 'Munshiganj', 'Mymensingh', 'Naogaon', 
    'Narail', 'Narayanganj', 'Narsingdi', 'Natore', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh', 'Patuakhali', 
    'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur', 'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 
    'Sylhet', 'Tangail', 'Thakurgaon'
];

export default function CheckoutPage() {
  const { cart, dispatch, isHydrated, totalPrice } = useCart(); 
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  
  // ডাইনামিক সেটিংস স্টেট
  const [siteSettings, setSiteSettings] = useState({
      shippingFeeDhaka: 60,
      shippingFeeOutside: 120,
      bkashNumber: '01XXXXXXXXX',
      nagadNumber: '01XXXXXXXXX'
  });

  const router = useRouter();
  const [deliveryInfo, setDeliveryInfo] = useState({ name: '', address: '', phone: '', city: 'Dhaka' });
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);

  // ১. অথেন্টিকেশন প্রোটোকল
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) router.push('/login?redirect=/checkout');
      else setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  // ২. সাইট কনফিগ ও পেমেন্ট নাম্বার রিয়েল-টাইম ফেচিং
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site_config"), (doc) => {
      if (doc.exists()) {
          const data = doc.data();
          setSiteSettings({
              shippingFeeDhaka: Number(data.shippingFee) || 60,
              shippingFeeOutside: Number(data.shippingFeeOutside) || 120,
              bkashNumber: data.bkashNumber || '01XXXXXXXXX',
              nagadNumber: data.nagadNumber || '01XXXXXXXXX'
          });
      }
    });
    return () => unsub();
  }, []);

  // ৩. COD লজিক আপডেট
  useEffect(() => {
    if (deliveryInfo.city !== 'Lakshmipur' && paymentMethod === 'cod') {
      setPaymentMethod('bkash');
    }
  }, [deliveryInfo.city, paymentMethod]);

  const getShippingFee = (city) => {
      if (city === 'Dhaka') return siteSettings.shippingFeeDhaka;
      if (city === 'Lakshmipur') return 50;
      return siteSettings.shippingFeeOutside; 
  };

  const currentShippingFee = getShippingFee(deliveryInfo.city);
  const subtotal = totalPrice; 
  const total = subtotal - discount + currentShippingFee;

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
        const expiryDate = couponData.expiryDate?.toDate ? couponData.expiryDate.toDate() : new Date(couponData.expiryDate);

        if (!couponData.active) setCouponError("Coupon inactive");
        else if (expiryDate && expiryDate < now) setCouponError("Coupon expired");
        else if (subtotal < (couponData.minSpend || 0)) setCouponError(`Min spend &#2547; ${couponData.minSpend} required`);
        else {
          let calcDiscount = couponData.type === 'percentage' ? (subtotal * couponData.value) / 100 : couponData.value;
          setDiscount(calcDiscount);
          toast.success("Voucher credit applied.", { icon: '🏷️' });
        }
      }
    } catch (err) { setCouponError("System error."); } finally { setIsApplying(false); }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return toast.error("Portfolio is empty.");
    if (!deliveryInfo.name || !deliveryInfo.address || deliveryInfo.phone.length < 11) {
        return toast.error("Complete delivery identity required.");
    }
    if (paymentMethod !== 'cod' && (!transactionId || transactionId.length < 8)) {
        return toast.error("Valid Transaction ID required.");
    }

    setOrderProcessing(true);
    const orderToast = toast.loading("Verifying acquisition protocol...");

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
                transactionId: paymentMethod === 'cod' ? 'CASH' : transactionId, 
                status: paymentMethod === 'cod' ? 'Awaiting Dispatch' : 'Verification Pending' 
            },
            status: 'Pending',
            timestamp: serverTimestamp()
        };

        await setDoc(doc(db, 'orders', customOrderId), orderData);
        dispatch({ type: 'CLEAR_CART' });

        toast.success("Order secured. Archive ID: " + customOrderId, { id: orderToast });
        router.push(`/order-confirmation/${customOrderId}`);
    } catch (error) { 
        toast.error("Transmission breach detected.", { id: orderToast }); 
    } finally { setOrderProcessing(false); }
  };

  if (authLoading || !isHydrated) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      <div className="max-w-[1440px] mx-auto px-6 py-12 md:py-24 animate-fadeIn">
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 border-b border-gray-50 pb-12">
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.8em] text-gray-300 font-black italic block">The Final Stage</span>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none">Security Portal</h1>
          </div>
          <div className="flex items-center gap-4 bg-black text-white px-8 py-3 rounded-sm shadow-xl">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] uppercase tracking-[0.5em] font-black italic">Verified Audit Hub</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
          {/* Information Ledger */}
          <div className="lg:col-span-7 space-y-24">
            
            {/* Phase 01: Delivery */}
            <section className="space-y-12">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-sm font-black italic shadow-2xl">01</div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.6em] italic">Identity Log</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 italic ml-1">Full Legal Name</label>
                    <input type="text" placeholder="E.G. ABDULLAH AL ZAQEEN" value={deliveryInfo.name} onChange={(e) => setDeliveryInfo({...deliveryInfo, name: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-4 text-[11px] font-black uppercase tracking-widest focus:border-black outline-none transition-all italic" />
                </div>
                <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 italic ml-1">Communication ID (Phone)</label>
                    <input type="text" placeholder="01XXXXXXXXX" value={deliveryInfo.phone} onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-4 text-[11px] font-black uppercase tracking-widest focus:border-black outline-none transition-all italic" />
                </div>
                <div className="md:col-span-2 space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 italic ml-1">Technical Logistics Hub (Address)</label>
                    <input type="text" placeholder="HOUSE, ROAD, BLOCK, AREA BLUEPRINT..." value={deliveryInfo.address} onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-4 text-[11px] font-black uppercase tracking-widest focus:border-black outline-none transition-all italic" />
                </div>
                <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 italic ml-1">Geographical Region</label>
                    <select value={deliveryInfo.city} onChange={(e) => setDeliveryInfo({...deliveryInfo, city: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-4 text-[10px] font-black uppercase tracking-[0.3em] cursor-pointer outline-none focus:border-black italic">
                      <option value="Dhaka">Dhaka Metro Hub</option>
                      <option value="Lakshmipur">Lakshmipur Terminal</option>
                      {districts.sort().map(d => (
                         d !== 'Dhaka' && d !== 'Lakshmipur' && <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                </div>
              </div>
            </section>

            {/* Phase 02: Payment */}
            <section className="space-y-12 pt-16 border-t border-gray-50">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-sm font-black italic shadow-2xl">02</div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.6em] italic">Acquisition Methodology</h2>
              </div>
              
              <div className="bg-white border border-gray-50 p-10 md:p-14 space-y-12 shadow-sm rounded-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button onClick={() => setPaymentMethod('bkash')} className={`py-6 rounded-sm text-[10px] font-black uppercase tracking-[0.5em] transition-all border italic ${paymentMethod === 'bkash' ? 'bg-[#D12053] border-[#D12053] text-white shadow-xl' : 'bg-white border-gray-50 text-gray-300'}`}>bKash Protocol</button>
                    <button onClick={() => setPaymentMethod('nagad')} className={`py-6 rounded-sm text-[10px] font-black uppercase tracking-[0.5em] transition-all border italic ${paymentMethod === 'nagad' ? 'bg-[#F7941E] border-[#F7941E] text-white shadow-xl' : 'bg-white border-gray-50 text-gray-300'}`}>Nagad Gateway</button>
                    {deliveryInfo.city === 'Lakshmipur' && (
                        <div className="md:col-span-2">
                            <button onClick={() => setPaymentMethod('cod')} className={`w-full py-6 rounded-sm text-[10px] font-black uppercase tracking-[0.5em] transition-all border flex items-center justify-center gap-5 italic ${paymentMethod === 'cod' ? 'bg-black border-black text-white shadow-xl' : 'bg-white border-gray-50 text-gray-300'}`}>
                                <HiOutlineCash size={20}/> Cash on Terminal (Local Only)
                            </button>
                        </div>
                    )}
                </div>

                {paymentMethod !== 'cod' && (
                  <div className="space-y-12 pt-12 border-t border-gray-50 animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                       <div className="space-y-4">
                          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 italic">Financial Instruction</span>
                          <p className="text-[14px] font-bold leading-relaxed max-w-sm tracking-tighter italic uppercase">
                            Transfer exactly <span className="text-3xl font-black italic underline decoration-gray-100 underline-offset-8">&#2547; {total.toFixed(0)}</span> to our secure wallet.
                          </p>
                       </div>
                       <div className="bg-gray-50 px-10 py-6 rounded-sm border border-gray-100 flex items-center gap-10">
                         <div>
                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] mb-2 italic">Personal Secure Hub</p>
                            <p className="text-sm font-black tracking-[0.3em] text-black italic">
                                {paymentMethod === 'bkash' ? siteSettings.bkashNumber : siteSettings.nagadNumber}
                            </p>
                         </div>
                         <button onClick={() => {navigator.clipboard.writeText(paymentMethod === 'bkash' ? siteSettings.bkashNumber : siteSettings.nagadNumber); toast.success("Identity Copied")}} className="p-4 hover:bg-white rounded-full transition-all group">
                            <HiOutlineClipboardCopy className="w-6 h-6 text-gray-200 group-hover:text-black" />
                         </button>
                       </div>
                    </div>
                    <div className="space-y-4">
                         <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 italic ml-1">Transaction Identity Key</label>
                         <input type="text" placeholder="E.G. ARCH9X2L8M" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full bg-[#fcfcfc] border border-gray-50 p-6 text-sm font-black uppercase tracking-[0.8em] focus:border-black outline-none transition-all italic text-center" />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Acquisition Audit (Summary) */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 bg-white p-12 md:p-16 rounded-sm border border-gray-50 shadow-[0_40px_100px_rgba(0,0,0,0.02)]">
              <h2 className="text-[11px] font-black uppercase tracking-[0.8em] mb-16 text-gray-300 italic text-center">Final Audit Log</h2>
              <div className="space-y-10">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 italic"><span>Articles Value</span><span className="text-black">&#2547;{subtotal.toLocaleString()}</span></div>
                {discount > 0 && (<div className="flex justify-between text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600 italic"><span>Voucher Credit</span><span>- &#2547;{discount.toLocaleString()}</span></div>)}
                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 italic"><span>Logistics Fee</span><span className="text-black">&#2547;{currentShippingFee}</span></div>
                
                <div className="pt-16 border-t border-gray-50 mt-16">
                   <div className="flex flex-col gap-10">
                      <div className="flex justify-between items-baseline mb-8">
                        <span className="text-[12px] font-black uppercase tracking-[0.8em] italic">Total Payable</span>
                        <span className="text-5xl font-black tracking-tighter italic leading-none">&#2547;{total.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex bg-gray-50 rounded-sm overflow-hidden border border-gray-100 p-2 group transition-all focus-within:border-black">
                        <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="COUPON KEY" className="flex-1 bg-transparent px-6 text-[10px] font-black uppercase tracking-[0.4em] outline-none italic" />
                        <button onClick={handleApplyCoupon} disabled={isApplying} className="bg-black text-white px-10 py-5 text-[9px] font-black uppercase tracking-[0.5em] transition-all active:scale-95">{isApplying ? '...' : 'Validate'}</button>
                      </div>
                      {couponError && <p className="text-[9px] text-rose-500 uppercase tracking-widest font-black text-center italic -mt-6 animate-pulse">{couponError}</p>}
                      
                      <button onClick={handlePlaceOrder} disabled={orderProcessing} className="group relative w-full bg-black text-white py-8 text-[12px] font-black uppercase tracking-[0.6em] flex items-center justify-center gap-5 overflow-hidden shadow-2xl transition-all active:scale-[0.98]">
                        <span className="relative z-10 flex items-center gap-4 italic">{orderProcessing ? 'Authenticating...' : 'Secure Acquisition'} <HiOutlineShieldCheck size={20}/></span>
                        <div className="absolute inset-0 bg-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                      </button>
                   </div>
                </div>
              </div>
              
              {/* Trust Ledger */}
              <div className="mt-20 space-y-10 border-t border-gray-50 pt-16">
                  <div className="flex items-center gap-6 group">
                      <div className="p-4 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-all">
                        <HiOutlineShieldCheck size={24} />
                      </div>
                      <div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] italic leading-none">Secure Transaction</h4>
                          <p className="text-[9px] text-gray-300 font-bold tracking-[0.2em] mt-2 italic uppercase">End-to-End Encrypted Audit</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-6 group">
                      <div className="p-4 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-all">
                        <HiOutlineTruck size={24} />
                      </div>
                      <div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] italic leading-none">Logistics Protocol</h4>
                          <p className="text-[9px] text-gray-300 font-bold tracking-[0.2em] mt-2 italic uppercase">Fast-Track Delivery Hub</p>
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
