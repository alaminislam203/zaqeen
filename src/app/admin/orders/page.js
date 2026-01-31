'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, runTransaction, increment } from 'firebase/firestore';
import { HiOutlineChevronDown, HiOutlinePencil, HiCheckCircle, HiOutlineTruck, HiOutlineInbox, HiOutlineClock, HiOutlineSearch, HiOutlineFilter } from 'react-icons/hi';
import { RiMoneyDollarCircleLine, RiUserLine, RiTimeLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [verifying, setVerifying] = useState({});
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // স্ট্যাটাস অনুযায়ী ফিল্টারিং লজিক
  const filteredOrders = useMemo(() => {
    if (filterStatus === 'All') return orders;
    return orders.filter(order => order.status === filterStatus);
  }, [orders, filterStatus]);

  const handleStatusChange = async (orderId, newStatus) => {
    const originalOrders = [...orders];
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });
        toast.success(`Protocol Updated: ${newStatus}`);

        if (newStatus === 'Delivered') {
            const order = originalOrders.find(o => o.id === orderId);
            if (order && order.items) {
                await runTransaction(db, async (transaction) => {
                    for (const item of order.items) {
                        const productRef = doc(db, 'products', item.id);
                        transaction.update(productRef, { salesCount: increment(item.quantity || 1) });
                    }
                });
                toast.success('Sales Analytics Synchronized');
            }
        }
    } catch (error) {
        toast.error('Transmission Failure');
        console.error(error);
    }
  };

  const verifyPayment = async (orderId, transactionId) => {
    setVerifying(prev => ({ ...prev, [orderId]: true }));
    try {
        // ১.৫ সেকেন্ডের আর্টিফিশিয়াল ডিলে (UX-এর জন্য)
        await new Promise(r => setTimeout(r, 1000));
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { paymentVerified: true });
        toast.success('Identity & Payment Authenticated');
    } catch (err) {
        toast.error('Audit Failure');
    } finally {
        setVerifying(prev => ({ ...prev, [orderId]: false }));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-[9px] uppercase tracking-[0.6em] font-black italic text-gray-300">Accessing Vault</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 md:p-12 selection:bg-black selection:text-white">
      <div className="max-w-[1440px] mx-auto">
        
        {/* --- Header Architecture --- */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-10 border-b border-gray-50 pb-12">
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-[0.8em] text-gray-300 font-black italic block">Command Center</span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none text-black">Order Archive</h1>
          </div>

          <div className="flex flex-wrap items-center gap-6">
             <div className="flex items-center gap-4 bg-white border border-gray-100 px-6 py-3 rounded-full shadow-sm group">
                <HiOutlineFilter className="text-gray-300 group-hover:text-black transition-colors" />
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer italic"
                >
                    <option value="All">All Transactions</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                </select>
             </div>
             <div className="bg-black text-white px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.3em] italic">
                {filteredOrders.length} Logged
             </div>
          </div>
        </header>

        {/* --- Data Matrix (Table) --- */}
        <div className="bg-white border border-gray-50 rounded-sm shadow-[0_40px_100px_rgba(0,0,0,0.02)] overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-black text-white text-[9px] uppercase tracking-[0.4em] italic">
                  <th className="p-8 font-black">Identity Key</th>
                  <th className="p-8 font-black">Client Portfolio</th>
                  <th className="p-8 font-black text-center">Net Investment</th>
                  <th className="p-8 font-black text-center">Logistics Protocol</th>
                  <th className="p-8 font-black text-center">Audit</th>
                  <th className="p-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className={`group transition-all hover:bg-gray-50/50 ${expandedOrder === order.id ? 'bg-gray-50' : ''}`}>
                      <td className="p-8">
                        <div className="space-y-1">
                           <span className="text-[12px] font-black tracking-widest text-black">#{order.orderId || order.id.slice(0, 8).toUpperCase()}</span>
                           <div className="flex items-center gap-2 text-gray-300">
                              <RiTimeLine size={12}/>
                              <span className="text-[9px] font-bold uppercase tracking-tighter italic">{order.timestamp?.toDate().toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'})}</span>
                           </div>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 border border-gray-100 group-hover:scale-110 transition-transform"><RiUserLine size={18}/></div>
                           <div className="space-y-1">
                              <p className="text-[11px] font-black uppercase text-gray-800 tracking-widest">{order.deliveryInfo?.name || 'Collector'}</p>
                              <div className="flex items-center gap-3">
                                 <span className={`text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest ${order.paymentInfo?.method === 'bkash' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>{order.paymentInfo?.method}</span>
                                 <span className="text-[10px] font-mono text-gray-300 italic">ID: {order.paymentInfo?.transactionId}</span>
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="p-8 text-center font-black text-black text-lg tracking-tighter italic">৳{(order.totalAmount || 0).toLocaleString()}</td>
                      <td className="p-8 text-center">
                        <select 
                            value={order.status} 
                            onChange={(e) => handleStatusChange(order.id, e.target.value)} 
                            className={`appearance-none text-[9px] font-black uppercase tracking-[0.3em] px-6 py-3 rounded-sm border text-center cursor-pointer transition-all italic shadow-sm
                            ${order.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                              order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                        >
                          <option value="Pending">Awaiting Audit</option>
                          <option value="Processing">In Curation</option>
                          <option value="Shipped">Dispatched</option>
                          <option value="Delivered">Authenticated</option>
                          <option value="Returned">Protocol Returned</option>
                          <option value="Cancelled">Terminated</option>
                        </select>
                      </td>
                      <td className="p-8 text-center">
                         {order.paymentVerified === true ? (
                            <div className="flex items-center justify-center text-emerald-500 animate-fadeIn"><HiCheckCircle size={24}/></div>
                         ) : (
                            <button 
                                onClick={() => verifyPayment(order.id, order.paymentInfo?.transactionId)} 
                                disabled={verifying[order.id]} 
                                className="group relative text-[9px] font-black uppercase tracking-[0.4em] px-6 py-3 border border-gray-100 rounded-sm overflow-hidden hover:text-white transition-all italic shadow-sm"
                            >
                                <span className="relative z-10">{verifying[order.id] ? 'Logging...' : 'Verify'}</span>
                                <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            </button>
                         )}
                      </td>
                      <td className="p-8 text-right">
                        <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className={`p-3 rounded-full transition-all duration-700 ${expandedOrder === order.id ? 'rotate-180 bg-black text-white' : 'bg-gray-50 text-gray-300 border border-gray-100'}`}><HiOutlineChevronDown /></button>
                      </td>
                    </tr>

                    {/* --- Expanded Detail Protocol --- */}
                    {expandedOrder === order.id && ( 
                      <tr className="bg-[#fcfcfc] animate-slideDown">
                        <td colSpan="6" className="p-12">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
                            <div className="space-y-6">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-3 border-b border-gray-100 pb-4 italic"><HiOutlineInbox className="text-black"/> Acquisition Matrix</h4>
                              <ul className="space-y-4">
                                {order.items?.map((item, idx) => (
                                  <li key={idx} className="flex justify-between items-center text-[11px] font-bold text-gray-500 group">
                                    <span className="uppercase italic tracking-widest">{item.name} <span className="text-[9px] text-black font-black ml-2 px-2 py-0.5 bg-gray-100 rounded-sm">x{item.quantity}</span></span>
                                    <span className="text-black font-black tracking-tighter">৳{(item.price * item.quantity).toLocaleString()}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-6">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-3 border-b border-gray-100 pb-4 italic"><HiOutlineTruck className="text-black"/> Logistics Blueprint</h4>
                              <div className="text-[11px] font-bold text-gray-500 space-y-3 uppercase tracking-widest italic">
                                <p className="text-black font-black text-xs leading-none">{order.deliveryInfo?.name}</p>
                                <p className="leading-relaxed border-l-2 border-gray-100 pl-4">{order.deliveryInfo?.address}</p>
                                <div className="flex items-center gap-4 pt-4">
                                   <div className="px-3 py-1 bg-white border border-gray-100 text-black shadow-sm">{order.deliveryInfo?.phone}</div>
                                   <div className="px-3 py-1 bg-white border border-gray-100 text-black shadow-sm">{order.deliveryInfo?.city}</div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-3 border-b border-gray-100 pb-4 italic"><HiOutlinePencil className="text-black"/> Internal Metadata</h4>
                              <textarea 
                                defaultValue={order.note || ''} 
                                onBlur={(e) => handleNoteChange(order.id, e.target.value)} 
                                placeholder="DOCUMENT CUSTOMER PROTOCOL..." 
                                className="w-full h-32 bg-white p-5 text-[11px] font-black uppercase tracking-widest border border-gray-100 rounded-sm focus:border-black outline-none transition-all shadow-inner placeholder:text-gray-100 italic"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Footer Signature --- */}
        <div className="mt-20 flex items-center justify-center gap-6 opacity-30 pointer-events-none">
            <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
            <p className="text-[9px] uppercase tracking-[0.5em] font-black italic">Zaqeen Governance Protocol 2026</p>
            <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
