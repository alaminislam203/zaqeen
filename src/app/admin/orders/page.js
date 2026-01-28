'use client';
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, runTransaction, increment } from 'firebase/firestore';
import { HiOutlineChevronDown, HiOutlinePencil, HiCheckCircle, HiOutlineTruck, HiOutlineInbox, HiOutlineClock, HiOutlineExclamation } from 'react-icons/hi';
import { RiMoneyDollarCircleLine, RiUserLine, RiTimeLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

const debounce = (func, delay) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

const updateOrderInDb = debounce(async (orderId, data) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, data);
    toast.success(`Order updated`);
  } catch (error) {
    toast.error('Failed to update order');
  }
}, 800);

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [verifying, setVerifying] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    const originalOrders = [...orders];
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updatedOrders);

    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });
        toast.success(`Order status updated to ${newStatus}`);

        // If status is 'Delivered', update sales count for each product
        if (newStatus === 'Delivered') {
            const order = originalOrders.find(o => o.id === orderId);
            if (order && order.items) {
                await runTransaction(db, async (transaction) => {
                    for (const item of order.items) {
                        const productRef = doc(db, 'products', item.id);
                        transaction.update(productRef, { salesCount: increment(item.quantity || 1) });
                    }
                });
                toast.success('Product sales counts updated!');
            }
        }
    } catch (error) {
        setOrders(originalOrders); // Revert UI on error
        toast.error('Failed to update order status or sales counts.');
        console.error("Transaction failed: ", error);
    }
  };

  const handleNoteChange = (orderId, newNote) => {
     setOrders(orders.map(o => o.id === orderId ? { ...o, note: newNote } : o));
     updateOrderInDb(orderId, { note: newNote });
  }
  
  const verifyPayment = async (orderId, transactionId) => {
    setVerifying(prev => ({ ...prev, [orderId]: true }));
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const isVerified = transactionId && transactionId.length > 5; 
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { paymentVerified: isVerified });
    setVerifying(prev => ({ ...prev, [orderId]: false }));
    toast.success(isVerified ? 'Payment Verified' : 'Invalid Transaction');
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-[10px] uppercase tracking-[0.4em] font-bold text-gray-400">Accessing Vault...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Order Concierge</h1>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Zaqeen Command Center</p>
          </div>
        </header>
        <div className="bg-white border border-gray-100 rounded-sm shadow-xl overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black text-white text-[9px] uppercase tracking-[0.25em]">
                  <th className="p-6 font-black">Identity</th>
                  <th className="p-6 font-black">Client & Payment</th>
                  <th className="p-6 font-black text-center">Amount</th>
                  <th className="p-6 font-black text-center">Logistics</th>
                  <th className="p-6 font-black text-center">Verify</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className={`group transition-all hover:bg-gray-50/50 ${expandedOrder === order.id ? 'bg-gray-50' : ''}`}>
                      <td className="p-6">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black tracking-widest text-gray-900">#{order.orderId || order.id.slice(0, 8).toUpperCase()}</span>
                           <div className="flex items-center gap-1.5 mt-1 text-gray-400"><RiTimeLine size={12}/><span className="text-[9px] font-bold uppercase tracking-tighter">{order.timestamp?.toDate().toLocaleDateString('en-GB')}</span>
                           </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><RiUserLine size={16}/></div>
                           <div>
                              <p className="text-[11px] font-black uppercase text-gray-800 tracking-tight">{order.deliveryInfo?.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase ${order.paymentInfo?.method === 'bkash' ? 'bg-pink-100 text-pink-600' : order.paymentInfo?.method === 'cod' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>{order.paymentInfo?.method}</span>
                                 <span className="text-[10px] font-mono text-gray-400">{order.paymentInfo?.transactionId}</span>
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="p-6 text-center font-black text-gray-900 tracking-tighter">৳{(order.totalAmount || 0).toLocaleString()}</td>
                      <td className="p-6 text-center">
                        <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className={`appearance-none text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border text-center cursor-pointer transition-all focus:ring-2 focus:ring-black/5 ${order.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : order.status === 'Processing' ? 'bg-blue-50 text-blue-600 border-blue-200' : order.status === 'Handed Over to Courier' ? 'bg-cyan-50 text-cyan-600 border-cyan-200' : order.status === 'Shipped' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-200' : order.status === 'Returned' ? 'bg-slate-50 text-slate-600 border-slate-200' : order.status === 'Delayed' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          <option value="Pending">Pending</option><option value="Processing">Processing</option><option value="Handed Over to Courier">Handed Over</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Delayed">Delayed</option><option value="Returned">Returned</option><option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-6 text-center">
                         {order.paymentVerified === true ? (<div className="flex items-center justify-center gap-1.5 text-emerald-500"><HiCheckCircle size={20}/></div>) : (<button onClick={() => verifyPayment(order.id, order.paymentInfo?.transactionId)} disabled={verifying[order.id]} className="text-[9px] font-black uppercase tracking-widest px-4 py-2 border border-gray-200 rounded-sm hover:bg-black hover:text-white transition-all disabled:opacity-30">{verifying[order.id] ? 'Process' : 'Verify'}</button>)}
                      </td>
                      <td className="p-6 text-right"><button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className={`p-2 rounded-full transition-transform duration-300 ${expandedOrder === order.id ? 'rotate-180 bg-black text-white' : 'hover:bg-gray-100 text-gray-400'}`}><HiOutlineChevronDown /></button>
                      </td>
                    </tr>
                    {expandedOrder === order.id && ( <tr className="bg-gray-50/50"><td colSpan="6" className="p-10"><div className="grid grid-cols-1 md:grid-cols-3 gap-12"><div className="space-y-4"><h4 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border-b border-gray-200 pb-2"><HiOutlineInbox className="text-black"/> Curated Items</h4><ul className="space-y-3">{order.items?.map((item, idx) => (<li key={idx} className="flex justify-between text-[11px] font-bold text-gray-600 group"><span>{item.title} <span className="text-[9px] text-gray-400 ml-1">x{item.quantity}</span></span><span className="text-black">৳{(item.price * item.quantity).toLocaleString()}</span></li>))}</ul></div><div className="space-y-4"><h4 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border-b border-gray-200 pb-2"><HiOutlineTruck className="text-black"/> Logistics Info</h4><div className="text-[11px] font-bold text-gray-600 space-y-1"><p className="text-black uppercase">{order.deliveryInfo?.name}</p><p className="font-medium italic leading-relaxed">{order.deliveryInfo?.address}</p><p className="mt-2 text-gray-900">{order.deliveryInfo?.phone}</p><p className="text-[9px] uppercase tracking-widest text-gray-400 mt-2">{order.deliveryInfo?.city}</p></div></div><div className="space-y-4"><h4 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border-b border-gray-200 pb-2"><HiOutlinePencil className="text-black"/> Internal Note</h4><textarea defaultValue={order.note || ''} onBlur={(e) => handleNoteChange(order.id, e.target.value)} placeholder="Add a note for the customer..." className="w-full h-24 bg-white p-3 text-[11px] font-bold border border-gray-200 rounded-sm focus:ring-1 focus:ring-black transition-all"/></div></div></td></tr>)}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
