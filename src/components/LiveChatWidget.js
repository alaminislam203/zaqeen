'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { HiOutlineChatAlt2, HiOutlineX, HiOutlinePaperAirplane, HiOutlineUserCircle } from 'react-icons/hi';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';

const LiveChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [userName, setUserName] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [isNameSet, setIsNameSet] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [isAdminTyping, setIsAdminTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // ১. সেশন এবং আইডেন্টিটি রিকভারি (Server-Safe Way)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            let storedSessionId = localStorage.getItem('chatSessionId');
            if (!storedSessionId) {
                storedSessionId = uuidv4();
                localStorage.setItem('chatSessionId', storedSessionId);
            }
            setSessionId(storedSessionId);

            const storedUserName = localStorage.getItem('chatUserName');
            if (storedUserName) {
                setUserName(storedUserName);
                setIsNameSet(true);
            }
        }
    }, []);

    // ২. রিয়েল-টাইম মেসেজিং এবং টাইপিং প্রোটোকল
    useEffect(() => {
        if (!sessionId || !isNameSet) return;

        const messagesQuery = query(collection(db, `chats/${sessionId}/messages`), orderBy('timestamp', 'asc'));
        const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            
            const lastMessage = msgs[msgs.length - 1];
            if (isOpen && lastMessage && lastMessage.sender === 'admin') {
                setDoc(doc(db, 'chats', sessionId), { isUnreadForUser: false }, { merge: true });
            } else if (!isOpen && lastMessage && lastMessage.sender === 'admin') {
                setHasUnread(true);
            }
        });

        const chatRef = doc(db, 'chats', sessionId);
        const unsubscribeTyping = onSnapshot(chatRef, (doc) => {
            if (doc.exists()) {
                setIsAdminTyping(doc.data().isAdminTyping || false);
            }
        });

        return () => {
            unsubscribeMessages();
            unsubscribeTyping();
        };
    }, [sessionId, isOpen, isNameSet]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isAdminTyping]);

    // ৩. টাইপিং স্ট্যাটাস (Debounced)
    const updateTypingStatus = useCallback(debounce((isTyping) => {
        if (sessionId) {
            setDoc(doc(db, 'chats', sessionId), { isUserTyping: isTyping }, { merge: true });
        }
    }, 500), [sessionId]);

    useEffect(() => {
        if (newMessage) updateTypingStatus(true);
        const timeoutId = setTimeout(() => updateTypingStatus(false), 3000);
        return () => clearTimeout(timeoutId);
    }, [newMessage, updateTypingStatus]);

    const handleToggleChat = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && sessionId) {
            setHasUnread(false);
            const chatRef = doc(db, 'chats', sessionId);
            try {
                const chatSnap = await getDoc(chatRef);
                if (chatSnap.exists() && chatSnap.data().isUnreadForUser) {
                    await setDoc(chatRef, { isUnreadForUser: false }, { merge: true });
                }
            } catch (err) {
                console.error("Access denied:", err);
            }
        }
    };

    const handleNameSubmit = async (e) => {
        e.preventDefault();
        if (nameInput.trim().length < 2 || !sessionId) return;
        
        if (typeof window !== 'undefined') {
            localStorage.setItem('chatUserName', nameInput);
        }
        setUserName(nameInput);
        setIsNameSet(true);
        
        const chatRef = doc(db, 'chats', sessionId);
        await setDoc(chatRef, { 
            userName: nameInput, 
            createdAt: serverTimestamp(),
            isUnreadForAdmin: true,
            status: 'active' 
        }, { merge: true });

        await addDoc(collection(chatRef, 'messages'), {
            text: `Welcome to the Archive, ${nameInput}. Our concierge will be with you shortly.`,
            timestamp: serverTimestamp(),
            sender: 'admin'
        });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !sessionId) return;
        
        const currentMsg = newMessage;
        setNewMessage('');
        updateTypingStatus(false);
        
        const chatRef = doc(db, 'chats', sessionId);
        await setDoc(chatRef, { 
            lastMessage: currentMsg, 
            lastMessageTimestamp: serverTimestamp(), 
            isUnreadForAdmin: true, 
            userName 
        }, { merge: true });
        
        await addDoc(collection(chatRef, 'messages'), { 
            text: currentMsg, 
            timestamp: serverTimestamp(), 
            sender: 'user' 
        });
    };

    // ৪. Hydration Error প্রতিরোধ করতে সেশন আইডি না পাওয়া পর্যন্ত রেন্ডার অফ রাখা
    if (typeof window !== 'undefined' && !sessionId) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] selection:bg-black selection:text-white font-sans">
            {/* Trigger Button */}
            <button 
                onClick={handleToggleChat} 
                className={`flex items-center justify-center rounded-full shadow-2xl transition-all duration-500 relative group
                ${isOpen ? 'w-12 h-12 bg-white text-black border border-gray-100 rotate-90' : 'w-16 h-16 bg-black text-white hover:scale-105'}`}
            >
                {hasUnread && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-[3px] border-white animate-bounce"></span>
                )}
                {isOpen ? <HiOutlineX size={20} /> : <HiOutlineChatAlt2 size={28} className="group-hover:rotate-12 transition-transform" />}
            </button>

            {/* Chat UI */}
            {isOpen && (
                <div className={`
                    fixed md:absolute bottom-0 md:bottom-20 right-0 w-screen md:w-[24rem] h-[100dvh] md:h-[35rem] 
                    bg-white md:rounded-sm shadow-[0_40px_100px_rgba(0,0,0,0.15)] flex flex-col animate-fadeIn overflow-hidden
                    transition-all
                `}>
                    {!isNameSet ? (
                        <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-8 bg-[#FDFDFD]">
                            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center shadow-2xl">
                                <HiOutlineUserCircle size={40} />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[9px] uppercase tracking-[0.5em] text-gray-400 font-black italic block">Verification</span>
                                <h3 className="font-black text-2xl uppercase tracking-tighter italic text-black">Identity?</h3>
                            </div>
                             <form onSubmit={handleNameSubmit} className="w-full space-y-4">
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    placeholder="IDENTIFIER NAME"
                                    className="w-full bg-white border border-gray-100 p-5 text-[11px] font-black tracking-[0.3em] outline-none focus:border-black transition-all text-center"
                                />
                                <button type="submit" className="w-full p-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-neutral-800 transition">Initiate Protocol</button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <header className="p-6 bg-black text-white flex justify-between items-center">
                                <div className="space-y-1 text-left">
                                    <span className="text-[8px] uppercase tracking-[0.5em] font-black text-gray-500 italic block">Zaqeen Concierge</span>
                                    <h3 className="font-black uppercase tracking-widest text-xs italic leading-none">Greetings, {userName}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                     <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Consultant Online</span>
                                </div>
                            </header>

                            <div className="flex-grow p-6 overflow-y-auto bg-white space-y-6 scrollbar-hide">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] px-5 py-3 text-[12px] font-medium leading-relaxed shadow-sm transition-all ${
                                            msg.sender === 'user' 
                                            ? 'bg-black text-white rounded-l-2xl rounded-tr-sm' 
                                            : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-r-2xl rounded-tl-sm'
                                        }`}>
                                            {msg.text}
                                            <span className={`block text-[7px] mt-2 opacity-30 font-black uppercase tracking-widest ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                                {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Syncing'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {isAdminTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-50 px-4 py-2 rounded-full animate-pulse border border-gray-100 flex gap-1">
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-50">
                                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-sm border border-transparent focus-within:border-black transition-all">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your inquiry..."
                                        className="w-full px-4 py-2 bg-transparent text-[11px] font-bold tracking-tight outline-none"
                                    />
                                    <button 
                                        type="submit" 
                                        className={`p-3 transition-all ${newMessage.trim() ? 'bg-black text-white' : 'text-gray-200 cursor-not-allowed'}`}
                                        disabled={!newMessage.trim()}
                                    >
                                        <HiOutlinePaperAirplane size={18} className="rotate-90" />
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default LiveChatWidget;
