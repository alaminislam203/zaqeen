'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { HiOutlineChat, HiOutlineUsers, HiOutlinePaperAirplane, HiOutlineArrowLeft, HiOutlineTrash, HiOutlineUserCircle } from 'react-icons/hi';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';

// সাব-কালেকশন ডিলিট করার হেল্পার ফাংশন
async function deleteSubcollection(db, collectionPath) {
    const q = query(collection(db, collectionPath));
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(promises);
}

const LiveChatAdminPage = () => {
    const [chatSessions, setChatSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isUserTyping, setIsUserTyping] = useState(false);
    const messagesEndRef = useRef(null);
    
    // ১. চ্যাট সেশন লিস্ট ফেচিং (রিয়েল-টাইম)
    useEffect(() => {
        const q = query(collection(db, 'chats'), orderBy('lastMessageTimestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                lastMessageTimestamp: doc.data().lastMessageTimestamp?.toDate(),
            }));
            setChatSessions(sessions);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // ২. মেসেজ এবং টাইপিং লিসেনার
    useEffect(() => {
        if (!selectedSession) return;

        const messagesQuery = query(
            collection(db, `chats/${selectedSession.id}/messages`),
            orderBy('timestamp', 'asc')
        );

        const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
        });

        const chatRef = doc(db, 'chats', selectedSession.id);
        const unsubscribeTyping = onSnapshot(chatRef, (doc) => {
            if (doc.exists()) {
                setIsUserTyping(doc.data().isUserTyping || false);
            }
        });

        // আনরিড মেসেজ মার্ক করা
        const markAsRead = async () => {
            const chatSnap = await getDoc(chatRef);
            if (chatSnap.exists() && chatSnap.data().isUnreadForAdmin) {
                await updateDoc(chatRef, { isUnreadForAdmin: false });
            }
        };
        markAsRead();

        return () => {
            unsubscribeMessages();
            unsubscribeTyping();
        };
    }, [selectedSession]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isUserTyping]);

    // ৩. অ্যাডমিন টাইপিং স্ট্যাটাস (Debounced)
    const debouncedUpdateTyping = useMemo(
        () => debounce((session, isTyping) => {
            if (session) {
                const chatRef = doc(db, 'chats', session.id);
                setDoc(chatRef, { isAdminTyping: isTyping }, { merge: true });
            }
        }, 500),
        []
    );

    useEffect(() => {
        if (newMessage) {
            debouncedUpdateTyping(selectedSession, true);
        }
        const timer = setTimeout(() => {
            debouncedUpdateTyping(selectedSession, false);
        }, 2000);
        return () => clearTimeout(timer);
    }, [newMessage, selectedSession, debouncedUpdateTyping]);

    // ৪. মেসেজ সেন্ড প্রোটোকল
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !selectedSession) return;
        
        debouncedUpdateTyping.cancel();
        const msg = newMessage;
        setNewMessage('');

        try {
            const chatRef = doc(db, 'chats', selectedSession.id);
            await setDoc(chatRef, { isAdminTyping: false }, { merge: true });
            
            await addDoc(collection(db, `chats/${selectedSession.id}/messages`), {
                text: msg,
                timestamp: serverTimestamp(),
                sender: 'admin'
            });

            await updateDoc(chatRef, {
                lastMessage: msg,
                lastMessageTimestamp: serverTimestamp(),
                isUnreadForUser: true
            });
        } catch (err) {
            toast.error("Transmission Failure.");
        }
    };

    const handleDeleteChat = async (e, sessionId) => {
        e.stopPropagation();
        if (window.confirm('Terminate this conversation archive?')) {
            try {
                await deleteSubcollection(db, `chats/${sessionId}/messages`);
                await deleteDoc(doc(db, 'chats', sessionId));
                if (selectedSession?.id === sessionId) setSelectedSession(null);
                toast.success("Protocol Terminated.");
            } catch (error) {
                toast.error("Deletion Failed.");
            }
        }
    };

    return (
        <div className="p-4 md:p-8 bg-[#FDFDFD] min-h-screen flex selection:bg-black selection:text-white">
            <div className="w-full flex bg-white border border-gray-100 rounded-sm shadow-[0_40px_100px_rgba(0,0,0,0.03)] h-[calc(100vh-6rem)] overflow-hidden">
                
                {/* --- Sidebar: Session List --- */}
                <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-gray-50 flex flex-col ${selectedSession ? 'hidden md:flex' : 'flex'}`}>
                    <header className="p-8 border-b border-gray-50 space-y-2">
                        <h1 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                            <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                            Concierge Hub
                        </h1>
                        <p className="text-[9px] uppercase tracking-[0.4em] text-gray-300 font-black italic">Active Transmissions</p>
                    </header>

                    <div className="overflow-y-auto flex-grow custom-scrollbar">
                        {loading ? (
                            <div className="p-8 space-y-4">
                                {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-sm"></div>)}
                            </div>
                        ) : chatSessions.length === 0 ? (
                            <div className="text-center p-20 text-gray-300 space-y-4">
                                <HiOutlineUsers size={40} className="mx-auto opacity-20"/>
                                <p className="text-[10px] font-black uppercase tracking-widest italic">Vault Empty</p>
                            </div>
                        ) : (
                            chatSessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => setSelectedSession(session)}
                                    className={`p-6 border-b border-gray-50 cursor-pointer flex justify-between items-center transition-all duration-500 group ${selectedSession?.id === session.id ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="font-black truncate text-[11px] uppercase tracking-widest">
                                                {session.userName || 'Anonymous Collector'}
                                            </p>
                                            {session.isUnreadForAdmin && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>}
                                        </div>
                                        <p className={`text-[10px] truncate italic font-medium ${session.isUserTyping ? 'text-emerald-400 animate-pulse' : selectedSession?.id === session.id ? 'text-gray-400' : 'text-gray-400'}`}>
                                            {session.isUserTyping ? 'Drafting...' : session.lastMessage}
                                        </p>
                                        <p className="text-[8px] font-black uppercase tracking-widest mt-2 opacity-40 italic">
                                            {session.lastMessageTimestamp ? formatDistanceToNow(session.lastMessageTimestamp, { addSuffix: true }) : ''}
                                        </p>
                                    </div>
                                    <button onClick={(e) => handleDeleteChat(e, session.id)} className={`opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full hover:bg-rose-500 hover:text-white ${selectedSession?.id === session.id ? 'text-gray-500' : 'text-gray-300'}`}>
                                        <HiOutlineTrash size={16}/>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- Main: Message Console --- */}
                <div className={`w-full flex flex-col bg-white ${selectedSession ? 'flex' : 'hidden md:flex'}`}>
                    {selectedSession ? (
                        <>
                            {/* Console Header */}
                            <header className="p-6 border-b border-gray-50 flex items-center justify-between bg-white relative z-10">
                                <div className="flex items-center gap-6">
                                    <button onClick={() => setSelectedSession(null)} className="md:hidden p-2 hover:bg-gray-50 rounded-full transition-all"><HiOutlineArrowLeft size={20}/></button>
                                    <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-xl">
                                        <HiOutlineUserCircle size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="font-black text-xs uppercase tracking-widest italic">{selectedSession.userName || 'Active Collector'}</h2>
                                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-300">Identity Verified • Session {selectedSession.id.substring(0, 8)}</p>
                                    </div>
                                </div>
                                <div className="hidden lg:flex items-center gap-3">
                                     <div className={`w-2 h-2 rounded-full ${isUserTyping ? 'bg-emerald-500 animate-pulse' : 'bg-gray-200'}`}></div>
                                     <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 italic">User Data Stream</span>
                                </div>
                            </header>

                            {/* Conversation Ledger */}
                            <div className="flex-grow p-8 overflow-y-auto bg-[#FAFAFA] space-y-8 scrollbar-hide">
                                {messages.map((msg, index) => {
                                    const isLastInGroup = messages[index + 1]?.sender !== msg.sender;
                                    return (
                                        <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                            <div className={`max-w-[70%] space-y-2`}>
                                                <div className={`p-4 md:p-5 text-[12px] font-medium leading-relaxed shadow-sm transition-all ${
                                                    msg.sender === 'admin' 
                                                    ? 'bg-black text-white rounded-l-2xl rounded-tr-sm' 
                                                    : 'bg-white border border-gray-100 text-gray-800 rounded-r-2xl rounded-tl-sm'
                                                }`}>
                                                    {msg.text}
                                                </div>
                                                {isLastInGroup && msg.timestamp && (
                                                    <p className={`text-[7px] font-black uppercase tracking-widest opacity-30 italic ${msg.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                                                        {new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {isUserTyping && (
                                    <div className="flex justify-start animate-pulse">
                                        <div className="bg-white border border-gray-100 px-5 py-3 rounded-full flex gap-1">
                                            <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce"></div>
                                            <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce delay-100"></div>
                                            <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce delay-200"></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Protocol */}
                            <form onSubmit={handleSendMessage} className="p-6 md:p-8 border-t border-gray-50 bg-white">
                                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-sm border border-transparent focus-within:border-black focus-within:bg-white transition-all duration-500">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="ARCHIVE RESPONSE..."
                                        className="w-full px-6 py-3 bg-transparent text-[11px] font-bold tracking-widest outline-none italic placeholder:text-gray-300"
                                    />
                                    <button 
                                        type="submit" 
                                        className={`p-4 transition-all duration-500 rounded-sm ${newMessage.trim() ? 'bg-black text-white shadow-xl rotate-0' : 'text-gray-300 cursor-not-allowed opacity-50'}`}
                                        disabled={!newMessage.trim()}
                                    >
                                        <HiOutlinePaperAirplane size={20} className="-rotate-45" />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center bg-[#FAFAFA] space-y-6">
                            <div className="w-24 h-24 bg-white border border-gray-50 rounded-full flex items-center justify-center shadow-sm">
                                <HiOutlineChat size={40} className="text-gray-100 animate-pulse"/>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 italic">Protocol Awaiting Selection</h3>
                                <p className="text-[9px] font-bold text-gray-200 uppercase tracking-widest">Select a transmission to engage concierge</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveChatAdminPage;
