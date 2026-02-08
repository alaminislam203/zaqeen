'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp, setDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';

// Helper function to delete subcollection
async function deleteSubcollection(db, collectionPath) {
    const q = query(collection(db, collectionPath));
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(promises);
}

const LiveChatAdminPage = () => {
    const [chatSessions, setChatSessions] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isUserTyping, setIsUserTyping] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, unread, archived
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Quick Reply Templates
    const quickReplies = [
        "Thank you for contacting us. How can I help you today?",
        "I'll check that for you right away.",
        "Your order has been confirmed and will be processed shortly.",
        "We've received your message and will respond within 24 hours.",
        "Is there anything else I can help you with?",
        "Thank you for your patience!"
    ];

    // 1. Chat Sessions Real-time Listener
    useEffect(() => {
        const q = query(collection(db, 'chats'), orderBy('lastMessageTimestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                lastMessageTimestamp: doc.data().lastMessageTimestamp?.toDate(),
            }));
            setChatSessions(sessions);
            setFilteredSessions(sessions);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Filter and Search Logic
    useEffect(() => {
        let filtered = [...chatSessions];

        // Apply status filter
        if (filterStatus === 'unread') {
            filtered = filtered.filter(session => session.isUnreadForAdmin);
        } else if (filterStatus === 'archived') {
            filtered = filtered.filter(session => session.isArchived);
        }

        // Apply search
        if (searchTerm.trim()) {
            filtered = filtered.filter(session => 
                session.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                session.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredSessions(filtered);
    }, [chatSessions, filterStatus, searchTerm]);

    // 3. Messages and Typing Listener
    useEffect(() => {
        if (!selectedSession) return;

        const messagesQuery = query(
            collection(db, `chats/${selectedSession.id}/messages`),
            orderBy('timestamp', 'asc')
        );

        const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));
            setMessages(msgs);
        });

        const chatRef = doc(db, 'chats', selectedSession.id);
        const unsubscribeTyping = onSnapshot(chatRef, (doc) => {
            if (doc.exists()) {
                setIsUserTyping(doc.data().isUserTyping || false);
            }
        });

        // Mark as read
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

    // 4. Admin Typing Status (Debounced)
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

    // 5. Send Message
    const handleSendMessage = async (e, customMessage = null) => {
        if (e) e.preventDefault();
        
        const messageToSend = customMessage || newMessage;
        if (messageToSend.trim() === '' || !selectedSession) return;
        
        debouncedUpdateTyping.cancel();
        setNewMessage('');
        setShowQuickReplies(false);

        try {
            const chatRef = doc(db, 'chats', selectedSession.id);
            await setDoc(chatRef, { isAdminTyping: false }, { merge: true });
            
            await addDoc(collection(db, `chats/${selectedSession.id}/messages`), {
                text: messageToSend,
                timestamp: serverTimestamp(),
                sender: 'admin'
            });

            await updateDoc(chatRef, {
                lastMessage: messageToSend,
                lastMessageTimestamp: serverTimestamp(),
                isUnreadForUser: true
            });

            inputRef.current?.focus();
        } catch (err) {
            toast.error("Failed to send message", {
                style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
            });
        }
    };

    // 6. Delete Chat
    const handleDeleteChat = async (e, sessionId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            try {
                await deleteSubcollection(db, `chats/${sessionId}/messages`);
                await deleteDoc(doc(db, 'chats', sessionId));
                if (selectedSession?.id === sessionId) setSelectedSession(null);
                toast.success("Conversation deleted successfully", {
                    style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
                });
            } catch (error) {
                toast.error("Failed to delete conversation");
            }
        }
    };

    // 7. Archive Chat
    const handleArchiveChat = async (sessionId) => {
        try {
            const chatRef = doc(db, 'chats', sessionId);
            const chatSnap = await getDoc(chatRef);
            const isArchived = chatSnap.data()?.isArchived || false;
            
            await updateDoc(chatRef, { isArchived: !isArchived });
            toast.success(isArchived ? "Chat unarchived" : "Chat archived", {
                style: { borderRadius: '0px', background: '#000', color: '#fff' }
            });
        } catch (error) {
            toast.error("Failed to archive chat");
        }
    };

    // 8. Copy Message
    const handleCopyMessage = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Message copied to clipboard", {
            style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px' }
        });
    };

    // Stats calculation
    const stats = useMemo(() => {
        const unreadCount = chatSessions.filter(s => s.isUnreadForAdmin).length;
        const archivedCount = chatSessions.filter(s => s.isArchived).length;
        const activeCount = chatSessions.filter(s => !s.isArchived).length;
        
        return { unreadCount, archivedCount, activeCount };
    }, [chatSessions]);

    return (
        <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen selection:bg-black selection:text-white">
            <div className="max-w-[1600px] mx-auto">
                
                {/* Header with Stats */}
                <header className="mb-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-6">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-400 block">Communication Hub</span>
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Live Support</h1>
                        </div>

                        {/* Stats Cards */}
                        <div className="flex gap-3">
                            <div className="bg-black text-white px-6 py-3">
                                <p className="text-[8px] font-black uppercase tracking-wider text-gray-400 mb-1">Active</p>
                                <p className="text-2xl font-black">{stats.activeCount}</p>
                            </div>
                            <div className="bg-amber-500 text-white px-6 py-3">
                                <p className="text-[8px] font-black uppercase tracking-wider text-amber-100 mb-1">Unread</p>
                                <p className="text-2xl font-black">{stats.unreadCount}</p>
                            </div>
                            <div className="bg-gray-200 text-gray-700 px-6 py-3">
                                <p className="text-[8px] font-black uppercase tracking-wider text-gray-500 mb-1">Archived</p>
                                <p className="text-2xl font-black">{stats.archivedCount}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Chat Interface */}
                <div className="w-full flex bg-white border border-gray-200 shadow-lg h-[calc(100vh-16rem)] overflow-hidden">
                    
                    {/* Sidebar: Session List */}
                    <div className={`w-full md:w-96 lg:w-[400px] border-r border-gray-200 flex flex-col ${selectedSession ? 'hidden md:flex' : 'flex'}`}>
                        
                        {/* Search and Filters */}
                        <div className="p-4 border-b border-gray-200 space-y-3">
                            {/* Search Bar */}
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search conversations..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-black outline-none transition-all text-[10px] font-bold uppercase tracking-wide"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                    >
                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex gap-1 bg-gray-100 p-1">
                                {[
                                    { id: 'all', label: 'All', count: chatSessions.length },
                                    { id: 'unread', label: 'Unread', count: stats.unreadCount },
                                    { id: 'archived', label: 'Archive', count: stats.archivedCount }
                                ].map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setFilterStatus(filter.id)}
                                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider transition-all ${
                                            filterStatus === filter.id 
                                                ? 'bg-black text-white' 
                                                : 'text-gray-400 hover:text-black'
                                        }`}
                                    >
                                        {filter.label} ({filter.count})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sessions List */}
                        <div className="overflow-y-auto flex-grow">
                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="h-20 bg-gray-50 animate-pulse"></div>
                                    ))}
                                </div>
                            ) : filteredSessions.length === 0 ? (
                                <div className="text-center p-12 space-y-4">
                                    <svg className="w-16 h-16 mx-auto text-gray-200" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                                    </svg>
                                    <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">No conversations found</p>
                                </div>
                            ) : (
                                filteredSessions.map(session => (
                                    <div
                                        key={session.id}
                                        onClick={() => setSelectedSession(session)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer transition-all group ${
                                            selectedSession?.id === session.id 
                                                ? 'bg-black text-white' 
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Avatar */}
                                            <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center font-black text-lg ${
                                                selectedSession?.id === session.id 
                                                    ? 'bg-white text-black' 
                                                    : 'bg-gray-900 text-white'
                                            }`}>
                                                {session.userName?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-black text-[11px] uppercase tracking-wide truncate">
                                                        {session.userName || 'Anonymous User'}
                                                    </p>
                                                    {session.isUnreadForAdmin && (
                                                        <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></span>
                                                    )}
                                                </div>
                                                
                                                <p className={`text-[10px] truncate mb-2 ${
                                                    session.isUserTyping 
                                                        ? 'text-green-500 font-bold animate-pulse' 
                                                        : selectedSession?.id === session.id 
                                                            ? 'text-gray-400' 
                                                            : 'text-gray-500'
                                                }`}>
                                                    {session.isUserTyping ? 'Typing...' : session.lastMessage}
                                                </p>

                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[8px] font-bold uppercase tracking-wider ${
                                                        selectedSession?.id === session.id ? 'text-gray-400' : 'text-gray-400'
                                                    }`}>
                                                        {session.lastMessageTimestamp 
                                                            ? formatDistanceToNow(session.lastMessageTimestamp, { addSuffix: true }) 
                                                            : 'Just now'}
                                                    </span>

                                                    {/* Actions */}
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleArchiveChat(session.id);
                                                            }}
                                                            className={`p-1.5 hover:bg-blue-500 hover:text-white transition-colors ${
                                                                selectedSession?.id === session.id ? 'text-gray-400' : 'text-gray-400'
                                                            }`}
                                                            title={session.isArchived ? "Unarchive" : "Archive"}
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteChat(e, session.id)}
                                                            className={`p-1.5 hover:bg-red-500 hover:text-white transition-colors ${
                                                                selectedSession?.id === session.id ? 'text-gray-400' : 'text-gray-400'
                                                            }`}
                                                            title="Delete"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main: Message Area */}
                    <div className={`flex-1 flex flex-col bg-white ${selectedSession ? 'flex' : 'hidden md:flex'}`}>
                        {selectedSession ? (
                            <>
                                {/* Chat Header */}
                                <header className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => setSelectedSession(null)} 
                                            className="md:hidden p-2 hover:bg-gray-100 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                            </svg>
                                        </button>
                                        
                                        <div className="w-12 h-12 bg-gradient-to-br from-black to-neutral-800 text-white flex items-center justify-center font-black text-xl shadow-lg">
                                            {selectedSession.userName?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        
                                        <div>
                                            <h2 className="font-black text-sm uppercase tracking-wide">
                                                {selectedSession.userName || 'Anonymous User'}
                                            </h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className={`w-2 h-2 rounded-full ${isUserTyping ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                                <span className="text-[9px] font-bold uppercase tracking-wide text-gray-500">
                                                    {isUserTyping ? 'Typing...' : 'Online'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Header Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleArchiveChat(selectedSession.id)}
                                            className="p-2 hover:bg-gray-100 transition-colors"
                                            title={selectedSession.isArchived ? "Unarchive" : "Archive"}
                                        >
                                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                            </svg>
                                        </button>
                                    </div>
                                </header>

                                {/* Messages Area */}
                                <div className="flex-grow p-6 overflow-y-auto bg-gradient-to-b from-gray-50 to-white space-y-6">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center space-y-3">
                                                <svg className="w-16 h-16 mx-auto text-gray-200" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                                </svg>
                                                <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">No messages yet</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((msg, index) => {
                                                const isLastInGroup = messages[index + 1]?.sender !== msg.sender;
                                                const isAdmin = msg.sender === 'admin';
                                                
                                                return (
                                                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} group`}>
                                                        <div className={`max-w-[75%] space-y-1`}>
                                                            <div className={`relative p-4 text-[11px] leading-relaxed shadow-sm ${
                                                                isAdmin 
                                                                    ? 'bg-black text-white rounded-l-2xl rounded-tr-md' 
                                                                    : 'bg-white border border-gray-200 text-gray-800 rounded-r-2xl rounded-tl-md'
                                                            }`}>
                                                                {msg.text}
                                                                
                                                                {/* Message Actions */}
                                                                <div className={`absolute top-1 ${isAdmin ? 'left-1' : 'right-1'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                                    <button
                                                                        onClick={() => handleCopyMessage(msg.text)}
                                                                        className={`p-1.5 hover:bg-gray-700 transition-colors ${
                                                                            isAdmin ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:bg-gray-100'
                                                                        }`}
                                                                        title="Copy message"
                                                                    >
                                                                        <svg className="w-3 h-3" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            
                                                            {isLastInGroup && msg.timestamp && (
                                                                <p className={`text-[8px] font-bold uppercase tracking-wide text-gray-400 ${isAdmin ? 'text-right' : 'text-left'}`}>
                                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            
                                            {isUserTyping && (
                                                <div className="flex justify-start">
                                                    <div className="bg-white border border-gray-200 px-5 py-3 rounded-full flex gap-1.5">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Quick Replies (if shown) */}
                                {showQuickReplies && (
                                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[9px] font-black uppercase tracking-wide text-gray-500">Quick Replies</p>
                                            <button
                                                onClick={() => setShowQuickReplies(false)}
                                                className="text-gray-400 hover:text-black"
                                            >
                                                <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {quickReplies.map((reply, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSendMessage(null, reply)}
                                                    className="px-3 py-2 bg-white border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-all text-[9px] font-bold"
                                                >
                                                    {reply}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Input Area */}
                                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                                    <div className="flex items-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowQuickReplies(!showQuickReplies)}
                                            className={`p-3 transition-all ${
                                                showQuickReplies 
                                                    ? 'bg-black text-white' 
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                            title="Quick replies"
                                        >
                                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                            </svg>
                                        </button>

                                        <div className="flex-1 flex items-end gap-2 bg-gray-50 border border-gray-200 focus-within:border-black focus-within:bg-white transition-all p-2">
                                            <textarea
                                                ref={inputRef}
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage(e);
                                                    }
                                                }}
                                                placeholder="Type your message..."
                                                className="flex-1 bg-transparent outline-none text-[11px] font-bold resize-none max-h-32"
                                                rows="1"
                                                style={{ minHeight: '24px' }}
                                            />
                                        </div>

                                        <button 
                                            type="submit" 
                                            disabled={!newMessage.trim()}
                                            className={`p-3 transition-all ${
                                                newMessage.trim() 
                                                    ? 'bg-black text-white hover:bg-neutral-800' 
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <svg className="w-5 h-5 transform -rotate-45" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-[8px] text-gray-400 font-bold mt-2">Press Enter to send, Shift+Enter for new line</p>
                                </form>
                            </>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white space-y-6">
                                <div className="w-24 h-24 bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                    <svg className="w-12 h-12 text-gray-300" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                    </svg>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-[11px] font-black uppercase tracking-wide text-gray-400">Select a Conversation</h3>
                                    <p className="text-[9px] text-gray-400 tracking-wide">Choose a chat from the list to start messaging</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveChatAdminPage;