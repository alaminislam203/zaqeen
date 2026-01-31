'use client';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { HiOutlineChatAlt2, HiOutlineTrash, HiCheckCircle, HiOutlineExclamation, HiOutlineArrowLeft, HiOutlineMail } from 'react-icons/hi';
import { format } from 'date-fns';

export default function MessagesPage() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
            setMessages(msgs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        const messageRef = doc(db, 'contacts', id);
        try {
            await updateDoc(messageRef, { status: newStatus });
            toast.success(`Protocol: Message marked as ${newStatus}.`, {
                style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px' }
            });
            if(selectedMessage && selectedMessage.id === id) {
                setSelectedMessage({...selectedMessage, status: newStatus});
            }
        } catch (error) {
            toast.error('Audit Failure.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this transmission from the archive?')) {
            try {
                await deleteDoc(doc(db, 'contacts', id));
                toast.success('Archive Cleared.');
                setSelectedMessage(null);
            } catch (error) {
                toast.error('System Breach: Failed to delete.');
            }
        }
    };
    
    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-white">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[9px] uppercase tracking-[0.5em] font-black italic">Synchronizing Inbox</p>
        </div>
    );

    return (
        <main className="flex h-screen bg-[#FDFDFD] selection:bg-black selection:text-white">
            
            {/* --- Left Panel: Ledger of Inquiries --- */}
            <div className={`w-full md:w-[400px] border-r border-gray-50 bg-white h-screen flex flex-col ${selectedMessage ? 'hidden md:flex' : 'flex'}`}>
                <header className="p-8 border-b border-gray-50 space-y-2">
                     <h1 className="text-2xl font-black uppercase tracking-tighter italic">Archives</h1>
                     <p className="text-[9px] uppercase tracking-[0.4em] text-gray-300 font-black italic">Public Communications</p>
                </header>

                <div className="overflow-y-auto flex-grow custom-scrollbar">
                    {messages.length > 0 ? messages.map(msg => (
                        <div 
                            key={msg.id} 
                            onClick={() => setSelectedMessage(msg)}
                            className={`p-8 border-b border-gray-50 cursor-pointer transition-all duration-500 relative group
                            ${selectedMessage?.id === msg.id ? 'bg-black text-white shadow-2xl' : 'hover:bg-gray-50'}`}>
                            
                            <div className="flex justify-between items-start mb-3">
                                <p className={`text-[11px] font-black uppercase tracking-widest ${selectedMessage?.id === msg.id ? 'text-white' : 'text-gray-900'}`}>
                                    {msg.name}
                                </p>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${selectedMessage?.id === msg.id ? 'text-gray-500' : 'text-gray-300'}`}>
                                    {msg.createdAt ? format(msg.createdAt, 'dd MMM') : 'N/A'}
                                </span>
                            </div>
                            
                            <p className={`text-[10px] font-bold uppercase tracking-tight truncate italic ${selectedMessage?.id === msg.id ? 'text-gray-400' : 'text-gray-600'}`}>
                                {msg.subject}
                            </p>
                            
                            {/* Status Indicator Bubble */}
                            <div className={`absolute top-1/2 right-4 -translate-y-1/2 w-1.5 h-1.5 rounded-full
                                ${msg.status === 'Resolved' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 animate-pulse'}
                                ${selectedMessage?.id === msg.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
                            </div>
                        </div>
                    )) : (
                         <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                            <HiOutlineMail className="text-gray-100" size={40} />
                            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-300 font-black italic">Vault Void</p>
                         </div>
                    )}
                </div>
            </div>

            {/* --- Right Panel: Transmission Detail --- */}
            <div className={`flex-grow h-screen bg-[#FAFAFA] overflow-y-auto ${selectedMessage ? 'block' : 'hidden md:flex'} md:items-center md:justify-center`}>
                {selectedMessage ? (
                    <div className="w-full h-full flex flex-col bg-white animate-fadeIn">
                         <header className="p-8 md:p-12 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white sticky top-0 z-10 shadow-sm">
                            <div className="space-y-4">
                                <button onClick={() => setSelectedMessage(null)} className="md:hidden flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                    <HiOutlineArrowLeft /> Archive
                                </button>
                                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic leading-none">{selectedMessage.subject}</h2>
                                <div className="flex flex-wrap gap-4 items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic underline decoration-gray-100 underline-offset-4">{selectedMessage.email}</span>
                                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Transmission {format(selectedMessage.createdAt, 'PPP p')}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => handleStatusChange(selectedMessage.id, selectedMessage.status === 'Resolved' ? 'Pending' : 'Resolved')} 
                                    className={`flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] px-8 py-4 rounded-sm transition-all shadow-lg italic
                                    ${selectedMessage.status === 'Resolved' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-black text-white'}`}>
                                    {selectedMessage.status === 'Resolved' ? <HiCheckCircle size={16}/> : <HiOutlineExclamation size={16}/>}
                                    {selectedMessage.status || 'Mark Verified'}
                                </button>
                                <button 
                                    onClick={() => handleDelete(selectedMessage.id)} 
                                    className="p-4 text-gray-300 hover:text-rose-500 border border-gray-100 hover:border-rose-100 rounded-sm transition-all">
                                    <HiOutlineTrash size={20}/>
                                </button>
                            </div>
                        </header>

                        <div className="p-8 md:p-20 max-w-4xl">
                            <div className="relative">
                                <div className="absolute -left-10 top-0 h-full w-[2px] bg-gray-50"></div>
                                <span className="text-[9px] font-black uppercase tracking-[0.8em] text-gray-200 block mb-10 italic">Narrative Body</span>
                                <div className="text-sm md:text-lg leading-[2] text-gray-600 font-medium italic first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-black">
                                    {selectedMessage.message}
                                </div>
                            </div>

                            {/* Response Actions Hub */}
                            <div className="mt-20 pt-20 border-t border-gray-50">
                                <a 
                                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                                    className="group relative inline-block px-16 py-7 bg-black text-white text-[10px] font-black uppercase tracking-[0.5em] overflow-hidden shadow-2xl transition-all active:scale-95"
                                >
                                    <span className="relative z-10 italic">Initiate Response</span>
                                    <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-8 animate-pulse">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-100">
                             <HiOutlineChatAlt2 size={40} className="text-gray-200"/>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-300 italic">Select Communication</h3>
                            <p className="text-[9px] font-bold text-gray-200 uppercase tracking-widest leading-none">Transmission Ledger Pending</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
