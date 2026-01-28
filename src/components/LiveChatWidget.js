'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { HiOutlineChat, HiOutlineX, HiOutlinePaperAirplane, HiOutlineUser } from 'react-icons/hi';
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
        await setDoc(doc(db, 'chats', sessionId), { userName: nameInput }, { merge: true });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !sessionId) return;
        updateTypingStatus(false);
        const chatRef = doc(db, 'chats', sessionId);
        await setDoc(chatRef, { lastMessage: newMessage, lastMessageTimestamp: serverTimestamp(), isUnreadForAdmin: true, userName }, { merge: true });
        await addDoc(collection(chatRef, 'messages'), { text: newMessage, timestamp: serverTimestamp(), sender: 'user' });
        setNewMessage('');
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            <button onClick={handleToggleChat} className="w-16 h-16 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition relative">
                {hasUnread && !isOpen && <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full border-2 border-black"></span>}
                {isOpen ? <HiOutlineX size={28} /> : <HiOutlineChat size={28} />}
            </button>

            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 h-[28rem] bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col">
                    {!isNameSet ? (
                        <div className="flex flex-col items-center justify-center h-full p-6">
                            <HiOutlineUser size={40} className="text-gray-400 mb-4" />
                            <h3 className="font-bold text-lg mb-2">What should we call you?</h3>
                             <form onSubmit={handleNameSubmit} className="w-full flex flex-col items-center">
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    placeholder="Enter your name..."
                                    className="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <button type="submit" className="w-full p-3 bg-black text-white rounded-lg hover:bg-gray-800 font-bold transition">Start Chat</button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <header className="p-4 bg-black text-white rounded-t-lg">
                                <h3 className="font-bold">How can we help, {userName}?</h3>
                                <p className="text-xs h-4">{isAdminTyping ? 'Admin is typing...' : ''}</p>
                            </header>
                            <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs p-3 my-1 rounded-2xl ${msg.sender === 'user' ? 'bg-black text-white' : 'bg-gray-200'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isAdminTyping && (
                                    <div className="flex justify-start"><div className="p-3 my-1 rounded-2xl bg-gray-200"><span className="italic text-sm">Typing...</span></div></div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                    <button type="submit" className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition"><HiOutlinePaperAirplane size={20} className="-rotate-45" /></button>
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
