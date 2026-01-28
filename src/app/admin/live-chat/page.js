'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { HiOutlineChat, HiOutlineUsers, HiOutlinePaperAirplane, HiOutlineArrowLeft, HiOutlineTrash } from 'react-icons/hi';
import { debounce } from 'lodash';

// Helper function to delete all messages in a subcollection
async function deleteSubcollection(db, collectionPath) {
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef);
    const snapshot = await getDocs(q);

    const promises = [];
    snapshot.forEach(doc => {
        promises.push(deleteDoc(doc.ref));
    });

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

    const debouncedUpdateTyping = useMemo(
        () =>
            debounce((session, isTyping) => {
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

        return () => {
            clearTimeout(timer);
        };
    }, [newMessage, selectedSession, debouncedUpdateTyping]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !selectedSession) return;
        debouncedUpdateTyping.cancel();
        const chatRef = doc(db, 'chats', selectedSession.id);
        await setDoc(chatRef, { isAdminTyping: false }, { merge: true });
        const messageData = { text: newMessage, timestamp: serverTimestamp(), sender: 'admin' };
        await addDoc(collection(db, `chats/${selectedSession.id}/messages`), messageData);
        await updateDoc(doc(db, 'chats', selectedSession.id), { lastMessage: newMessage, lastMessageTimestamp: serverTimestamp(), isUnreadForUser: true });
        setNewMessage('');
    };

    const handleDeleteChat = async (e, sessionId) => {
        e.stopPropagation(); // Prevent selecting the chat
        if (window.confirm('Are you sure you want to delete this chat permanently?')) {
            try {
                // Delete all messages in the subcollection
                await deleteSubcollection(db, `chats/${sessionId}/messages`);
                // Delete the main chat document
                await deleteDoc(doc(db, 'chats', sessionId));

                if (selectedSession?.id === sessionId) {
                    setSelectedSession(null);
                }
            } catch (error) {
                console.error("Error deleting chat: ", error);
            }
        }
    };

    return (
        <div className="p-4 md:p-10 bg-gray-50 min-h-screen flex h-full">
            <div className="w-full flex bg-white border border-gray-100 rounded-lg shadow-sm h-[calc(100vh-8rem)]">
                <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedSession ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200">
                        <h1 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2"><HiOutlineChat /> Live Chat</h1>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Active Conversations</p>
                    </div>
                    <div className="overflow-y-auto flex-grow">
                        {loading ? <p className="p-4">Loading chats...</p> :
                            chatSessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => setSelectedSession(session)}
                                    className={`p-4 border-b border-gray-200 cursor-pointer flex justify-between items-center ${selectedSession?.id === session.id ? 'bg-black text-white' : 'hover:bg-gray-50'}`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold truncate text-sm">{session.userName || `User ${session.id.substring(0, 6)}`}</p>
                                            {session.isUnreadForAdmin && <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>}
                                        </div>
                                        <p className={`text-xs truncate ${session.isUserTyping ? 'text-emerald-500 italic' : 'text-gray-400'}`}>
                                            {session.isUserTyping ? 'Typing...' : session.lastMessage}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">{session.lastMessageTimestamp ? formatDistanceToNow(session.lastMessageTimestamp, { addSuffix: true }) : ''}</p>
                                    </div>
                                    <button onClick={(e) => handleDeleteChat(e, session.id)} className="text-gray-400 hover:text-rose-500 p-2 rounded-full">
                                        <HiOutlineTrash size={18}/>
                                    </button>
                                </div>
                            ))
                        }
                         {!loading && chatSessions.length === 0 && (
                            <div className="text-center p-10 text-gray-400">
                                <HiOutlineUsers size={48} className="mx-auto"/>
                                <p className="mt-2">No active chats.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`w-full flex flex-col ${selectedSession ? 'flex' : 'hidden md:flex'}`}>
                     {selectedSession ? (
                        <>
                            <div className="p-4 border-b border-gray-200 flex items-center gap-4">
                                <button onClick={() => setSelectedSession(null)} className="md:hidden p-2"><HiOutlineArrowLeft /></button>
                                <h2 className="font-bold">Chat with {selectedSession.userName || `User ${selectedSession.id.substring(0, 6)}`}</h2>
                            </div>
                            <div className="flex-grow p-4 overflow-y-auto bg-gray-50/50">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 my-1 rounded-2xl ${msg.sender === 'admin' ? 'bg-black text-white' : 'bg-gray-200'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isUserTyping && (
                                    <div className="flex justify-start">
                                        <div className="p-3 my-1 rounded-2xl bg-gray-200">
                                            <span className="italic text-sm">Typing...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full p-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black transition"
                                    />
                                    <button type="submit" className="p-3 bg-black text-white rounded-full hover:bg-gray-800 transition"><HiOutlinePaperAirplane size={24} className="-rotate-45" /></button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-grow flex items-center justify-center bg-gray-50/50">
                            <div className="text-center text-gray-400">
                                <HiOutlineChat size={64} className="mx-auto"/>
                                <p className="mt-4">Select a chat to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveChatAdminPage;
