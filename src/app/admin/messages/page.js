'use client';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { HiOutlineChatAlt2, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi';
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
                createdAt: doc.data().createdAt?.toDate() // Convert Firestore Timestamp to JS Date
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
            toast.success(`Message marked as ${newStatus}.`);
            if(selectedMessage && selectedMessage.id === id) {
                setSelectedMessage({...selectedMessage, status: newStatus});
            }
        } catch (error) {
            toast.error('Failed to update status.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            try {
                await deleteDoc(doc(db, 'contacts', id));
                toast.success('Message deleted.');
                setSelectedMessage(null); // Close detail view if the selected message is deleted
            } catch (error) {
                toast.error('Failed to delete message.');
            }
        }
    };
    
    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-gray-50"><p>Loading messages...</p></div>;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Message List Panel */}
            <div className={`w-full md:w-1/3 border-r border-gray-100 bg-white h-screen overflow-y-auto ${selectedMessage ? 'hidden md:block' : 'block'}`}>
                <header className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                     <h1 className="text-xl font-black uppercase tracking-tighter italic">Inbox</h1>
                     <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Customer Inquiries</p>
                </header>
                <div>
                    {messages.length > 0 ? messages.map(msg => (
                        <div 
                            key={msg.id} 
                            onClick={() => setSelectedMessage(msg)}
                            className={`p-6 border-b border-gray-100 cursor-pointer ${selectedMessage?.id === msg.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                            <div className="flex justify-between items-start">
                                <p className="font-bold text-sm tracking-wide">{msg.name}</p>
                                <span className="text-xs text-gray-400">{msg.createdAt ? format(msg.createdAt, 'PP') : 'N/A'}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 truncate">{msg.subject}</p>
                            <p className="text-xs text-gray-400 mt-2 truncate">{msg.message}</p>
                        </div>
                    )) : (
                         <p className="text-center text-sm text-gray-400 p-20">No messages yet.</p>
                    )}
                </div>
            </div>

            {/* Message Detail Panel */}
            <div className={`w-full md:w-2/3 h-screen overflow-y-auto ${selectedMessage ? 'block' : 'hidden md:flex'} md:items-center md:justify-center`}>
                {selectedMessage ? (
                    <div className="w-full h-full">
                         <header className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                           <div>
                             <button onClick={() => setSelectedMessage(null)} className="md:hidden font-bold text-sm mb-2">← Back</button>
                             <h2 className="font-bold text-lg">{selectedMessage.subject}</h2>
                             <p className="text-sm text-gray-600">From: <span className="font-bold">{selectedMessage.name}</span> ({selectedMessage.email})</p>
                            </div>
                             <div className="flex items-center gap-2">
                                <button onClick={() => handleStatusChange(selectedMessage.id, selectedMessage.status === 'Resolved' ? 'Pending' : 'Resolved')} 
                                    className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition ${selectedMessage.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {selectedMessage.status === 'Resolved' ? <HiOutlineCheckCircle/> : <HiOutlineExclamationCircle/>}
                                        {selectedMessage.status || 'Pending'}
                                </button>
                                <button onClick={() => handleDelete(selectedMessage.id)} className="p-3 text-rose-500 hover:bg-rose-100 rounded-full transition"><HiOutlineTrash size={18}/></button>
                            </div>
                        </header>
                         <div className="p-10 prose prose-sm max-w-none">
                            <p>{selectedMessage.message}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <HiOutlineChatAlt2 size={48} className="mx-auto text-gray-300"/>
                        <p className="mt-4 text-sm text-gray-500">Select a message to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
}
