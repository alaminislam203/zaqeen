'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { HiOutlineChatAlt2, HiOutlineX, HiOutlinePaperAirplane, HiOutlineUserCircle } from 'react-icons/hi';
import { debounce } from 'lodash';

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

    // সেশন এবং নাম হ্যান্ডলিং
    useEffect(() => {
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
    }, []);

    // মেসেজ এবং টাইপিং লিসেনার
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

    // টাইপিং স্ট্যাটাস আপডেট (Debounced)
    const updateTypingStatus = useCallback(debounce((isTyping) => {
        if (sessionId) {
            setDoc(doc(db, 'chats', sessionId), { isUserTyping: isTyping }, { merge: true });
        }
    }, 500), [sessionId]);

    useEffect(() => {
        if (newMessage) {
            updateTypingStatus(true);
        }
        const timeoutId = setTimeout(() => updateTypingStatus(false), 3000);
        return () => clearTimeout(timeoutId);
    }, [newMessage, updateTypingStatus]);

    const handleToggleChat = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && sessionId) {
            setHasUnread(false);
            const chatRef = doc(db, 'chats', sessionId);
            const chatSnap = await getDoc(chatRef);
            if (chatSnap.exists() && chatSnap.data().isUnreadForUser) {
                await setDoc(chatRef, { isUnreadForUser: false }, { merge: true });
            }
        }
    };

    const handleNameSubmit = async (e) => {
        e.preventDefault();
        if (nameInput.trim() === '' || !sessionId) return;
        
        localStorage.setItem('chatUserName', nameInput);
        setUserName(nameInput);
        setIsNameSet(true);
        
        const chatRef = doc(db, 'chats', sessionId);
        await setDoc(chatRef, { 
            userName: nameInput, 
            createdAt: serverTimestamp(),
            status: 'active' 
        }, { merge: true });

        // অটোমেটিক গ্রিটিং মেসেজ (ব্র্যান্ডের গাম্ভীর্য রক্ষায়)
        await addDoc(collection(chatRef, 'messages'), {
            text: `Welcome, ${nameInput}. How may our concierge assist you today?`,
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

    return (
        <div className="fixed bottom-6 right-6 z-[9999] selection:bg-black selection:text-white font-sans">
            {/* Chat Toggle Button */}
            <button 
                onClick={handleToggleChat} 
                className="w-16 h-16 bg-black text-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-110 transition-all duration-500 relative group"
            >
                {hasUnread && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-[3px] border-white animate-bounce"></span>
                )}
                {isOpen ? <HiOutlineX size={24} /> : <HiOutlineChatAlt2 size={28} className="group-hover:rotate-12 transition-transform" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[22rem] h-[32rem] bg-white border border-gray-100 rounded-sm shadow-[0_40px_100px_rgba(0,0,0,0.1)] flex flex-col animate-fadeIn overflow-hidden">
                    {!isNameSet ? (
                        <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-8">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                                <HiOutlineUserCircle size={40} className="text-gray-300" />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[9px] uppercase tracking-[0.4em] text-gray-400 font-black italic block">Verification</span>
                                <h3 className="font-black text-xl uppercase tracking-tighter italic">Identity?</h3>
                            </div>
                             <form onSubmit={handleNameSubmit} className="w-full space-y-4">
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    placeholder="ENTER YOUR NAME"
                                    className="w-full bg-gray-50 border-none p-4 text-[11px] font-black tracking-widest outline-none focus:ring-1 ring-black transition rounded-sm"
                                />
                                <button type="submit" className="w-full p-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-gray-800 transition shadow-xl">Initiate Access</button>
                            </form>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <header className="p-6 bg-black text-white flex flex-col space-y-1">
                                <span className="text-[8px] uppercase tracking-[0.4em] font-black text-gray-500">Zaqeen Concierge</span>
                                <h3 className="font-black uppercase tracking-widest text-xs italic">Greetings, {userName}</h3>
                                {isAdminTyping && <p className="text-[9px] italic text-emerald-400 animate-pulse">Consultant is typing...</p>}
                            </header>

                            {/* Message Area */}
                            <div className="flex-grow p-6 overflow-y-auto bg-[#FDFDFD] space-y-4 scrollbar-hide">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] px-4 py-3 text-[12px] leading-relaxed ${
                                            msg.sender === 'user' 
                                            ? 'bg-black text-white rounded-l-2xl rounded-tr-2xl' 
                                            : 'bg-white border border-gray-100 text-gray-700 rounded-r-2xl rounded-tl-2xl shadow-sm'
                                        }`}>
                                            {msg.text}
                                            {msg.timestamp && (
                                                <span className={`block text-[7px] mt-2 opacity-40 font-black uppercase tracking-widest ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                                    {new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-50">
                                <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-1 border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your inquiry..."
                                        className="w-full py-3 bg-transparent text-[11px] font-bold tracking-tight outline-none placeholder:text-gray-300"
                                    />
                                    <button 
                                        type="submit" 
                                        className={`p-2 transition-all ${newMessage.trim() ? 'text-black' : 'text-gray-200'}`}
                                        disabled={!newMessage.trim()}
                                    >
                                        <HiOutlinePaperAirplane size={20} className="rotate-45" />
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
