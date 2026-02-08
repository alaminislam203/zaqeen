'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';

const LiveChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [userName, setUserName] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [isNameSet, setIsNameSet] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [isAdminTyping, setIsAdminTyping] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Session and Identity Recovery
    useEffect(() => {
        setMounted(true);
    }, []);

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

            // Check if chat was previously minimized
            const wasMinimized = localStorage.getItem('chatMinimized') === 'true';
            setIsMinimized(wasMinimized);
        }
    }, []);

    // Real-time messaging and typing protocol
    useEffect(() => {
        if (!sessionId || !isNameSet) return;

        setConnectionStatus('connected');

        const messagesQuery = query(
            collection(db, `chats/${sessionId}/messages`), 
            orderBy('timestamp', 'asc')
        );
        
        const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            
            // Count unread messages
            if (!isOpen) {
                const adminMessages = msgs.filter(msg => 
                    msg.sender === 'admin' && 
                    msg.timestamp && 
                    msg.timestamp.toDate() > new Date(Date.now() - 60000) // Last minute
                );
                if (adminMessages.length > 0) {
                    setUnreadCount(adminMessages.length);
                    setHasUnread(true);
                    
                    // Play notification sound
                    playNotificationSound();
                }
            }

            const lastMessage = msgs[msgs.length - 1];
            if (isOpen && lastMessage && lastMessage.sender === 'admin') {
                setDoc(doc(db, 'chats', sessionId), { 
                    isUnreadForUser: false 
                }, { merge: true });
                setHasUnread(false);
                setUnreadCount(0);
            }
        }, (error) => {
            console.error("Message subscription error:", error);
            setConnectionStatus('error');
        });

        const chatRef = doc(db, 'chats', sessionId);
        const unsubscribeTyping = onSnapshot(chatRef, (docSnap) => {
            if (docSnap.exists()) {
                setIsAdminTyping(docSnap.data().isAdminTyping || false);
                setConnectionStatus('connected');
            }
        }, (error) => {
            console.error("Typing subscription error:", error);
            setConnectionStatus('error');
        });

        return () => {
            unsubscribeMessages();
            unsubscribeTyping();
        };
    }, [sessionId, isOpen, isNameSet]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isAdminTyping]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && isNameSet && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isNameSet]);

    // Typing status (Debounced)
    const updateTypingStatus = useCallback(
        debounce((isTyping) => {
            if (sessionId) {
                setDoc(doc(db, 'chats', sessionId), { 
                    isUserTyping: isTyping,
                    lastActivity: serverTimestamp()
                }, { merge: true });
            }
        }, 500),
        [sessionId]
    );

    useEffect(() => {
        if (newMessage) {
            updateTypingStatus(true);
        }
        const timeoutId = setTimeout(() => updateTypingStatus(false), 3000);
        return () => clearTimeout(timeoutId);
    }, [newMessage, updateTypingStatus]);

    const playNotificationSound = () => {
        // Simple notification sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio notification failed:', error);
        }
    };

    const handleToggleChat = async () => {
        setIsOpen(!isOpen);
        
        if (!isOpen && sessionId) {
            setHasUnread(false);
            setUnreadCount(0);
            const chatRef = doc(db, 'chats', sessionId);
            try {
                const chatSnap = await getDoc(chatRef);
                if (chatSnap.exists() && chatSnap.data().isUnreadForUser) {
                    await setDoc(chatRef, { isUnreadForUser: false }, { merge: true });
                }
            } catch (err) {
                console.error("Access error:", err);
            }
        }
    };

    const handleMinimize = () => {
        setIsMinimized(!isMinimized);
        if (typeof window !== 'undefined') {
            localStorage.setItem('chatMinimized', (!isMinimized).toString());
        }
    };

    const handleNameSubmit = async (e) => {
        e.preventDefault();
        if (nameInput.trim().length < 2 || !sessionId) {
            toast.error('Please enter a valid name (min 2 characters)', {
                style: {
                    borderRadius: '0px',
                    background: '#000',
                    color: '#fff',
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                }
            });
            return;
        }
        
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
            status: 'active',
            userAgent: navigator.userAgent,
            source: 'website'
        }, { merge: true });

        await addDoc(collection(chatRef, 'messages'), {
            text: `Welcome to Zaqeen, ${nameInput}. Our concierge team will assist you shortly.`,
            timestamp: serverTimestamp(),
            sender: 'system',
            type: 'welcome'
        });

        toast.success('Connected to support', {
            style: {
                borderRadius: '0px',
                background: '#000',
                color: '#fff',
                fontSize: '10px',
                letterSpacing: '0.1em',
            }
        });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !sessionId) return;

        const currentMsg = newMessage;
        setNewMessage('');
        updateTypingStatus(false);
        setShowQuickReplies(false);

        const chatRef = doc(db, 'chats', sessionId);
        await setDoc(chatRef, {
            lastMessage: currentMsg,
            lastMessageTimestamp: serverTimestamp(),
            isUnreadForAdmin: true,
            userName,
            status: 'active'
        }, { merge: true });

        await addDoc(collection(chatRef, 'messages'), {
            text: currentMsg,
            timestamp: serverTimestamp(),
            sender: 'user',
            read: false
        });

        // Generate AI response if no admin is available
        setTimeout(async () => {
            try {
                const prompt = `You are a helpful customer support assistant for Zaqeen, a fashion e-commerce store. Respond to this customer message: "${currentMsg}". Keep the response friendly, helpful, and under 100 words. If it's a question about products, shipping, or returns, provide accurate information.`;
                const aiResponse = await generateWithAI(prompt);

                await addDoc(collection(chatRef, 'messages'), {
                    text: aiResponse,
                    timestamp: serverTimestamp(),
                    sender: 'admin',
                    read: false,
                    isAI: true
                });

                await setDoc(chatRef, {
                    lastMessage: aiResponse,
                    lastMessageTimestamp: serverTimestamp(),
                    isUnreadForUser: true
                }, { merge: true });

            } catch (error) {
                console.error('AI response failed:', error);
            }
        }, 1000); // Delay to simulate typing
    };

    const handleQuickReply = async (message) => {
        setNewMessage(message);
        setTimeout(() => {
            const form = document.querySelector('form');
            form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }, 100);
    };

    const quickReplies = [
        { icon: '📦', text: 'Track my order', message: 'I want to track my order' },
        { icon: '💳', text: 'Payment options', message: 'What payment methods do you accept?' },
        { icon: '🚚', text: 'Shipping info', message: 'Tell me about shipping' },
        { icon: '↩️', text: 'Return policy', message: 'What is your return policy?' },
    ];

    const getStatusColor = () => {
        switch(connectionStatus) {
            case 'connected': return 'bg-green-500';
            case 'connecting': return 'bg-yellow-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    if (!mounted || !sessionId) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] selection:bg-black selection:text-white font-sans">
            {/* Trigger Button */}
            <button 
                onClick={handleToggleChat} 
                className={`relative flex items-center justify-center rounded-full shadow-2xl transition-all duration-500 group ${
                    isOpen 
                        ? 'w-14 h-14 bg-white text-black border-2 border-gray-200 hover:border-black' 
                        : 'w-16 h-16 bg-gradient-to-br from-black to-gray-900 text-white hover:scale-110 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]'
                }`}
                aria-label="Open chat"
            >
                {/* Unread Badge */}
                {hasUnread && !isOpen && (
                    <span className="absolute -top-2 -right-2 min-w-[24px] h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-2 border-2 border-white animate-bounce shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}

                {/* Pulse Ring */}
                {!isOpen && (
                    <span className="absolute inset-0 rounded-full bg-black animate-ping opacity-20"></span>
                )}

                {/* Icon */}
                <div className="relative z-10">
                    {isOpen ? (
                        <svg className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-7 h-7 group-hover:scale-110 transition-transform" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    )}
                </div>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className={`
                    fixed md:absolute 
                    ${isMinimized ? 'bottom-20 md:bottom-20 h-16' : 'bottom-0 md:bottom-20 h-[100dvh] md:h-[36rem]'}
                    right-0 w-screen md:w-[26rem]
                    bg-white md:rounded-lg shadow-[0_40px_100px_rgba(0,0,0,0.2)] 
                    flex flex-col overflow-hidden
                    transition-all duration-500 ease-out
                    border border-gray-200
                    animate-in slide-in-from-bottom-10 md:slide-in-from-right-10 duration-500
                `}>
                    
                    {/* Header */}
                    <header className="relative p-5 bg-gradient-to-br from-black via-gray-900 to-black text-white flex justify-between items-center border-b border-white/10">
                        {/* Animated background */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 40px)`
                            }}></div>
                        </div>

                        <div className="flex items-center gap-3 relative z-10">
                            {/* Logo/Avatar */}
                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 overflow-hidden">
                                <span className="text-lg font-black">Z</span>
                            </div>
                            
                            <div className="space-y-1">
                                <h3 className="font-black uppercase tracking-wider text-sm leading-none">
                                    {isNameSet ? `Hello, ${userName}` : 'Zaqeen Support'}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`}></div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                        {connectionStatus === 'connected' ? 'Online' : connectionStatus === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Header Actions */}
                        <div className="flex items-center gap-2 relative z-10">
                            <button
                                onClick={handleMinimize}
                                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                aria-label="Minimize"
                            >
                                <svg className="w-4 h-4" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={handleToggleChat}
                                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-4 h-4" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </header>

                    {/* Content Area */}
                    {!isMinimized && (
                        <>
                            {!isNameSet ? (
                                // Name Input Screen
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 bg-gradient-to-br from-gray-50 to-white">
                                    <div className="relative">
                                        <div className="w-24 h-24 bg-gradient-to-br from-black to-gray-800 text-white rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in duration-500">
                                            <svg className="w-12 h-12" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="absolute inset-0 bg-black/20 rounded-full blur-2xl -z-10 animate-pulse"></div>
                                    </div>
                                    
                                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <span className="inline-block text-[8px] uppercase tracking-[0.4em] text-gray-500 font-black px-3 py-1 bg-black/5 rounded-full">
                                            Welcome to Zaqeen
                                        </span>
                                        <h3 className="font-black text-2xl uppercase tracking-tight text-black">
                                            Let's Connect
                                        </h3>
                                        <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed">
                                            Please introduce yourself to start chatting with our support team
                                        </p>
                                    </div>
                                    
                                    <form onSubmit={handleNameSubmit} className="w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={nameInput}
                                                onChange={(e) => setNameInput(e.target.value)}
                                                placeholder="Your Name"
                                                className="w-full bg-white border-2 border-gray-200 focus:border-black px-6 py-4 text-sm font-semibold outline-none transition-all rounded-lg"
                                                autoFocus
                                            />
                                            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/5 to-transparent opacity-0 focus-within:opacity-100 transition-opacity blur-xl rounded-lg"></div>
                                        </div>
                                        
                                        <button 
                                            type="submit" 
                                            disabled={nameInput.trim().length < 2}
                                            className="w-full px-6 py-4 bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all rounded-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                                        >
                                            Start Conversation
                                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </button>
                                    </form>

                                    {/* Security Badge */}
                                    <div className="flex items-center gap-2 text-[9px] text-gray-500 pt-4">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-semibold">Secure & Private</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Messages Area */}
                                    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                                        {messages.length === 0 && (
                                            <div className="text-center py-12 space-y-4 animate-in fade-in duration-500">
                                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    How can we assist you today?
                                                </p>
                                            </div>
                                        )}

                                        {messages.map((msg, index) => (
                                            <div 
                                                key={msg.id} 
                                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <div className={`group max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                                    {/* Message Bubble */}
                                                    <div className={`relative px-4 py-3 text-sm leading-relaxed shadow-sm transition-all ${
                                                        msg.sender === 'user' 
                                                            ? 'bg-black text-white rounded-2xl rounded-br-sm' 
                                                            : msg.type === 'welcome' || msg.sender === 'system'
                                                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-gray-800 rounded-2xl'
                                                            : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-sm'
                                                    }`}>
                                                        {msg.text}
                                                        
                                                        {/* Message tail */}
                                                        {msg.sender === 'user' ? (
                                                            <div className="absolute -bottom-0 -right-0 w-4 h-4 bg-black transform rotate-45 translate-x-1 translate-y-1"></div>
                                                        ) : msg.type !== 'welcome' && msg.sender !== 'system' && (
                                                            <div className="absolute -bottom-0 -left-0 w-4 h-4 bg-white border-l border-b border-gray-200 transform rotate-45 -translate-x-1 translate-y-1"></div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Timestamp */}
                                                    <span className={`text-[9px] font-medium text-gray-400 px-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                                                        msg.sender === 'user' ? 'text-right' : 'text-left'
                                                    }`}>
                                                        {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sending...'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Admin Typing Indicator */}
                                        {isAdminTyping && (
                                            <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                                                <div className="bg-white border border-gray-200 px-5 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                                                    </div>
                                                    <span className="text-[9px] text-gray-500 font-medium">Support is typing</span>
                                                </div>
                                            </div>
                                        )}

                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Quick Replies */}
                                    {showQuickReplies && messages.length === 1 && (
                                        <div className="px-6 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mb-3">
                                                Quick Actions
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {quickReplies.map((reply, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleQuickReply(reply.message)}
                                                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-black hover:bg-gray-50 rounded-lg transition-all text-left group"
                                                    >
                                                        <span className="text-lg">{reply.icon}</span>
                                                        <span className="text-[10px] font-semibold text-gray-700 group-hover:text-black">
                                                            {reply.text}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Input Form */}
                                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                                        <div className="flex items-end gap-3">
                                            <div className="flex-1 relative">
                                                <textarea
                                                    ref={inputRef}
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendMessage(e);
                                                        }
                                                    }}
                                                    placeholder="Type your message..."
                                                    rows="1"
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-black focus:bg-white rounded-xl text-sm outline-none transition-all resize-none max-h-32"
                                                    style={{ minHeight: '44px' }}
                                                />
                                            </div>
                                            
                                            <button 
                                                type="submit" 
                                                disabled={!newMessage.trim()}
                                                className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                                                    newMessage.trim() 
                                                        ? 'bg-black text-white hover:scale-105 shadow-lg hover:shadow-xl' 
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                                aria-label="Send message"
                                            >
                                                <svg className="w-5 h-5 transform rotate-45" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Powered by */}
                                        <div className="flex items-center justify-center gap-2 mt-3 text-[8px] text-gray-400">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-semibold">Secured by Zaqeen</span>
                                        </div>
                                    </form>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 10px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default LiveChatWidget;
