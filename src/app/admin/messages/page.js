'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function MessagesPage() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMessages, setSelectedMessages] = useState([]);

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
        }, (error) => {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load messages');
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Filter and search messages
    const filteredMessages = useMemo(() => {
        let filtered = [...messages];

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(msg => 
                (msg.status || 'Pending') === filterStatus
            );
        }

        // Search filter
        if (searchTerm.trim()) {
            filtered = filtered.filter(msg =>
                msg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                msg.message?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    }, [messages, filterStatus, searchTerm]);

    // Statistics
    const stats = useMemo(() => {
        const total = messages.length;
        const pending = messages.filter(m => !m.status || m.status === 'Pending').length;
        const resolved = messages.filter(m => m.status === 'Resolved').length;
        const unread = messages.filter(m => !m.read).length;

        return { total, pending, resolved, unread };
    }, [messages]);

    const handleStatusChange = async (id, newStatus) => {
        const messageRef = doc(db, 'contacts', id);
        const loadingToast = toast.loading('Updating status...');
        
        try {
            await updateDoc(messageRef, { 
                status: newStatus,
                read: true 
            });
            
            toast.success(`Message marked as ${newStatus}`, { 
                id: loadingToast,
                style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
            });
            
            if (selectedMessage && selectedMessage.id === id) {
                setSelectedMessage({ ...selectedMessage, status: newStatus, read: true });
            }
        } catch (error) {
            toast.error('Failed to update status', { id: loadingToast });
            console.error(error);
        }
    };

    const handleMarkAsRead = async (id) => {
        if (!id) return;
        
        try {
            const messageRef = doc(db, 'contacts', id);
            await updateDoc(messageRef, { read: true });
            
            if (selectedMessage && selectedMessage.id === id) {
                setSelectedMessage({ ...selectedMessage, read: true });
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this message permanently?')) {
            const loadingToast = toast.loading('Deleting message...');
            
            try {
                await deleteDoc(doc(db, 'contacts', id));
                toast.success('Message deleted successfully', { 
                    id: loadingToast,
                    style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
                });
                setSelectedMessage(null);
            } catch (error) {
                toast.error('Failed to delete message', { id: loadingToast });
                console.error(error);
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedMessages.length === 0) return;
        
        if (window.confirm(`Delete ${selectedMessages.length} selected message(s)?`)) {
            const loadingToast = toast.loading(`Deleting ${selectedMessages.length} messages...`);
            
            try {
                await Promise.all(
                    selectedMessages.map(id => deleteDoc(doc(db, 'contacts', id)))
                );
                
                toast.success(`${selectedMessages.length} messages deleted`, { id: loadingToast });
                setSelectedMessages([]);
                setSelectedMessage(null);
            } catch (error) {
                toast.error('Bulk delete failed', { id: loadingToast });
                console.error(error);
            }
        }
    };

    const handleSelectMessage = (id) => {
        setSelectedMessages(prev =>
            prev.includes(id)
                ? prev.filter(msgId => msgId !== id)
                : [...prev, id]
        );
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Subject', 'Message', 'Status', 'Date'];
        const rows = filteredMessages.map(msg => [
            msg.name || '',
            msg.email || '',
            msg.subject || '',
            msg.message || '',
            msg.status || 'Pending',
            formatDate(msg.createdAt)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `messages_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        toast.success('Messages exported successfully', {
            style: { borderRadius: '0px', background: '#000', color: '#fff' }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-[9px] uppercase tracking-[0.4em] font-black text-gray-400">Loading Messages...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-white selection:bg-black selection:text-white">
            
            {/* Left Sidebar - Message List */}
            <div className={`w-full md:w-[420px] border-r border-gray-200 bg-white h-screen flex flex-col ${selectedMessage ? 'hidden md:flex' : 'flex'}`}>
                
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-200 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Messages</h1>
                            <p className="text-[9px] uppercase tracking-wide text-gray-500 font-bold mt-1">Contact Inbox</p>
                        </div>
                        <button
                            onClick={exportToCSV}
                            className="p-3 bg-black text-white hover:bg-neutral-800 transition-all"
                            title="Export CSV"
                        >
                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-3 bg-gray-50 border border-gray-200">
                            <p className="text-lg font-black">{stats.total}</p>
                            <p className="text-[8px] uppercase tracking-wide text-gray-500 font-bold">Total</p>
                        </div>
                        <div className="text-center p-3 bg-amber-50 border border-amber-200">
                            <p className="text-lg font-black text-amber-700">{stats.pending}</p>
                            <p className="text-[8px] uppercase tracking-wide text-amber-600 font-bold">Pending</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 border border-green-200">
                            <p className="text-lg font-black text-green-700">{stats.resolved}</p>
                            <p className="text-[8px] uppercase tracking-wide text-green-600 font-bold">Resolved</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 border border-blue-200">
                            <p className="text-lg font-black text-blue-700">{stats.unread}</p>
                            <p className="text-[8px] uppercase tracking-wide text-blue-600 font-bold">Unread</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search messages..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 focus:border-black outline-none transition-all text-[10px] font-bold"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2">
                        {['all', 'Pending', 'Resolved'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`flex-1 px-3 py-2 text-[9px] font-black uppercase tracking-wide transition-all ${
                                    filterStatus === status
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {status === 'all' ? 'All' : status}
                            </button>
                        ))}
                    </div>

                    {/* Bulk Actions */}
                    {selectedMessages.length > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-blue-700">
                                {selectedMessages.length} selected
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                className="px-3 py-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-wide hover:bg-red-600 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Message List */}
                <div className="overflow-y-auto flex-grow">
                    {filteredMessages.length > 0 ? (
                        filteredMessages.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => {
                                    setSelectedMessage(msg);
                                    handleMarkAsRead(msg.id);
                                }}
                                className={`relative p-4 border-b border-gray-100 cursor-pointer transition-all group ${
                                    selectedMessage?.id === msg.id
                                        ? 'bg-black text-white'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                {/* Checkbox */}
                                <div
                                    className="absolute top-4 left-4"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectMessage(msg.id);
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedMessages.includes(msg.id)}
                                        onChange={() => {}}
                                        className="w-4 h-4 cursor-pointer"
                                    />
                                </div>

                                <div className="pl-8">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className={`text-[11px] font-black uppercase tracking-wide truncate ${
                                                    selectedMessage?.id === msg.id ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                    {msg.name}
                                                </p>
                                                {!msg.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                )}
                                            </div>
                                            <p className={`text-[9px] font-bold truncate ${
                                                selectedMessage?.id === msg.id ? 'text-gray-400' : 'text-gray-500'
                                            }`}>
                                                {msg.email}
                                            </p>
                                        </div>
                                        <span className={`text-[8px] font-bold flex-shrink-0 ml-2 ${
                                            selectedMessage?.id === msg.id ? 'text-gray-500' : 'text-gray-400'
                                        }`}>
                                            {formatDate(msg.createdAt)}
                                        </span>
                                    </div>

                                    <p className={`text-[10px] font-bold truncate mb-1 ${
                                        selectedMessage?.id === msg.id ? 'text-white' : 'text-gray-700'
                                    }`}>
                                        {msg.subject}
                                    </p>

                                    <p className={`text-[9px] line-clamp-2 ${
                                        selectedMessage?.id === msg.id ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                        {msg.message}
                                    </p>

                                    {/* Status Badge */}
                                    <div className="mt-2">
                                        <span className={`inline-block px-2 py-1 text-[8px] font-black uppercase tracking-wide ${
                                            msg.status === 'Resolved'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-amber-100 text-amber-700'
                                        } ${selectedMessage?.id === msg.id ? 'opacity-80' : ''}`}>
                                            {msg.status || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                            <svg className="w-16 h-16 text-gray-200" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-black">No messages found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Message Detail */}
            <div className={`flex-1 h-screen overflow-y-auto ${selectedMessage ? 'block' : 'hidden md:flex md:items-center md:justify-center'}`}>
                {selectedMessage ? (
                    <div className="h-full flex flex-col bg-white animate-fadeIn">
                        
                        {/* Message Header */}
                        <div className="p-6 md:p-8 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="md:hidden mb-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-wide text-gray-500 hover:text-black"
                            >
                                <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                                Back
                            </button>

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
                                        {selectedMessage.subject}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-gray-500">
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                            {selectedMessage.name}
                                        </span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span>{selectedMessage.email}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span>{formatDate(selectedMessage.createdAt)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleStatusChange(
                                            selectedMessage.id,
                                            selectedMessage.status === 'Resolved' ? 'Pending' : 'Resolved'
                                        )}
                                        className={`px-6 py-3 text-[9px] font-black uppercase tracking-wide transition-all flex items-center gap-2 ${
                                            selectedMessage.status === 'Resolved'
                                                ? 'bg-green-500 text-white hover:bg-green-600'
                                                : 'bg-black text-white hover:bg-neutral-800'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            {selectedMessage.status === 'Resolved' ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                            )}
                                        </svg>
                                        {selectedMessage.status === 'Resolved' ? 'Resolved' : 'Mark Resolved'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedMessage.id)}
                                        className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
                                        title="Delete"
                                    >
                                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Message Content */}
                        <div className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full">
                            <div className="prose prose-sm md:prose-base max-w-none">
                                <p className="text-sm md:text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
                                    {selectedMessage.message}
                                </p>
                            </div>

                            {/* Reply Button */}
                            <div className="mt-12 pt-8 border-t border-gray-200">
                                <a
                                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                    </svg>
                                    Reply to {selectedMessage.name}
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-6">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-12 h-12 text-gray-300" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-wide text-gray-400 mb-2">Select a Message</h3>
                            <p className="text-[9px] text-gray-400">Choose a message from the list to view details</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}